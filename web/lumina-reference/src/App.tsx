import React, { useState, useEffect, useRef } from 'react';
import { LampState, ConnectionConfig, LampMode } from './types';
import { LAMP_MODES } from './data/lampModes';
import { LampCanvas } from './components/LampCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { ModeSelector } from './components/ModeSelector';
import { OtaFirmwarePanel } from './components/OtaFirmwarePanel';
import { VanillaCodeExporter } from './components/VanillaCodeExporter';
import { ConnectionModal } from './components/ConnectionModal';
import {
  Sliders,
  Sparkles,
  UploadCloud,
  Code2,
  Wifi,
  Power,
  X,
  Radio,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // Main Lamp State
  const [lampState, setLampState] = useState<LampState>({
    power: true,
    brightness: 210, // 0 - 255
    speed: 130,      // 1 - 255
    scale: 85,       // 1 - 255
    modeId: 'fire',
    color: '#ff6a00',
    timerMinutes: 0
  });

  // Device Connection State
  const [connection, setConnection] = useState<ConnectionConfig>({
    ip: '192.168.4.1',
    port: 80,
    protocol: 'rest',
    isConnected: true,
    isSimulated: true,
    rssi: -56,
    freeHeap: 188,
    chipModel: 'ESP32-WROOM-32',
    firmwareVersion: 'v2.4.2-OTA',
    uptimeSeconds: 384000
  });

  // Active View Tab: 'controls' | 'modes' | 'ota' | 'vanilla'
  const [activeTab, setActiveTab] = useState<'controls' | 'modes' | 'ota' | 'vanilla'>('controls');
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);

  // Sync debouncer ref for hardware calls
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeMode = LAMP_MODES.find((m) => m.id === lampState.modeId) || LAMP_MODES[0];

  // Dispatch state change to real device if online
  const updateLampState = (partial: Partial<LampState>) => {
    setLampState((prev) => {
      const next = { ...prev, ...partial };

      // Debounced fetch to http://<ip>/set
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        const query = new URLSearchParams({
          power: next.power ? '1' : '0',
          bri: String(next.brightness),
          spd: String(next.speed),
          scl: String(next.scale),
          mode: next.modeId
        });
        const url = `http://${connection.ip}/set?${query.toString()}`;
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {
          // Gracefully handles when microcontroller is not reachable on same LAN
        });
      }, 70);

      return next;
    });
  };

  const handleSelectMode = (mode: LampMode) => {
    updateLampState({
      modeId: mode.id,
      speed: mode.defaultSpeed,
      scale: mode.defaultScale
    });
    setNetworkNotice(`Режим изменён: ${mode.name}`);
    setTimeout(() => setNetworkNotice(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-850 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Lamp Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-black text-sm">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                  Smart Lamp
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ESP32 / ESP8266
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 hidden xs:block">
                Панель управления светодиодной лампой
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-controls"
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'controls'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Управление</span>
            </button>

            <button
              id="nav-tab-modes"
              onClick={() => setActiveTab('modes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'modes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Режимы ({LAMP_MODES.length})</span>
            </button>

            <button
              id="nav-tab-ota"
              onClick={() => setActiveTab('ota')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ota'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>OTA Прошивка</span>
            </button>

            <button
              id="nav-tab-vanilla"
              onClick={() => setActiveTab('vanilla')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vanilla'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ванильный HTML/JS</span>
            </button>
          </nav>

          {/* Right: Connection Status Badge */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-connection"
              onClick={() => setIsConnModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Настройки подключения IP"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="font-mono text-[11px] hidden sm:inline">{connection.ip}</span>
              <span className="text-[11px] text-slate-400">Wi-Fi</span>
            </button>

            {/* Quick Power Toggle */}
            <button
              id="btn-quick-power"
              onClick={() => updateLampState({ power: !lampState.power })}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                lampState.power
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={lampState.power ? 'Выключить лампу' : 'Включить лампу'}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'controls' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Управление</span>
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'modes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Режимы</span>
          </button>
          <button
            onClick={() => setActiveTab('ota')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'ota' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>OTA</span>
          </button>
          <button
            onClick={() => setActiveTab('vanilla')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'vanilla' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Ванильный</span>
          </button>
        </div>
      </header>

      {/* Temporary Toast notification */}
      {networkNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-amber-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{networkNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">

        {/* TAB 1: MAIN CONTROLS (Simulator + Brightness / Speed / Scale Sliders) */}
        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Interactive 3D / 2D Canvas Simulator */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <LampCanvas state={lampState} />

              {/* Quick Effect Bar below canvas */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Быстрый выбор:</span>
                  <button
                    onClick={() => setActiveTab('modes')}
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Все {LAMP_MODES.length} эффектов &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {LAMP_MODES.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      id={`quick-mode-${m.id}`}
                      onClick={() => handleSelectMode(m)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center truncate transition-all ${
                        lampState.modeId === m.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Controls Panel (Sliders for brightness, speed, scale) */}
            <div className="lg:col-span-7">
              <ControlsPanel
                state={lampState}
                onUpdateState={updateLampState}
                activeMode={activeMode}
                onOpenModeSelector={() => setIsModeModalOpen(true)}
              />
            </div>

          </div>
        )}

        {/* TAB 2: MODE SELECTION CATALOG */}
        {activeTab === 'modes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Каталог режимов и эффектов
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Выберите анимацию для умной лампы. При выборе автоматически подставляются идеальные параметры скорости и масштаба.
                </p>
              </div>
            </div>

            <ModeSelector
              currentModeId={lampState.modeId}
              onSelectMode={handleSelectMode}
            />
          </div>
        )}

        {/* TAB 3: OTA FIRMWARE FLASHING */}
        {activeTab === 'ota' && (
          <div className="flex flex-col gap-4">
            <OtaFirmwarePanel
              connection={connection}
              onUpdateConnection={(partial) => setConnection((prev) => ({ ...prev, ...partial }))}
            />
          </div>
        )}

        {/* TAB 4: PURE VANILLA JS + HTML EXPORT */}
        {activeTab === 'vanilla' && (
          <div className="flex flex-col gap-4">
            <VanillaCodeExporter />
          </div>
        )}

      </main>

      {/* Mode Selector Modal (when opened from Controls tab) */}
      {isModeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Выбор режима лампы</h3>
              </div>
              <button
                onClick={() => setIsModeModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1">
              <ModeSelector
                currentModeId={lampState.modeId}
                onSelectMode={handleSelectMode}
                onClose={() => setIsModeModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Device Connection Modal */}
      <ConnectionModal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        config={connection}
        onUpdateConfig={(partial) => setConnection((prev) => ({ ...prev, ...partial }))}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 px-4 py-4 text-center text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Lamp Web Controller • Протоколы: HTTP / WebSockets / OTA</span>
          <span>Поддержка ESP32, ESP8266, WLED, GyverLamp, FastLED</span>
        </div>
      </footer>

    </div>
  );
}
