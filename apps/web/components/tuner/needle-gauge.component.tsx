'use client';

import { useRef, useEffect } from 'react';
import type { TunerNote, TuningString } from '@tempo-tune/shared/types';
import { lerp, clamp } from '@tempo-tune/shared/utils';

type NeedleGaugeProps = {
  detectedNote: TunerNote | null;
  targetString: TuningString | null;
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

/** Draw a rounded rectangle using arcTo (no ctx.roundRect dependency). */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function NeedleGauge({
  detectedNote,
  targetString,
  centsFromTarget,
  isListening,
}: NeedleGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedCentsRef = useRef(0);
  const rafIdRef = useRef(0);

  // --- Sync props into refs so the rAF loop never restarts ---
  const detectedNoteRef = useRef(detectedNote);
  const targetStringRef = useRef(targetString);
  const centsFromTargetRef = useRef(centsFromTarget);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    detectedNoteRef.current = detectedNote;
    targetStringRef.current = targetString;
    centsFromTargetRef.current = centsFromTarget;
    isListeningRef.current = isListening;
  });

  // --- Single mount rAF loop ---
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

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width;
      const height = canvas.height;
      const w = width / dpr;
      const h = height / dpr;

      // Read current values from refs
      const note = detectedNoteRef.current;
      const target = targetStringRef.current;
      const cents = centsFromTargetRef.current;
      const listening = isListeningRef.current;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.scale(dpr, dpr);

      // --- Responsive font helper ---
      const fontSize = (factor: number, min: number, max: number) =>
        Math.round(clamp(h * factor, min, max));

      // =================================================================
      // Zone A (0%–8%): Cents bubble
      // =================================================================
      const marginX = clamp(w * 0.06, 20, 40);
      const barLeft = marginX;
      const barRight = w - marginX;
      const barWidth = barRight - barLeft;

      const targetCents = note ? clamp(cents, -50, 50) : 0;
      animatedCentsRef.current = lerp(
        animatedCentsRef.current,
        targetCents,
        LERP_FACTOR,
      );
      const needleRatio = (animatedCentsRef.current + 50) / 100;
      const needleX = barLeft + needleRatio * barWidth;
      const color = getColor(note, animatedCentsRef.current);

      if (note) {
        const bubbleR = clamp(h * 0.04, 16, 30);
        const bubbleY = h * 0.04;

        ctx.beginPath();
        ctx.arc(needleX, bubbleY, bubbleR, 0, Math.PI * 2);
        ctx.fillStyle = color + '25';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const centsVal = Math.round(animatedCentsRef.current);
        const centsText = centsVal > 0 ? `+${centsVal}` : `${centsVal}`;
        ctx.font = `bold ${fontSize(0.03, 11, 18)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(centsText, needleX, bubbleY);
      }

      // =================================================================
      // Zone B (8%–18%): Tick marks + flat/sharp symbols
      // =================================================================
      const tickY = h * 0.13;

      ctx.font = `bold ${fontSize(0.04, 16, 26)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('\u266D', barLeft - marginX / 2, tickY);
      ctx.fillText('\u266F', barRight + marginX / 2, tickY);

      for (let i = 0; i < TICK_COUNT; i++) {
        const x = barLeft + (i / (TICK_COUNT - 1)) * barWidth;
        const isCenter = i === CENTER_INDEX;
        const isMajor = i % 5 === 0;

        let tickH: number;
        let tickW: number;
        let tickColor: string;

        if (isCenter) {
          tickH = clamp(h * 0.06, 24, 44);
          tickW = 2.5;
          tickColor = '#5eead4';
        } else if (isMajor) {
          tickH = clamp(h * 0.045, 18, 32);
          tickW = 2;
          tickColor = '#4b5563';
        } else {
          tickH = clamp(h * 0.025, 10, 20);
          tickW = 1.5;
          tickColor = 'rgba(75, 85, 99, 0.5)';
        }

        ctx.fillStyle = tickColor;
        ctx.fillRect(x - tickW / 2, tickY - tickH / 2, tickW, tickH);
      }

      // =================================================================
      // Zone C (18%–46%): Needle (glow + line)
      // =================================================================
      const needleTop = h * 0.18;
      const needleBottom = h * 0.46;

      if (note) {
        // Connector from bubble to needle
        const bubbleR = clamp(h * 0.04, 16, 30);
        const bubbleY = h * 0.04;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(needleX, bubbleY + bubbleR);
        ctx.lineTo(needleX, needleTop);
        ctx.stroke();

        // Glow
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

        // Needle line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(needleX, needleTop);
        ctx.lineTo(needleX, needleBottom);
        ctx.stroke();
      }

      // =================================================================
      // Zone D (48%–58%): Direction hint
      // =================================================================
      const hint = getDirectionHint(note, animatedCentsRef.current, listening);
      if (hint) {
        const hintY = h * 0.53;
        ctx.font = `600 ${fontSize(0.035, 13, 22)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = note ? color : COLOR_GRAY;
        ctx.fillText(hint, w / 2, hintY);
      }

      // =================================================================
      // Zone E (58%–82%): Big note name + octave
      // =================================================================
      const noteY = h * 0.70;
      const displayNote = note ? note.name : '--';
      const isInTune = note !== null && Math.abs(animatedCentsRef.current) < 5;

      const noteFontSize = fontSize(0.16, 48, 140);
      ctx.font = `900 ${noteFontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isInTune ? '#4ade80' : '#ffffff';
      ctx.fillText(displayNote, w / 2, noteY);

      if (note) {
        // Octave — positioned to the right of the note
        const noteMetrics = ctx.measureText(displayNote);
        const octaveFontSize = fontSize(0.05, 18, 36);
        const octaveX = w / 2 + noteMetrics.actualBoundingBoxRight + clamp(w * 0.01, 4, 10);
        const octaveY = noteY - noteFontSize * 0.32;

        ctx.font = `700 ${octaveFontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`${note.octave}`, octaveX, octaveY);
      }

      // =================================================================
      // Zone F (82%–90%): Frequency (Hz)
      // =================================================================
      if (note) {
        const freqY = h * 0.86;
        const freqText = `${note.frequency.toFixed(1)} Hz`;
        ctx.font = `${fontSize(0.032, 12, 22)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(freqText, w / 2, freqY);
      }

      // =================================================================
      // Zone G (90%–100%): Target string badge (pill shape)
      // =================================================================
      if (target && note) {
        const badgeY = h * 0.95;
        const badgeText = `목표: ${target.name}${target.octave} (${target.frequency.toFixed(1)} Hz)`;
        const badgeFontSize = fontSize(0.025, 10, 16);
        ctx.font = `${badgeFontSize}px system-ui, sans-serif`;
        const textW = ctx.measureText(badgeText).width;
        const padX = clamp(w * 0.03, 10, 20);
        const padY = clamp(h * 0.012, 4, 10);
        const pillW = textW + padX * 2;
        const pillH = badgeFontSize + padY * 2;
        const pillX = (w - pillW) / 2;
        const pillY = badgeY - pillH / 2;

        // Pill background
        drawRoundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fillStyle = 'rgba(31, 41, 55, 0.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(55, 65, 81, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pill text
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, w / 2, badgeY);
      }

      ctx.restore();
    };

    const loop = () => {
      if (!running) return;
      draw();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative min-h-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
