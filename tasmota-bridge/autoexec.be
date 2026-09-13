# GyverLamp UDP bridge v8 - probe CURR, status LED while offline
# offline: orange blink; online: 3x green then idle
# red -> fire; green/blue -> next; Dimmer -> BRI; Power -> P_ON/P_OFF
import string
import light

GYVER_PORT = 8888
MODE_AMOUNT = 94

var gyver_ip = ""
var gyver_online = false
var last_zone = ""
var last_bri = -1
var gyver_mode = -1
var busy = false
var disc_tick = 0

var led_ui = false
var led_blink = 0
var found_flash = 0
var need_celebrate = false

def gyver_save_ip()
  try
    import persist
    persist.gyver_ip = gyver_ip
    persist.save()
  except ..
  end
end

def gyver_load_ip()
  try
    import persist
    var p = persist.gyver_ip
    if p != nil && size(str(p)) > 6
      gyver_ip = str(p)
      print("GYVER cached " + gyver_ip)
    end
  except ..
  end
end

def gyver_parse_discover(s)
  var p = string.split(s, " ")
  if size(p) < 2 return "" end
  if p[0] != "IP" return "" end
  var q = string.split(p[1], ":")
  if size(q) < 1 return "" end
  return q[0]
end

def gyver_bcast_list()
  var addrs = ["255.255.255.255"]
  try
    var ip = tasmota.wifi()['ip']
    var p = string.split(str(ip), ".")
    if size(p) == 4
      addrs.push(p[0] + "." + p[1] + "." + p[2] + ".255")
    end
  except ..
  end
  return addrs
end

# Real liveness: must get CURR back. UDP send-ok means nothing.
def gyver_probe(ip)
  if size(ip) < 7 return false end
  try
    var u = udp()
    u.begin("", 0)
    u.send(ip, GYVER_PORT, bytes().fromstring("GET"))
    var i = 0
    while i < 20
      var resp = u.read()
      if resp != nil
        var s = resp.asstring()
        if string.find(s, "CURR") == 0
          u.close()
          return true
        end
      end
      tasmota.delay(25)
      i = i + 1
    end
    u.close()
  except .. as e, m
    print("GYVER probe err " + str(m))
  end
  return false
end

def gyver_mark_offline()
  if gyver_online
    print("GYVER offline")
  end
  gyver_online = false
  need_celebrate = false
  found_flash = 0
end

def gyver_mark_online(ip)
  var was = gyver_online
  gyver_ip = ip
  gyver_online = true
  gyver_save_ip()
  if !was
    need_celebrate = true
    print("GYVER online " + gyver_ip)
  end
end

def led_rgb(rgb, bri)
  try
    led_ui = true
    light.set({'power': true, 'rgb': rgb, 'bri': bri})
  except .. as e, m
    print("GYVER led err " + str(m))
  end
end

def led_tick()
  # celebrating: 3 green flashes
  if found_flash > 0
    if found_flash % 2 == 0
      led_rgb("00FF00", 200)
    else
      led_rgb("000000", 0)
    end
    found_flash = found_flash - 1
    if found_flash == 0
      try
        light.set({'power': true, 'rgb': "404040", 'bri': 40})
      except ..
      end
      last_zone = "low"
      last_bri = 40
      led_ui = false
    end
    return true
  end

  if need_celebrate && gyver_online
    need_celebrate = false
    found_flash = 6
    led_ui = true
    print("GYVER LED celebrate")
    return true
  end

  # keep blinking until CURR-proven online
  if !gyver_online
    led_blink = (led_blink + 1) % 4
    if led_blink < 2
      led_rgb("FF6600", 120)
    else
      led_rgb("000000", 0)
    end
    return true
  end

  return false
end

def gyver_discover()
  if busy return false end

  # 1) cached IP first
  if size(gyver_ip) > 6
    if gyver_probe(gyver_ip)
      gyver_mark_online(gyver_ip)
      return true
    end
  end

  # 2) DISCOVER broadcast, then probe each candidate
  try
    var u = udp()
    u.begin("", 0)
    var addrs = gyver_bcast_list()
    var a = 0
    while a < size(addrs)
      u.send(addrs[a], GYVER_PORT, bytes().fromstring("DISCOVER"))
      a = a + 1
    end
    var i = 0
    while i < 25
      var resp = u.read()
      if resp != nil
        var s = resp.asstring()
        var ip = gyver_parse_discover(s)
        if size(ip) > 6
          u.close()
          if gyver_probe(ip)
            gyver_mark_online(ip)
            return true
          end
          # reopen for more replies
          u = udp()
          u.begin("", 0)
        end
      end
      tasmota.delay(20)
      i = i + 1
    end
    u.close()
  except .. as e, m
    print("GYVER discover err " + str(m))
  end

  gyver_mark_offline()
  return false
end

