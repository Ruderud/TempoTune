'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { TunerNote, TuningString } from '@tempo-tune/shared/types';
import { lerp, clamp } from '@tempo-tune/shared/utils';

type NeedleGaugeProps = {
  detectedNote: TunerNote | null;
  closestString: TuningString | null;
  centsFromTarget: number;
  isListening: boolean;
};

const COLOR_GREEN = '#22c55e';
const COLOR_YELLOW = '#eab308';
const COLOR_RED = '#ef4444';
const COLOR_GRAY = '#6b7280';

const LERP_FACTOR = 0.12;
const TICK_COUNT = 21;
const CENTER_INDEX = 10;

function getColor(detectedNote: TunerNote | null, cents: number): string {
  if (!detectedNote) return COLOR_GRAY;
  const absCents = Math.abs(cents);
  if (absCents < 5) return COLOR_GREEN;
  if (absCents < 15) return COLOR_YELLOW;
  return COLOR_RED;
}

function getDirectionHint(
  detectedNote: TunerNote | null,
  cents: number,
  isListening: boolean,
): string {
  if (!detectedNote) {
    return isListening ? '소리를 감지하는 중...' : '';
  }
  if (Math.abs(cents) < 5) return '완벽!';
  return cents < 0 ? '음조 올리기' : '음조 내리기';
}

export function NeedleGauge({
  detectedNote,
  closestString,
  centsFromTarget,
  isListening,
}: NeedleGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedCentsRef = useRef(0);
  const rafIdRef = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = width / dpr;
      const h = height / dpr;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.scale(dpr, dpr);

      // --- Layout: horizontal ticks at top, vertical needle drops down ---
      const marginX = 28;
      const barLeft = marginX;
      const barRight = w - marginX;
      const barWidth = barRight - barLeft;
      const tickY = 56; // tick mark center Y
      const needleTop = tickY + 36; // needle starts below ticks
      const needleBottom = h - 20; // needle extends to near bottom

      // --- Flat / Sharp symbols ---
      ctx.font = 'bold 22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('\u266D', 12, tickY);
      ctx.fillText('\u266F', w - 12, tickY);

      // --- Horizontal tick marks ---
      for (let i = 0; i < TICK_COUNT; i++) {
        const x = barLeft + (i / (TICK_COUNT - 1)) * barWidth;
        const isCenter = i === CENTER_INDEX;
        const isMajor = i % 5 === 0;

        let tickH: number;
        let tickW: number;
        let tickColor: string;

        if (isCenter) {
          tickH = 40;
          tickW = 2.5;
          tickColor = '#5eead4';
        } else if (isMajor) {
          tickH = 28;
          tickW = 2;
          tickColor = '#4b5563';
        } else {
          tickH = 16;
          tickW = 1.5;
          tickColor = 'rgba(75, 85, 99, 0.5)';
        }

        ctx.fillStyle = tickColor;
        ctx.fillRect(x - tickW / 2, tickY - tickH / 2, tickW, tickH);
      }

      // --- Animated needle position ---
      const targetCents = detectedNote
        ? clamp(centsFromTarget, -50, 50)
        : 0;
      animatedCentsRef.current = lerp(
        animatedCentsRef.current,
        targetCents,
        LERP_FACTOR,
      );
      const needleRatio = (animatedCentsRef.current + 50) / 100;
      const needleX = barLeft + needleRatio * barWidth;
      const color = getColor(detectedNote, animatedCentsRef.current);

      if (detectedNote) {
        // --- Vertical glow line ---
        const glowGradient = ctx.createLinearGradient(
          needleX, needleTop,
          needleX, needleBottom,
        );
        glowGradient.addColorStop(0, color + '60');
        glowGradient.addColorStop(0.5, color + '20');
        glowGradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = glowGradient;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(needleX, needleTop);
        ctx.lineTo(needleX, needleBottom);
        ctx.stroke();

        // --- Vertical needle line ---
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(needleX, needleTop);
        ctx.lineTo(needleX, needleBottom);
        ctx.stroke();

        // --- Cents bubble at top ---
        const bubbleRadius = 26;
        const bubbleY = 24;

        // Bubble background
        ctx.beginPath();
        ctx.arc(needleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = color + '25';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Cents number
        const centsValue = Math.round(animatedCentsRef.current);
        const centsText = centsValue > 0 ? `+${centsValue}` : `${centsValue}`;
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(centsText, needleX, bubbleY);

        // Connector from bubble to needle start
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(needleX, bubbleY + bubbleRadius);
        ctx.lineTo(needleX, needleTop);
        ctx.stroke();
      }

      ctx.restore();
    },
    [detectedNote, centsFromTarget],
  );

  // --- Animation loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(container);
    resizeCanvas();

    const loop = () => {
      if (!running) return;
      draw(ctx, canvas.width, canvas.height);
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
      observer.disconnect();
    };
  }, [draw]);

  // --- Derived display values ---
  const color = getColor(detectedNote, centsFromTarget);
  const directionHint = getDirectionHint(detectedNote, centsFromTarget, isListening);
  const isInTune = detectedNote !== null && Math.abs(centsFromTarget) < 5;
  const displayNote = detectedNote ? detectedNote.name : '--';
  const displayOctave = detectedNote ? detectedNote.octave : null;
  const displayFrequency = detectedNote
    ? `${detectedNote.frequency.toFixed(1)} Hz`
    : '';

  return (
    <div className="flex flex-col items-center flex-1 min-h-0">
      {/* Canvas gauge: top portion */}
      <div ref={containerRef} className="w-full flex-[5] relative min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      {/* Note display area */}
      <div className="flex-[4] flex flex-col items-center justify-center min-h-0">
        {/* Direction hint */}
        <div className="text-center h-7">
          <span
            className="text-base font-semibold transition-colors duration-200"
            style={{ color: detectedNote ? color : COLOR_GRAY }}
          >
            {directionHint}
          </span>
        </div>

        {/* BIG detected note */}
        <div className="mt-2 text-center">
          <div className="flex items-start justify-center">
            <span
              className={`text-9xl font-black tracking-tight transition-colors duration-300 leading-none ${
                isInTune ? 'text-green-400' : 'text-white'
              }`}
            >
              {displayNote}
            </span>
            {displayOctave !== null && (
              <span className="text-3xl font-bold text-gray-400 mt-3 ml-1">
                {displayOctave}
              </span>
            )}
          </div>
          {displayFrequency && (
            <div className="text-lg text-gray-500 mt-2 tabular-nums">
              {displayFrequency}
            </div>
          )}
        </div>

        {/* Target string info */}
        {closestString && detectedNote ? (
          <div className="mt-4 px-4 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
            <span className="text-sm text-gray-400 tabular-nums">
              목표: {closestString.name}
              {closestString.octave} ({closestString.frequency.toFixed(1)} Hz)
            </span>
          </div>
        ) : (
          <div className="mt-4 h-8" />
        )}
      </div>
    </div>
  );
}
