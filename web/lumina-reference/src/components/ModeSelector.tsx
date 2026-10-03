import React, { useState } from 'react';
import { LampMode } from '../types';
import { LAMP_MODES, CATEGORIES } from '../data/lampModes';
import {
  Search,
  Check,
  Sparkles,
  Flame,
  Terminal,
  Rainbow,
  Zap,
  Droplets,
  Star,
  RotateCw,
  PartyPopper,
  Activity,
  Sun,
  Heart
} from 'lucide-react';

interface ModeSelectorProps {
  currentModeId: string;
  onSelectMode: (mode: LampMode) => void;
  onClose?: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentModeId,
  onSelectMode,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon resolver
  const renderModeIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5' };
    switch (iconName) {
      case 'Flame': return <Flame {...props} className="w-5 h-5 text-orange-400" />;
      case 'Terminal': return <Terminal {...props} className="w-5 h-5 text-emerald-400" />;
      case 'Rainbow': return <Rainbow {...props} className="w-5 h-5 text-pink-400" />;
      case 'Sparkles': return <Sparkles {...props} className="w-5 h-5 text-teal-300" />;
      case 'Zap': return <Zap {...props} className="w-5 h-5 text-amber-400" />;
      case 'Droplets': return <Droplets {...props} className="w-5 h-5 text-fuchsia-400" />;
      case 'Star': return <Star {...props} className="w-5 h-5 text-blue-300" />;
      case 'RotateCw': return <RotateCw {...props} className="w-5 h-5 text-cyan-400" />;
      case 'PartyPopper': return <PartyPopper {...props} className="w-5 h-5 text-yellow-400" />;
      case 'Activity': return <Activity {...props} className="w-5 h-5 text-rose-400" />;
      case 'Sun': return <Sun {...props} className="w-5 h-5 text-amber-300" />;
      case 'Heart': return <Heart {...props} className="w-5 h-5 text-rose-300" />;
      default: return <Sparkles {...props} className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredModes = LAMP_MODES.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-mode-input"
            type="text"
            placeholder="Поиск эффекта..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
        {filteredModes.map((mode) => {
          const isActive = mode.id === currentModeId;
          return (
            <div
              key={mode.id}
              id={`mode-card-${mode.id}`}
              onClick={() => {
                onSelectMode(mode);
                if (onClose) onClose();
              }}
              className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Top Row: Icon, Title & Active Checkmark */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
                    {renderModeIcon(mode.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                      {mode.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {CATEGORIES.find((c) => c.id === mode.category)?.name}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {mode.description}
              </p>

              {/* Bottom Row: Palette dots & Default Speed/Scale info */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  {mode.paletteColors?.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span>Скорость: {mode.defaultSpeed}</span>
                  <span>•</span>
                  <span>Масштаб: {mode.defaultScale}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredModes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            Режимов по запросу &laquo;{searchQuery}&raquo; не найдено.
          </div>
        )}
      </div>
    </div>
  );
};
