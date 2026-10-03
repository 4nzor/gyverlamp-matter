import React from 'react';
import { LampState, LampMode } from '../types';
import {
  Sun,
  Moon,
  Gauge,
  Sliders,
  Power,
  Clock,
  Sparkles,
  RotateCcw,
  Zap
} from 'lucide-react';

interface ControlsPanelProps {
  state: LampState;
  onUpdateState: (partial: Partial<LampState>) => void;
  activeMode: LampMode;
  onOpenModeSelector: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  state,
  onUpdateState,
  activeMode,
  onOpenModeSelector
}) => {
  const briPercent = Math.round((state.brightness / 255) * 100);

  // Speed description helper
  const getSpeedLabel = (spd: number) => {
    if (spd < 65) return 'Медленно';
    if (spd < 130) return 'Плавно';
    if (spd < 195) return 'Энергично';
    return 'Турбо';
  };

  // Scale description helper
  const getScaleLabel = (scl: number) => {
    if (scl < 65) return 'Мелкий / Плотный';
    if (scl < 130) return 'Сбалансированный';
    if (scl < 195) return 'Крупный узор';
    return 'Макро масштаб';
  };

  const briPresets = [10, 25, 50, 75, 100];

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header: Main Power & Active Mode Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left: Mode Quick-Card */}
        <div className="flex items-center gap-3.5">
          <div
            onClick={onOpenModeSelector}
            className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 cursor-pointer hover:scale-105 hover:bg-amber-500/25 transition-all shadow-inner"
            title="Выбрать другой режим"
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
                Текущий эффект
              </span>
              <button
                id="btn-switch-mode-inline"
                onClick={onOpenModeSelector}
                className="text-[11px] font-medium text-slate-400 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Сменить
              </button>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {activeMode.name}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-[280px]">
              {activeMode.description}
            </p>
          </div>
        </div>

        {/* Right: Master Power Button */}
        <button
          id="btn-master-power"
          onClick={() => onUpdateState({ power: !state.power })}
          className={`relative self-center sm:self-auto px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md ${
            state.power
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-amber-500/25 ring-2 ring-amber-400/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Power className={`w-5 h-5 transition-transform ${state.power ? 'scale-110' : ''}`} />
          <span>{state.power ? 'Включена' : 'Включить'}</span>
        </button>
      </div>

      {/* Main Controls Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
        
        {/* 1. ЯРКОСТЬ (BRIGHTNESS) */}
        <div className="flex flex-col gap-2.5" id="control-brightness-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Яркость</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {state.brightness}/255
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                {briPercent}%
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              id="slider-brightness"
              type="range"
              min="0"
              max="255"
              step="1"
              value={state.brightness}
              onChange={(e) => onUpdateState({ brightness: Number(e.target.value) })}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            />
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          {/* Quick Percent Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Быстро:</span>
            {briPresets.map((pct) => {
              const targetVal = Math.round((pct / 100) * 255);
              const isActive = Math.abs(state.brightness - targetVal) < 5;
              return (
                <button
                  key={pct}
                  id={`btn-bri-${pct}`}
                  onClick={() => onUpdateState({ brightness: targetVal })}
                  className={`flex-1 sm:flex-none px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* 2. СКОРОСТЬ (SPEED) */}
        <div className="flex flex-col gap-2.5" id="control-speed-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Скорость эффекта</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400/90 font-medium">
                {getSpeedLabel(state.speed)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
                {state.speed}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <button
              id="btn-spd-minus"
              onClick={() => onUpdateState({ speed: Math.max(1, state.speed - 15) })}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700"
              title="-15"
            >
              -
            </button>
            <input
              id="slider-speed"
              type="range"
              min="1"
              max="255"
              step="1"
              value={state.speed}
              onChange={(e) => onUpdateState({ speed: Number(e.target.value) })}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <button
              id="btn-spd-plus"
              onClick={() => onUpdateState({ speed: Math.min(255, state.speed + 15) })}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700"
              title="+15"
            >
              +
            </button>
            <button
              id="btn-spd-reset"
              onClick={() => onUpdateState({ speed: activeMode.defaultSpeed })}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-400 hover:text-white shrink-0 flex items-center gap-1"
              title="Сбросить к рекомендованной для эффекта"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Авто</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* 3. МАСШТАБ (SCALE) */}
        <div className="flex flex-col gap-2.5" id="control-scale-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Масштаб элементов</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-400/90 font-medium">
                {getScaleLabel(state.scale)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold font-mono">
                {state.scale}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <button
              id="btn-scl-minus"
              onClick={() => onUpdateState({ scale: Math.max(1, state.scale - 15) })}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700"
              title="-15"
            >
              -
            </button>
            <input
              id="slider-scale"
              type="range"
              min="1"
              max="255"
              step="1"
              value={state.scale}
              onChange={(e) => onUpdateState({ scale: Number(e.target.value) })}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
            />
            <button
              id="btn-scl-plus"
              onClick={() => onUpdateState({ scale: Math.min(255, state.scale + 15) })}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700"
              title="+15"
            >
              +
            </button>
            <button
              id="btn-scl-reset"
              onClick={() => onUpdateState({ scale: activeMode.defaultScale })}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-400 hover:text-white shrink-0 flex items-center gap-1"
              title="Сбросить к рекомендованному для эффекта"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Авто</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* Sleep Timer Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Таймер сна:</span>
          </div>
          <div className="flex items-center gap-1">
            {[0, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                id={`btn-timer-${mins}`}
                onClick={() => onUpdateState({ timerMinutes: mins })}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  state.timerMinutes === mins
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {mins === 0 ? 'Выкл' : `${mins} мин`}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
