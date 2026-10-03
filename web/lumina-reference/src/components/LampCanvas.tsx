import React, { useEffect, useRef, useState } from 'react';
import { LampState } from '../types';
import { Eye, Cylinder, Grid3X3, Sparkles } from 'lucide-react';

interface LampCanvasProps {
  state: LampState;
}

export const LampCanvas: React.FC<LampCanvasProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'cylinder' | 'matrix'>('cylinder');
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const angleRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  // Matrix dimensions (standard 16 cols x 16 rows or 32 cols x 16 rows for cylindrical wrap)
  const COLS = 28;
  const ROWS = 16;

  // Track dragging for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    angleRef.current += delta * 0.015;
    setCylinderAngle(angleRef.current);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer for matrix colors
    const matrixBuffer: { r: number; g: number; b: number }[][] = Array.from({ length: COLS }, () =>
      Array.from({ length: ROWS }, () => ({ r: 0, g: 0, b: 0 }))
    );

    const render = () => {
      // Advance animation tick with speed factor
      const spdFactor = (state.speed / 128);
      tickRef.current += 0.04 * spdFactor;
      const t = tickRef.current;

      // Auto-slow rotate in cylinder mode when not dragging
      if (!isDraggingRef.current && viewMode === 'cylinder') {
        angleRef.current += 0.004 * Math.min(1.5, Math.max(0.3, spdFactor));
        setCylinderAngle(angleRef.current);
      }

      const sclFactor = state.scale / 100;
      const briFactor = state.power ? (state.brightness / 255) : 0;

      // 1. Calculate matrix colors according to active mode
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          let r = 0, g = 0, b = 0;

          if (!state.power) {
            // Powered off
            r = 0; g = 0; b = 0;
          } else {
            switch (state.modeId) {
              case 'fire': {
                // Rising fire algorithm
                const noise1 = Math.sin(x * 0.4 * sclFactor + t * 2) * Math.cos(y * 0.3 - t * 4);
                const noise2 = Math.sin((x + 5) * 0.8 * sclFactor - t * 3) * Math.sin(y * 0.6 - t * 5);
                const flameY = (1 - y / ROWS);
                const heat = Math.max(0, Math.min(1, flameY * 1.3 + (noise1 * 0.35 + noise2 * 0.25)));
                r = Math.min(255, Math.floor(255 * heat * 1.2));
                g = Math.min(255, Math.floor(160 * Math.pow(heat, 1.8)));
                b = Math.min(255, Math.floor(30 * Math.pow(heat, 4)));
                break;
              }
              case 'matrix': {
                // Cyberpunk digital rain
                const colSeed = Math.sin(x * 123.45) * 1000;
                const dropPos = (Math.floor(t * 12 + colSeed)) % (ROWS + 6);
                const dist = dropPos - y;
                if (dist === 0) {
                  r = 200; g = 255; b = 200; // Leading white-green glyph
                } else if (dist > 0 && dist < 7) {
                  const fade = 1 - (dist / 7);
                  r = 0;
                  g = Math.floor(255 * fade);
                  b = Math.floor(40 * fade);
                } else {
                  r = 0; g = 6; b = 2;
                }
                break;
              }
              case 'rainbow': {
                // 3D diagonal rainbow wave
                const hue = (x * 14 * sclFactor + y * 10 + t * 40) % 360;
                const rad = (hue * Math.PI) / 180;
                r = Math.floor((Math.sin(rad) + 1) * 127.5);
                g = Math.floor((Math.sin(rad + 2.094) + 1) * 127.5); // +120 deg
                b = Math.floor((Math.sin(rad + 4.188) + 1) * 127.5); // +240 deg
                break;
              }
              case 'aurora': {
                // Polar lights
                const waveA = Math.sin(x * 0.25 * sclFactor + t * 1.2);
                const waveB = Math.cos(y * 0.35 * sclFactor - t * 0.8);
                const wave = waveA + waveB;
                r = Math.floor(Math.max(0, Math.sin(wave) * 100));
                g = Math.floor(Math.max(0, Math.sin(wave + 1.2) * 255));
                b = Math.floor(Math.max(0, Math.cos(wave * 0.8) * 230));
                break;
              }
              case 'candle': {
                // Organic flickering candle flame
                const flicker = Math.sin(t * 8) * 0.08 + Math.cos(t * 19) * 0.05 + (Math.random() - 0.5) * 0.05;
                const candleY = 1 - (y / ROWS);
                const shape = Math.max(0, 1 - Math.abs(x - COLS / 2) / (4 * sclFactor));
                const intensity = Math.max(0, Math.min(1, (candleY + flicker) * shape * 1.4));
                r = Math.floor(255 * intensity);
                g = Math.floor(135 * Math.pow(intensity, 1.4));
                b = Math.floor(20 * Math.pow(intensity, 3));
                break;
              }
              case 'lava': {
                // Lava lamp blobs
                const blob1 = Math.sin(x * 0.2 * sclFactor + t * 0.9) * Math.sin(y * 0.35 - t * 1.1);
                const blob2 = Math.cos(x * 0.3 * sclFactor - t * 0.7) * Math.cos(y * 0.2 + t * 0.8);
                const blob = blob1 + blob2;
                if (blob > 0.4) {
                  r = 255; g = 10; b = 120;
                } else if (blob > 0) {
                  r = 180; g = 0; b = 255;
                } else {
                  r = 20; g = 10; b = 70;
                }
                break;
              }
              case 'starfall': {
                // Twinkling stars with shooting stars
                const starVal = Math.sin(x * 33.1 + y * 97.4 + t * 3);
                if (starVal > 0.94) {
                  r = 255; g = 255; b = 255;
                } else if (starVal > 0.8) {
                  r = 140; g = 180; b = 255;
                } else {
                  r = 6; g = 8; b = 24;
                }
                break;
              }
              case 'whirlpool': {
                // Radial swirl
                const cx = COLS / 2;
                const cy = ROWS / 2;
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const spiral = (angle + dist * 0.4 * sclFactor - t * 3) % (Math.PI * 2);
                const lum = (Math.sin(spiral * 2) + 1) * 0.5;
                r = Math.floor(lum * 30);
                g = Math.floor(lum * 220);
                b = Math.floor(lum * 255);
                break;
              }
              case 'confetti': {
                const confHue = (x * 47 + y * 89 + Math.floor(t * 4)) % 360;
                const pop = Math.sin(x * 12.3 + y * 5.7 + t * 2);
                if (pop > 0.5) {
                  const rad = (confHue * Math.PI) / 180;
                  r = Math.floor((Math.sin(rad) + 1) * 127);
                  g = Math.floor((Math.sin(rad + 2) + 1) * 127);
                  b = Math.floor((Math.sin(rad + 4) + 1) * 127);
                } else {
                  r = 10; g = 8; b = 15;
                }
                break;
              }
              case 'pulse': {
                const cx = COLS / 2;
                const cy = ROWS / 2;
                const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                const wave = (dist * 0.6 * sclFactor - t * 3) % (Math.PI * 2);
                const intensity = (Math.sin(wave) + 1) * 0.5;
                r = Math.floor(255 * intensity);
                g = Math.floor(40 * intensity);
                b = Math.floor(130 * intensity);
                break;
              }
              case 'warm_white': {
                r = 255; g = 210; b = 150;
                break;
              }
              case 'breathing': {
                const breath = (Math.sin(t * 2) + 1) * 0.5;
                r = Math.floor((220 + breath * 35));
                g = Math.floor((120 + breath * 90));
                b = Math.floor((180 + breath * 75));
                break;
              }
              default: {
                r = 255; g = 140; b = 20;
              }
            }
          }

          // Store scaled by brightness
          matrixBuffer[x][y] = {
            r: Math.floor(r * briFactor),
            g: Math.floor(g * briFactor),
            b: Math.floor(b * briFactor)
          };
        }
      }

      // 2. Draw on Canvas
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background ambient vignette
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.6);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (viewMode === 'cylinder') {
        // --- 3D CYLINDRICAL LAMP VIEW ---
        const lampW = Math.min(180, width * 0.36);
        const lampH = Math.min(270, height * 0.68);
        const centerX = width / 2;
        const centerY = height / 2 - 10;
        const topY = centerY - lampH / 2;
        const botY = centerY + lampH / 2;

        // Realistic Ambient Glow on Wall & Desk
        if (state.power && state.brightness > 5) {
          const glowR = (lampW * 1.5) * (0.6 + (state.brightness / 255) * 0.6);
          // Sample average center color
          const sample = matrixBuffer[Math.floor(COLS / 2)][Math.floor(ROWS / 2)];
          const glowGrad = ctx.createRadialGradient(centerX, centerY, lampW * 0.3, centerX, centerY, glowR);
          glowGrad.addColorStop(0, `rgba(${sample.r}, ${sample.g}, ${sample.b}, ${0.38 * (state.brightness / 255)})`);
          glowGrad.addColorStop(0.5, `rgba(${sample.r}, ${sample.g}, ${sample.b}, ${0.12 * (state.brightness / 255)})`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Table Ellipse shadow / glow reflection
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, botY + 22, lampW * 0.75, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#050914';
        ctx.fill();
        ctx.restore();

        // Wooden Lamp Base (Cylinder bottom)
        const baseH = 26;
        const baseGrad = ctx.createLinearGradient(centerX - lampW * 0.55, 0, centerX + lampW * 0.55, 0);
        baseGrad.addColorStop(0, '#1c130d');
        baseGrad.addColorStop(0.3, '#3e2a1e');
        baseGrad.addColorStop(0.7, '#2b1b13');
        baseGrad.addColorStop(1, '#140c08');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(centerX - lampW * 0.52, botY, lampW * 1.04, baseH, [0, 0, 10, 10]);
        ctx.fill();
        // Standby LED on base
        ctx.fillStyle = state.power ? '#22c55e' : '#ef4444';
        ctx.shadowColor = state.power ? '#22c55e' : '#ef4444';
        ctx.shadowBlur = state.power ? 6 : 8;
        ctx.beginPath();
        ctx.arc(centerX, botY + baseH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Top Cap (Aluminum / Dark Chrome)
        const topH = 14;
        const topGrad = ctx.createLinearGradient(centerX - lampW * 0.5, 0, centerX + lampW * 0.5, 0);
        topGrad.addColorStop(0, '#242b35');
        topGrad.addColorStop(0.5, '#4b5563');
        topGrad.addColorStop(1, '#1b2028');
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.roundRect(centerX - lampW * 0.5, topY - topH, lampW, topH, [8, 8, 0, 0]);
        ctx.fill();

        // Lamp Acrylic Diffuser Cylinder
        // We project the 2D matrix wrapped around a 3D cylinder
        const numSlices = 56;
        const sliceWidth = lampW / numSlices;
        const rowH = lampH / ROWS;

        ctx.save();
        // Clip to cylinder shape with rounded body
        ctx.beginPath();
        ctx.roundRect(centerX - lampW * 0.5, topY, lampW, lampH, 0);
        ctx.clip();

        for (let s = 0; s < numSlices; s++) {
          const sliceX = centerX - lampW * 0.5 + s * sliceWidth;
          // Normalized cylinder horizontal coordinate [-1 to 1]
          const nx = (s / (numSlices - 1)) * 2 - 1;
          // Cylinder angle relative to viewer
          const cylinderPhi = Math.asin(Math.max(-0.999, Math.min(0.999, nx)));
          // Current world angle around matrix
          const worldAngle = (cylinderPhi + angleRef.current + Math.PI * 2) % (Math.PI * 2);
          // Matrix column index
          const colIndex = Math.floor((worldAngle / (Math.PI * 2)) * COLS) % COLS;

          // Normal shading factor (Fresnel edges)
          const cosTheta = Math.cos(cylinderPhi);

          for (let r = 0; r < ROWS; r++) {
            const pixel = matrixBuffer[colIndex][r];
            const sliceY = topY + r * rowH;

            // Diffused acrylic blend
            const alpha = state.power ? (0.85 + cosTheta * 0.15) : 0.1;
            ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${alpha})`;
            ctx.fillRect(sliceX - 0.5, sliceY, sliceWidth + 1, rowH + 0.5);
          }
        }

        // Frosted Acrylic Tube Highlights & Glass Sheen
        const sheenGrad = ctx.createLinearGradient(centerX - lampW * 0.5, 0, centerX + lampW * 0.5, 0);
        sheenGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
        sheenGrad.addColorStop(0.18, 'rgba(255,255,255,0.02)');
        sheenGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        sheenGrad.addColorStop(0.95, 'rgba(255,255,255,0.15)');
        sheenGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(centerX - lampW * 0.5, topY, lampW, lampH);

        // Thin cylinder outline
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - lampW * 0.5, topY, lampW, lampH);

        ctx.restore();

        // 3D rotation hint label at bottom
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('Потяните влево/вправо для вращения цилиндра 360°', centerX, height - 12);

      } else {
        // --- 2D UNROLLED MATRIX VIEW ---
        const matrixW = Math.min(width - 40, 480);
        const cellGap = 4;
        const cellSize = Math.floor((matrixW - (COLS - 1) * cellGap) / COLS);
        const actualW = COLS * cellSize + (COLS - 1) * cellGap;
        const actualH = ROWS * cellSize + (ROWS - 1) * cellGap;
        const startX = (width - actualW) / 2;
        const startY = (height - actualH) / 2;

        // Circuit board backing
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(startX - 12, startY - 12, actualW + 24, actualH + 24, 12);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Header label inside canvas
        ctx.font = '11px monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(`WS2812B / 28x16 = ${COLS * ROWS} LEDs`, startX - 4, startY - 18);

        // Draw each physical LED dot
        for (let x = 0; x < COLS; x++) {
          for (let y = 0; y < ROWS; y++) {
            const px = startX + x * (cellSize + cellGap);
            const py = startY + y * (cellSize + cellGap);
            const p = matrixBuffer[x][y];

            // LED holder bezel
            ctx.fillStyle = '#141c2b';
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.48, 0, Math.PI * 2);
            ctx.fill();

            // LED active emission
            if (state.power && (p.r > 2 || p.g > 2 || p.b > 2)) {
              ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`;
              ctx.shadowBlur = Math.min(8, cellSize * 0.6 * (state.brightness / 255));
              ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
            } else {
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#1e2638';
            }

            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.36, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, viewMode]);

  return (
    <div id="lamp-canvas-card" className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center">
      {/* View Switcher Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md p-1 rounded-xl border border-slate-800">
        <button
          id="btn-view-cylinder"
          onClick={() => setViewMode('cylinder')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            viewMode === 'cylinder'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="3D Цилиндрический диффузор"
        >
          <Cylinder className="w-3.5 h-3.5" />
          <span>3D Цилиндр</span>
        </button>

        <button
          id="btn-view-matrix"
          onClick={() => setViewMode('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            viewMode === 'matrix'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="2D Матрица светодиодов"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>2D Матрица</span>
        </button>
      </div>

      {/* Live Power Indicator Tag */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
        <span className={`w-2 h-2 rounded-full ${state.power ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
        <span className="font-medium text-slate-300">
          {state.power ? 'Включена' : 'Ожидание (Выкл)'}
        </span>
        {state.power && (
          <span className="text-amber-400/90 font-mono text-[11px] ml-1">
            {Math.round((state.brightness / 255) * 100)}%
          </span>
        )}
      </div>

      {/* Main Interactive Stage */}
      <canvas
        id="lamp-interactive-canvas"
        ref={canvasRef}
        width={560}
        height={380}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[320px] sm:h-[380px] cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
};
