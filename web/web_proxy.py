#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP прокси-сервер для управления лампой через UDP
Запустите этот скрипт, затем откройте web_control.html в браузере
"""

import socket
import json
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time
import subprocess
import os
import tempfile
import shutil
import glob
import platform

UDP_PORT = 8888
PROXY_PORT = 9002

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Обработка CORS preflight запросов"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Обработка GET запросов"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/ping':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
            return

        elif path == '/discover':
            # Поиск лампы в сети
            result = self.discover_lamp()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        elif path == '/effects':
            qs = parse_qs(parsed_path.query)
            ip = (qs.get('ip') or [None])[0]
            if not ip:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': 'Параметр ip обязателен'
                }).encode())
                return

            result = self.fetch_effect_list(ip)
            self.send_response(200 if result.get('success') else 502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            return

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        """Обработка POST запросов"""
        if self.path == '/send':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                ip = data.get('ip')
                command = data.get('command')
                
                if not ip or not command:
                    raise ValueError("IP и команда обязательны")
                
                result = self.send_udp_command(ip, command)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': str(e)
                }).encode())
        
        elif self.path == '/ota':
            # Обработка загрузки прошивки через OTA
            try:
                # Парсим multipart/form-data
                content_type = self.headers.get('Content-Type', '')
                if not content_type.startswith('multipart/form-data'):
                    raise ValueError("Неверный Content-Type, ожидается multipart/form-data")
                
                boundary = content_type.split('boundary=')[1].encode()
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Парсим multipart данные
                parts = post_data.split(b'--' + boundary)
                firmware_data = None
                ip = None
                
                for part in parts:
                    if b'Content-Disposition: form-data' in part:
                        if b'name="firmware"' in part:
                            # Извлекаем данные файла
                            header_end = part.find(b'\r\n\r\n')
                            if header_end != -1:
                                firmware_data = part[header_end + 4:]
                                # Убираем завершающие \r\n
                                if firmware_data.endswith(b'\r\n'):
                                    firmware_data = firmware_data[:-2]
                        elif b'name="ip"' in part:
                            # Извлекаем IP адрес
                            header_end = part.find(b'\r\n\r\n')
                            if header_end != -1:
                                ip_value = part[header_end + 4:]
                                if ip_value.endswith(b'\r\n'):
                                    ip_value = ip_value[:-2]
                                ip = ip_value.decode('utf-8')
                
                if not ip:
                    raise ValueError("IP адрес обязателен")
                
                if not firmware_data:
                    raise ValueError("Файл прошивки не выбран или пуст")
                
                # Сохраняем файл во временную директорию
                with tempfile.NamedTemporaryFile(delete=False, suffix='.bin') as tmp_file:
                    tmp_path = tmp_file.name
                    tmp_file.write(firmware_data)
                
                # Используем espota.py для загрузки прошивки
                result = self.upload_firmware_ota(ip, tmp_path)
                
                # Удаляем временный файл
                try:
                    os.unlink(tmp_path)
                except:
                    pass
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': str(e)
                }).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def send_udp_command(self, ip_address, command, timeout=1, recv_size=4096):
        """Отправляет UDP команду лампе с оптимизацией"""
        try:
            # Создаем UDP сокет
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(timeout)
            # SO_REUSEADDR не нужен для UDP, но не помешает
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

            # Кодируем команду в UTF-8
            command_bytes = command.encode('utf-8')

            # Отправляем команду на указанный IP и порт
            sock.sendto(command_bytes, (ip_address, UDP_PORT))

            # Пытаемся получить ответ (таймаут для быстрого ответа)
            try:
                data, addr = sock.recvfrom(recv_size)
                response = data.split(b'\x00', 1)[0].decode('utf-8', errors='ignore')
                sock.close()
                return {
                    'success': True,
                    'response': response,
                    'from': addr[0]
                }
            except socket.timeout:
                sock.close()
                # Для команд слайдеров и некоторых других команд не ждем ответа - это нормально
                if (command.startswith('BRI') or command.startswith('SPD') or
                    command.startswith('SCA') or command.startswith('PIX') or
                    command.startswith('CLR') or command.startswith('FRM') or
                    command.startswith('ANIM')):
                    return {
                        'success': True,
                        'response': '',
                        'note': 'Команда отправлена'
                    }
                # Для других команд отсутствие ответа тоже не критично
                return {
                    'success': True,
                    'response': '',
                    'note': 'Команда отправлена, но ответ не получен'
                }

        except socket.gaierror as e:
            # Ошибка разрешения имени хоста
            return {
                'success': False,
                'error': f'Неверный IP адрес: {ip_address} ({str(e)})'
            }
        except OSError as e:
            # Ошибка сети
            return {
                'success': False,
                'error': f'Ошибка сети: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка отправки команды: {str(e)}'
            }

    @staticmethod
    def parse_ef_list_chunk(text):
        """Разбор ответа LISTn;N. Имя,p1,p2,p3,p4,p5;..."""
        if not text:
            return {}
        text = text.strip('\x00').strip()
        if text.startswith('LIST') and ';' in text:
            text = text.split(';', 1)[1]
        found = {}
        for part in text.split(';'):
            part = part.strip().strip('\n').strip('\r')
            if not part:
                continue
            m = re.match(r'^(\d+)\.\s*([^,]+)', part)
            if m:
                found[int(m.group(1))] = m.group(2).strip()
        return found

    def fetch_effect_list(self, ip_address):
        """Запрашивает LIST1..LIST3 и собирает имена эффектов по индексу."""
        by_index = {}
        chunks = {}
        errors = []

        for n in (1, 2, 3):
            cmd = f'LIST{n}'
            result = self.send_udp_command(ip_address, cmd, timeout=2.5, recv_size=8192)
            if not result.get('success'):
                errors.append(f'{cmd}: {result.get("error", "ошибка")}')
                continue
            raw = result.get('response') or ''
            chunks[cmd] = raw
            parsed = self.parse_ef_list_chunk(raw)
            if not parsed:
                errors.append(f'{cmd}: пустой или неразобранный ответ')
            else:
                by_index.update(parsed)

        if not by_index:
            return {
                'success': False,
                'error': '; '.join(errors) if errors else 'Лампа не вернула список эффектов',
                'chunks': chunks
            }

        max_idx = max(by_index)
        effects = [by_index.get(i, f'Эффект {i}') for i in range(max_idx + 1)]
        return {
            'success': True,
            'effects': effects,
            'count': len(effects),
            'warnings': errors
        }

    @staticmethod
    def parse_discover_response(response, addr_ip=None):
        """Ответ: 'IP a.b.c.d:8888' или 'IP a.b.c.d:8888:Name'. CURR — лампа жива на addr."""
        if not response:
            return None
        text = response.split('\x00', 1)[0].strip()
        if text.startswith('IP '):
            rest = text[3:].strip()
            m = re.match(r'^(\d{1,3}(?:\.\d{1,3}){3}):(\d+)', rest)
            if m:
                return {
                    'ip': m.group(1),
                    'port': m.group(2),
                    'name': rest.split(':', 2)[2] if rest.count(':') >= 2 else None
                }
        if text.startswith('CURR') and addr_ip:
            return {'ip': addr_ip, 'port': str(UDP_PORT), 'name': None}
        return None

    @staticmethod
    def local_ipv4_hosts():
        """Локальные IPv4 (не loopback) для определения /24 подсетей."""
        found = []
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            if ip and not ip.startswith('127.'):
                found.append(ip)
        except OSError:
            pass
        try:
            hostname = socket.gethostname()
            for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
                ip = info[4][0]
                if ip and not ip.startswith('127.') and ip not in found:
                    found.append(ip)
        except OSError:
            pass
        return found

    def discover_lamp(self):
        """Ищет лампу: broadcast + unicast DISCOVER на UDP :8888 по локальным /24."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(('', 0))
            except OSError:
                pass

            targets = set()
            targets.add('255.255.255.255')

            local_ips = self.local_ipv4_hosts()
            for lip in local_ips:
                parts = lip.split('.')
                if len(parts) != 4:
                    continue
                prefix = '.'.join(parts[:3])
                targets.add(f'{prefix}.255')
                for host in range(1, 255):
                    targets.add(f'{prefix}.{host}')

            # Сначала broadcast / .255, потом остальное
            ordered = []
            for prefer in ('255.255.255.255',):
                if prefer in targets:
                    ordered.append(prefer)
                    targets.discard(prefer)
            for t in sorted(targets, key=lambda x: (0 if x.endswith('.255') else 1, x)):
                ordered.append(t)

            payload = b'DISCOVER'
            for ip in ordered:
                try:
                    sock.sendto(payload, (ip, UDP_PORT))
                except OSError:
                    continue

            deadline = time.time() + 2.8
            seen = {}
            while time.time() < deadline:
                remaining = deadline - time.time()
                if remaining <= 0:
                    break
                sock.settimeout(min(0.2, remaining))
                try:
                    data, addr = sock.recvfrom(2048)
                except socket.timeout:
                    continue
                except OSError:
                    break

                text = data.decode('utf-8', errors='ignore')
                parsed = self.parse_discover_response(text, addr[0])
                if not parsed:
                    continue
                key = parsed['ip']
                if key not in seen:
                    seen[key] = parsed

            sock.close()

            if not seen:
                return {
                    'success': False,
                    'error': (
                        'Лампа не ответила на UDP :8888. Проверьте, что ПК и лампа в одной '
                        'сети (2.4 ГГц), и что прошивка слушает DISCOVER.'
                    )
                }

            lamps = list(seen.values())
            primary = lamps[0]
            return {
                'success': True,
                'ip': primary['ip'],
                'port': primary.get('port') or str(UDP_PORT),
                'name': primary.get('name'),
                'lamps': lamps
            }
        except OSError as e:
            return {
                'success': False,
                'error': f'Ошибка сети при поиске лампы: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка поиска лампы: {str(e)}'
            }

    def upload_firmware_ota(self, ip, firmware_path):
        """Загружает прошивку на ESP32/ESP8266 через OTA используя espota.py"""
        try:
            # Ищем espota.py в стандартных местах для ESP32 и ESP8266
            espota_paths = [
                'espota.py',
                '/usr/local/bin/espota.py',
                # ESP32 пути
                os.path.expanduser('~/.arduino15/packages/esp32/tools/espota.py'),
                os.path.expanduser('~/.arduino15/packages/esp32/tools/espota/espota.py'),
                os.path.expanduser('~/.arduino15/packages/esp32/hardware/esp32/*/tools/espota.py'),
                # ESP8266 пути (для совместимости)
                os.path.expanduser('~/.arduino15/packages/esp8266/tools/espota.py'),
                os.path.expanduser('~/.arduino15/packages/esp8266/tools/espota/espota.py'),
                # PlatformIO пути
                os.path.expanduser('~/.platformio/packages/tool-esptoolpy/espota.py'),
            ]
            
            espota_path = None
            for path in espota_paths:
                if os.path.exists(path):
                    espota_path = path
                    break
            
            if not espota_path:
                # Пытаемся найти через which или where (Windows)
                try:
                    if platform.system() == 'Windows':
                        result = subprocess.run(['where', 'espota.py'],
                                              capture_output=True, text=True, timeout=2)
                    else:
                        result = subprocess.run(['which', 'espota.py'],
                                              capture_output=True, text=True, timeout=2)
                    if result.returncode == 0:
                        espota_path = result.stdout.strip().split('\n')[0]
                except:
                    pass
            
            # Также проверяем glob для путей с wildcards и ищем в стандартных местах Arduino
            if not espota_path:
                # Ищем в стандартных местах Arduino для ESP32
                arduino_base = os.path.expanduser('~/.arduino15/packages/esp32')
                if os.path.exists(arduino_base):
                    # Ищем espota.py в подпапках tools
                    for root, dirs, files in os.walk(os.path.join(arduino_base, 'tools')):
                        if 'espota.py' in files:
                            espota_path = os.path.join(root, 'espota.py')
                            break
                
                # Если не нашли для ESP32, ищем для ESP8266
                if not espota_path:
                    arduino_base = os.path.expanduser('~/.arduino15/packages/esp8266')
                    if os.path.exists(arduino_base):
                        for root, dirs, files in os.walk(os.path.join(arduino_base, 'tools')):
                            if 'espota.py' in files:
                                espota_path = os.path.join(root, 'espota.py')
                                break
            
            if not espota_path:
                # espota.py не найден - используем HTTP метод
                print(f"[{time.strftime('%H:%M:%S')}] ⚠️  espota.py не найден, используем HTTP метод...")
                print(f"[{time.strftime('%H:%M:%S')}] Для лучшей совместимости рекомендуется установить espota.py")
                return self.upload_firmware_http(ip, firmware_path)
            
            # Запускаем espota.py
            # espota.py -i IP -p PORT -f FILE -a PASSWORD
            port = 8266  # Стандартный порт OTA для ESP32/ESP8266 (ESP_OTA_PORT из Constants.h)
            password = "12345678"  # AP_PASS из Constants.h (по умолчанию "12345678", но может быть изменен)
            
            cmd = ['python3', espota_path, '-i', ip, '-p', str(port), 
                   '-f', firmware_path, '-a', password]
            
            print(f"[{time.strftime('%H:%M:%S')}] Загрузка прошивки на {ip}...")
            print(f"[{time.strftime('%H:%M:%S')}] Это может занять несколько минут. Следите за прогрессом на матрице лампы.")
            
            # Выводим прогресс в реальном времени
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
                                      text=True, bufsize=1, universal_newlines=True)
            
            output_lines = []
            for line in process.stdout:
                line = line.strip()
                if line:
                    output_lines.append(line)
                    # Выводим важные сообщения
                    if 'progress' in line.lower() or '%' in line or 'uploading' in line.lower():
                        print(f"[{time.strftime('%H:%M:%S')}] {line}")
            
            process.wait()
            result_code = process.returncode
            
            if result_code == 0:
                print(f"[{time.strftime('%H:%M:%S')}] ✓ Прошивка успешно загружена!")
                print(f"[{time.strftime('%H:%M:%S')}] Устройство перезагружается...")
                return {
                    'success': True,
                    'message': 'Прошивка успешно загружена. Устройство перезагружается.'
                }
            else:
                error_msg = '\n'.join(output_lines[-5:]) if output_lines else 'Неизвестная ошибка'
                print(f"[{time.strftime('%H:%M:%S')}] ✗ Ошибка загрузки прошивки: {error_msg}")
                return {
                    'success': False,
                    'error': f'Ошибка espota.py: {error_msg}'
                }
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Таймаут загрузки прошивки (более 5 минут)'
            }
        except Exception as e:
            # Пробуем альтернативный метод
            try:
                return self.upload_firmware_http(ip, firmware_path)
            except Exception as e2:
                return {
                    'success': False,
                    'error': f'Ошибка загрузки: {str(e)} (альтернативный метод: {str(e2)})'
                }
    
    def upload_firmware_http(self, ip, firmware_path):
        """Альтернативный метод загрузки прошивки через HTTP POST"""
        try:
            import requests
            from requests.auth import HTTPBasicAuth
            
            # ArduinoOTA использует endpoint /update с базовой аутентификацией
            url = f'http://{ip}:8266/update'
            password = "12345678"  # AP_PASS из Constants.h (по умолчанию "12345678", но может быть изменен)
            
            # Проверяем, что OTA сервер доступен (попытка подключения)
            print(f"[{time.strftime('%H:%M:%S')}] Проверка доступности OTA сервера на {ip}:8266...")
            max_retries = 5
            retry_delay = 1
            server_available = False
            
            for attempt in range(max_retries):
                try:
                    # Простая проверка доступности порта
                    test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    test_sock.settimeout(2)
                    result = test_sock.connect_ex((ip, 8266))
                    test_sock.close()
                    if result == 0:
                        server_available = True
                        print(f"[{time.strftime('%H:%M:%S')}] ✓ OTA сервер доступен!")
                        break
                    else:
                        print(f"[{time.strftime('%H:%M:%S')}] Попытка {attempt + 1}/{max_retries}: порт 8266 недоступен, ждем {retry_delay} сек...")
                        if attempt < max_retries - 1:
                            time.sleep(retry_delay)
                except Exception as e:
                    print(f"[{time.strftime('%H:%M:%S')}] Ошибка проверки: {str(e)}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
            
            if not server_available:
                return {
                    'success': False,
                    'error': f'OTA сервер недоступен на {ip}:8266 после {max_retries} попыток.\n\n'
                            f'Убедитесь, что:\n'
                            f'1. Лампа активирована в режим OTA (нажмите "Активировать режим OTA")\n'
                            f'2. Лампа подключена к WiFi сети\n'
                            f'3. IP адрес правильный ({ip})\n'
                            f'4. Прошло не более 5 минут с момента активации OTA'
                }
            
            print(f"[{time.strftime('%H:%M:%S')}] Начинаем загрузку прошивки...")
            
            # ArduinoOTA использует базовую HTTP аутентификацию
            # Пароль передается через HTTP Basic Auth, файл через multipart/form-data
            with open(firmware_path, 'rb') as f:
                # Используем базовую аутентификацию (пустое имя пользователя, пароль в пароле)
                auth = HTTPBasicAuth('', password)
                
                # Отправляем файл как multipart/form-data с базовой аутентификацией
                files = {'firmware': (os.path.basename(firmware_path), f, 'application/octet-stream')}
                
                response = requests.post(url, files=files, auth=auth, timeout=300)
                
                if response.status_code == 200:
                    print(f"[{time.strftime('%H:%M:%S')}] ✓ Прошивка успешно загружена через HTTP!")
                    return {
                        'success': True,
                        'message': 'Прошивка успешно загружена через HTTP. Устройство перезагружается.'
                    }
                elif response.status_code == 401:
                    return {
                        'success': False,
                        'error': f'Ошибка аутентификации (HTTP 401). Проверьте пароль OTA.'
                    }
                else:
                    return {
                        'success': False,
                        'error': f'HTTP {response.status_code}: {response.text[:200]}'
                    }
        except ImportError:
            return {
                'success': False,
                'error': 'Для загрузки прошивки установите espota.py или библиотеку requests: pip3 install requests'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка HTTP загрузки: {str(e)}'
            }

    def log_message(self, format, *args):
        """Переопределяем логирование для более чистого вывода"""
        print(f"[{time.strftime('%H:%M:%S')}] {format % args}")

def run_server(port=PROXY_PORT):
    """Запускает HTTP прокси-сервер"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f"=" * 60)
    print(f"HTTP прокси-сервер запущен на порту {port}")
    print(f"Откройте web_control.html в браузере")
    print(f"Для остановки нажмите Ctrl+C")
    print(f"=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановка сервера...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()