def gyver(s)
  if !gyver_online
    gyver_discover()
  end
  if !gyver_online
    print("GYVER no lamp for " + str(s))
    return false
  end
  try
    var u = udp()
    u.begin("", 0)
    var ok = u.send(gyver_ip, GYVER_PORT, bytes().fromstring(s))
    u.close()
    print("GYVER " + str(s) + " -> " + gyver_ip + " " + str(ok))
    return ok
  except .. as e, m
    print("GYVER err " + str(m))
    gyver_mark_offline()
    return false
  end
end

def gyver_next()
  if gyver_mode < 0
    gyver_mode = 0
    print("GYVER next: mode unknown, start 0")
  end
  gyver_mode = (gyver_mode + 1) % MODE_AMOUNT
  gyver("EFF" + str(gyver_mode))
  gyver("P_ON")
end

def rearm()
  try
    light.set({'sat': 0})
  except .. as e, m
    print("GYVER rearm err " + str(m))
  end
  last_zone = "low"
end

def zone_of(hue, sat, bri)
  if sat < 160 || bri < 40
    return "low"
  end
  if hue <= 20 || hue >= 340
    return "red"
  end
  if hue >= 100 && hue <= 155
    return "green"
  end
  if hue >= 200 && hue <= 260
    return "blue"
  end
  return "other"
end

def sync_bri(bri)
  if led_ui || busy || !gyver_online return end
  if bri == last_bri return end
  if last_bri >= 0 && bri > last_bri - 4 && bri < last_bri + 4
    return
  end
  last_bri = bri
  var g = bri
  if g < 1 g = 1 end
  if g > 255 g = 255 end
  gyver("BRI" + str(g))
end

def apply_zone(z)
  if led_ui || !gyver_online return end
  if z == last_zone return end
  if busy
    print("GYVER skip zone " + str(z) + " busy")
    return
  end
  print("GYVER zone " + str(last_zone) + " -> " + str(z))
  last_zone = z
  if z == "red"
    busy = true
    try
      gyver_mode = 19
      gyver("EFF19")
      gyver("P_ON")
      rearm()
    except .. as e, m
      print("GYVER red err " + str(m))
    end
    busy = false
  elif z == "green" || z == "blue"
    busy = true
    try
      gyver_next()
      rearm()
    except .. as e, m
      print("GYVER next-zone err " + str(m))
    end
    busy = false
  end
end

def poll_color()
  if led_ui || !gyver_online return end
  try
    var l = light.get()
    if l == nil return end
    var hue = int(l['hue'])
    var sat = int(l['sat'])
    var bri = int(l['bri'])
    sync_bri(bri)
    apply_zone(zone_of(hue, sat, bri))
  except .. as e, m
    print("GYVER poll err " + str(m))
    busy = false
  end
end

def on_hsb(v)
  if led_ui || !gyver_online return end
  var s = str(v)
  print("GYVER hsb " + s)
  var p = string.split(s, ",")
  if size(p) < 2 return end
  var hue = int(p[0])
  var sat = int(p[1]) * 255 / 100
  var bri = 255
  if size(p) >= 3
    bri = int(p[2]) * 255 / 100
  end
  sync_bri(bri)
  apply_zone(zone_of(hue, sat, bri))
end

tasmota.add_cmd("Gyver", def (cmd, idx, payload)
  if payload == "NEXT" || payload == "next"
    gyver_next()
  elif payload == "DISCOVER" || payload == "discover"
    gyver_mark_offline()
    gyver_discover()
  elif string.find(payload, "IP ") == 0 || string.find(payload, "ip ") == 0
    gyver_ip = string.split(payload, " ")[1]
    gyver_save_ip()
    gyver_mark_offline()
    if gyver_probe(gyver_ip)
      gyver_mark_online(gyver_ip)
    end
    print("GYVER set " + gyver_ip + " online=" + str(gyver_online))
  else
    gyver(payload)
  end
  tasmota.resp_cmnd_done()
end)

tasmota.add_rule("Power1#State", def (v)
  if led_ui return end
  busy = false
  last_zone = ""
  if int(v)
    gyver("P_ON")
  else
    gyver("P_OFF")
  end
end, "gyver_pwr")

tasmota.add_rule("HSBColor", on_hsb, "gyver_hsb")
tasmota.add_rule("Color", def (v) poll_color() end, "gyver_col")
tasmota.add_rule("Dimmer", def (v) poll_color() end, "gyver_dim")

class GyverPoll
  def every_250ms()
    if led_tick()
      # status LED owns RGB
    else
      poll_color()
    end
    disc_tick = disc_tick + 1
    if !gyver_online
      if disc_tick % 20 == 0
        gyver_discover()
      end
    elif disc_tick % 40 == 0
      # health check every ~10s
      if !gyver_probe(gyver_ip)
        gyver_mark_offline()
      end
    end
  end
end
tasmota.add_driver(GyverPoll())

gyver_load_ip()
gyver_mark_offline()
gyver_discover()

try
  var l0 = light.get()
  if l0 != nil
    last_bri = int(l0['bri'])
    last_zone = zone_of(int(l0['hue']), int(l0['sat']), last_bri)
    print("GYVER seed zone " + str(last_zone) + " bri " + str(last_bri))
  end
except ..
end

print("GYVER bridge ready (v8 probe+LED)")
