import React, { useState } from 'react';
import { VANILLA_HTML_SOURCE, ARDUINO_CPP_HEADER } from '../data/vanillaTemplate';
import {
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Eye
} from 'lucide-react';

export const VanillaCodeExporter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'html' | 'cpp' | 'preview'>('html');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([VANILLA_HTML_SOURCE], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
              100% Vanilla JS + HTML
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Code2 className="w-5 h-5 text-amber-400" />
            Автономный код для ESP8266 / ESP32
          </h3>
          <p className="text-xs text-slate-400">
            Один файл без внешних зависимостей, библиотек и сборщиков. Вес ~15 КБ (gzip ~4 КБ).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-download-vanilla-html"
            onClick={handleDownload}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 shadow-md shadow-amber-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Скачать index.html</span>
          </button>

          <button
            id="btn-copy-code"
            onClick={() => handleCopy(activeTab === 'cpp' ? ARDUINO_CPP_HEADER : VANILLA_HTML_SOURCE)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Скопировать код в буфер обмена"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-view-html"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'html'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>index.html (Vanilla)</span>
            </button>

            <button
              id="tab-view-cpp"
              onClick={() => setActiveTab('cpp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'cpp'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>C++ PROGMEM (Arduino IDE)</span>
            </button>

            <button
              id="tab-view-preview"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Живой просмотр Vanilla</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {activeTab === 'html' ? '~15 КБ • UTF-8 • HTML5/CSS3/JS' : activeTab === 'cpp' ? 'Arduino / ESP-IDF Header' : 'Isolated Iframe Sandbox'}
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'html' && (
          <div className="relative">
            <pre className="w-full h-[450px] bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800/90 overflow-x-auto overflow-y-auto leading-relaxed select-all">
              {VANILLA_HTML_SOURCE}
            </pre>
          </div>
        )}

        {activeTab === 'cpp' && (
          <div className="relative">
            <pre className="w-full h-[450px] bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 border border-slate-800/90 overflow-x-auto overflow-y-auto leading-relaxed select-all">
              {ARDUINO_CPP_HEADER}
            </pre>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Ниже отображается полностью автономный файл <code className="text-amber-300">index.html</code>, выполняемый исключительно на чистом ванильном HTML, CSS и JavaScript без фреймворков:
            </p>
            <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
              <iframe
                title="Vanilla Smart Lamp Preview"
                srcDoc={VANILLA_HTML_SOURCE}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Zero Dependencies
            </span>
            <span className="text-slate-400">
              Не требует доступа в интернет, CDN или Node.js. Работает локально прямо из LittleFS флеш-памяти лампы.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              REST API + Debounce
            </span>
            <span className="text-slate-400">
              Слайдеры отправляют запросы <code>/set?bri=...&spd=...</code> с умным дебаунсом 60 мс, чтобы не перегружать стек ESP.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Встроенный OTA Загрузчик
            </span>
            <span className="text-slate-400">
              Включает форму <code>/update</code> с расчетом процента загрузки в реальном времени через <code>XMLHttpRequest</code>.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
