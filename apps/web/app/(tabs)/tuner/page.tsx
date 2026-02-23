'use client';

import {
  TunerControl,
  GuitarHeadstock,
  TuningTrendGraph,
  TunerOptionsDrawer,
  CircularDial,
  InstrumentSelector,
  NeedleGauge,
} from '../../../components/tuner';
import { useTuner } from '../../../hooks/use-tuner';
import { useTunerLayout } from '../../../hooks/use-tuner-layout';

export default function TunerPage() {
  const tuner = useTuner();
  const activeTarget = tuner.targetString ?? tuner.closestString;
  const { headstockLayout, setHeadstockLayout } = useTunerLayout();

  const isAutoMode = tuner.tuningMode === 'auto';

  return (
    <div className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out] bg-background-dark relative">
      {/* Decorative gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* ═══════════ Mobile Layout ═══════════ */}
      <div className="lg:hidden h-full">
        {isAutoMode ? (
          /* ── Mobile Auto Mode ── */
          <div className="flex flex-col h-full">
            {/* Controls */}
            <div className="shrink-0">
              <TunerControl
                currentPreset={tuner.currentPreset}
                tuningMode={tuner.tuningMode}
                isListening={tuner.isListening}
                onPresetChange={tuner.setPreset}
                onTuningModeChange={tuner.setTuningMode}
                onStart={tuner.start}
                onStop={tuner.stop}
              />
            </div>

            {/* Circular Dial (centered) */}
            <div className="flex-1 flex items-center justify-center min-h-0 px-4">
              <CircularDial
                detectedNote={tuner.detectedNote}
                targetString={activeTarget}
                centsFromTarget={tuner.centsFromTarget}
                isListening={tuner.isListening}
                hasSignal={tuner.hasSignal}
              />
            </div>

            {/* Compact trend graph */}
            <div className="shrink-0 px-4 pb-1">
              <div className="relative">
                <TuningTrendGraph
                  detectedNote={tuner.detectedNote}
                  targetString={activeTarget}
                  centsFromTarget={tuner.centsFromTarget}
                  centsHistory={tuner.centsHistory}
                  isListening={tuner.isListening}
                  hasSignal={tuner.hasSignal}
                  confidence={tuner.pitchConfidence}
                  confidenceGate={tuner.confidenceGate}
                  isLowConfidence={tuner.isLowConfidence}
                  size="compact"
                />
                <span className="absolute top-2 right-3 text-xs text-primary/40">실시간 피치</span>
              </div>
            </div>

            {/* Instrument selector */}
            <div className="shrink-0">
              <InstrumentSelector
                currentPreset={tuner.currentPreset}
                onPresetChange={tuner.setPreset}
                disabled={tuner.isListening}
              />
            </div>
          </div>
        ) : (
          /* ── Mobile Manual Mode ── */
          <div className="grid h-full grid-rows-[auto_auto_1fr_auto_auto]">
            {/* Row 1: Controls */}
            <TunerControl
              currentPreset={tuner.currentPreset}
              tuningMode={tuner.tuningMode}
              isListening={tuner.isListening}
              onPresetChange={tuner.setPreset}
              onTuningModeChange={tuner.setTuningMode}
              onStart={tuner.start}
              onStop={tuner.stop}
            />

            {/* Row 2: Note + cents display */}
            <div className="flex items-center justify-center gap-4 px-4 py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {tuner.detectedNote ? tuner.detectedNote.name : '--'}
                </span>
                <span className="text-xl font-bold text-text-secondary">
                  {tuner.detectedNote ? tuner.detectedNote.octave : ''}
                </span>
              </div>
              {tuner.hasSignal && (
                <span className="text-sm font-semibold text-primary tabular-nums">
                  {tuner.centsFromTarget > 0 ? '+' : ''}{Math.round(tuner.centsFromTarget)} cents
                </span>
              )}
              <span className="text-xs text-text-muted tabular-nums">
                {tuner.detectedNote ? `${tuner.detectedNote.frequency.toFixed(1)} Hz` : ''}
              </span>
            </div>

            {/* Row 3: Guitar headstock (center) */}
            <div className="min-h-0 flex items-center justify-center px-4 overflow-hidden">
              <GuitarHeadstock
                strings={tuner.currentPreset.strings}
                targetString={tuner.targetString}
                detectedString={tuner.closestString}
                layout={headstockLayout}
                onSelectString={tuner.setTargetString}
              />
            </div>

            {/* Row 4: Info bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-primary/10 bg-surface/30">
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs text-text-muted">현재 주파수</span>
                <span className="text-xs font-semibold text-primary tabular-nums">
                  {tuner.detectedNote ? `${tuner.detectedNote.frequency.toFixed(1)} Hz` : '-- Hz'}
                </span>
              </div>
              <div className="w-px h-6 bg-primary/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs text-text-muted">현재 스트링</span>
                <span className="text-xs font-semibold text-primary">
                  {activeTarget ? `${activeTarget.name}${activeTarget.octave} (${activeTarget.frequency.toFixed(0)}Hz)` : '--'}
                </span>
              </div>
              <div className="w-px h-6 bg-primary/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs text-text-muted">음차 범위</span>
                <span className="text-xs font-semibold text-primary tabular-nums">&plusmn;0.5 Cents</span>
              </div>
            </div>

            {/* Row 5: Options drawer */}
            <div className="px-3 pb-2">
              <TunerOptionsDrawer
                referenceFrequency={tuner.referenceFrequency}
                onReferenceFrequencyChange={tuner.setReferenceFrequency}
                detectionSettings={tuner.detectionSettings}
                onDetectionSettingsChange={tuner.setDetectionSettings}
                sensitivityPreset={tuner.sensitivityPreset}
                onSensitivityPresetChange={tuner.applySensitivityPreset}
                headstockLayout={headstockLayout}
                onHeadstockLayoutChange={setHeadstockLayout}
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ Desktop Layout ═══════════ */}
      <div className="hidden lg:flex h-full">
        {isAutoMode ? (
          /* ── Desktop Auto Mode: 3 panels ── */
          <>
            {/* Left: String selector sidebar */}
            <div className="w-20 border-r border-primary/10 bg-background-dark/60 flex flex-col items-center py-4 gap-2 shrink-0">
              <span className="text-xs text-text-muted mb-2 font-semibold">스트링</span>
              {tuner.currentPreset.strings.map((string, i) => {
                const isTarget = activeTarget && string.name === activeTarget.name && string.octave === activeTarget.octave;
                return (
                  <button
                    key={`${string.name}-${string.octave}-${i}`}
                    type="button"
                    onClick={() => tuner.setTargetString(string)}
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-sm transition-all ${
                      isTarget
                        ? 'bg-primary/20 text-primary border border-primary/50 active-string-glow'
                        : 'bg-surface text-text-secondary border border-primary/10 hover:bg-primary/10'
                    }`}
                  >
                    <span>{string.name}{string.octave}</span>
                  </button>
                );
              })}
            </div>

            {/* Center: Main display */}
            <div className="flex-1 flex flex-col min-w-0">
              <TunerControl
                currentPreset={tuner.currentPreset}
                tuningMode={tuner.tuningMode}
                isListening={tuner.isListening}
                onPresetChange={tuner.setPreset}
                onTuningModeChange={tuner.setTuningMode}
                onStart={tuner.start}
                onStop={tuner.stop}
              />

              {/* Status badge */}
              <div className="flex justify-center py-2">
                {tuner.hasSignal ? (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    Math.abs(tuner.centsFromTarget) < 5
                      ? 'text-primary border-primary/30 bg-primary/10'
                      : 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                  }`}>
                    ● {Math.abs(tuner.centsFromTarget) < 5 ? '정상 상태: 인 튠' : '편차 감지됨'}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full border text-text-muted border-primary/10">
                    {tuner.isListening ? '● 수음 대기 중' : '● 정지됨'}
                  </span>
                )}
              </div>

              {/* Big note display */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                <div className="flex items-baseline">
                  <span className={`text-[140px] font-black leading-none tracking-tight ${
                    tuner.hasSignal && Math.abs(tuner.centsFromTarget) < 5 ? 'text-primary glow-text' : 'text-white'
                  }`}>
                    {tuner.detectedNote ? tuner.detectedNote.name : '--'}
                  </span>
                  {tuner.detectedNote && (
                    <span className="text-5xl font-bold text-text-secondary -translate-y-12 ml-1">
                      {tuner.detectedNote.octave}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-muted tabular-nums">
                  {tuner.detectedNote && (
                    <>
                      <span>{tuner.detectedNote.frequency.toFixed(1)} Hz</span>
                      <span className={tuner.hasSignal ? 'text-primary font-semibold' : ''}>
                        {tuner.hasSignal ? `${tuner.centsFromTarget > 0 ? '+' : ''}${tuner.centsFromTarget.toFixed(1)} Cents` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Trend graph (bottom) */}
              <div className="px-6 pb-4">
                <TuningTrendGraph
                  detectedNote={tuner.detectedNote}
                  targetString={activeTarget}
                  centsFromTarget={tuner.centsFromTarget}
                  centsHistory={tuner.centsHistory}
                  isListening={tuner.isListening}
                  hasSignal={tuner.hasSignal}
                  confidence={tuner.pitchConfidence}
                  confidenceGate={tuner.confidenceGate}
                  isLowConfidence={tuner.isLowConfidence}
                  size="large"
                />
              </div>
            </div>

            {/* Right: Quick settings sidebar */}
            <aside className="w-64 border-l border-primary/10 bg-background-dark/40 backdrop-blur-md p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60">빠른 설정</h3>
              <TunerOptionsDrawer
                referenceFrequency={tuner.referenceFrequency}
                onReferenceFrequencyChange={tuner.setReferenceFrequency}
                detectionSettings={tuner.detectionSettings}
                onDetectionSettingsChange={tuner.setDetectionSettings}
                sensitivityPreset={tuner.sensitivityPreset}
                onSensitivityPresetChange={tuner.applySensitivityPreset}
                headstockLayout={headstockLayout}
                onHeadstockLayoutChange={setHeadstockLayout}
                variant="inline"
              />
            </aside>
          </>
        ) : (
          /* ── Desktop Manual Mode ── */
          <>
            {/* Left: Note card + precision gauge */}
            <aside className="w-64 border-r border-primary/10 bg-background-dark/40 backdrop-blur-md p-5 flex flex-col gap-6 shrink-0">
              <div>
                <span className="text-xs text-text-muted">현재 음정</span>
                <div className="mt-2 glass-card rounded-xl p-4 text-center">
                  <span className="text-5xl font-black text-white">
                    {tuner.detectedNote ? `${tuner.detectedNote.name}${tuner.detectedNote.octave}` : '--'}
                  </span>
                  <div className="text-xs text-text-muted mt-2 tabular-nums">
                    {tuner.detectedNote ? `${tuner.detectedNote.frequency.toFixed(1)} Hz` : '-- Hz'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-text-muted">정밀도 (Cents)</span>
                <div className="mt-2 h-48">
                  <NeedleGauge
                    detectedNote={tuner.detectedNote}
                    targetString={activeTarget}
                    centsFromTarget={tuner.centsFromTarget}
                    isListening={tuner.isListening}
                  />
                </div>
              </div>
            </aside>

            {/* Center: Headstock + strings */}
            <div className="flex-1 flex flex-col min-w-0">
              <TunerControl
                currentPreset={tuner.currentPreset}
                tuningMode={tuner.tuningMode}
                isListening={tuner.isListening}
                onPresetChange={tuner.setPreset}
                onTuningModeChange={tuner.setTuningMode}
                onStart={tuner.start}
                onStop={tuner.stop}
              />

              <div className="flex-1 flex items-center justify-center min-h-0 px-8">
                <GuitarHeadstock
                  strings={tuner.currentPreset.strings}
                  targetString={tuner.targetString}
                  detectedString={tuner.closestString}
                  layout={headstockLayout}
                  onSelectString={tuner.setTargetString}
                />
              </div>

              {/* Bottom: Frequency trend */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>실시간 주파수 추이 (Hz)</span>
                  <span className="tabular-nums">{tuner.detectedNote ? `${tuner.detectedNote.frequency.toFixed(1)} Hz` : ''}</span>
                </div>
                <TuningTrendGraph
                  detectedNote={tuner.detectedNote}
                  targetString={activeTarget}
                  centsFromTarget={tuner.centsFromTarget}
                  centsHistory={tuner.centsHistory}
                  isListening={tuner.isListening}
                  hasSignal={tuner.hasSignal}
                  confidence={tuner.pitchConfidence}
                  confidenceGate={tuner.confidenceGate}
                  isLowConfidence={tuner.isLowConfidence}
                  size="compact"
                />
              </div>
            </div>

            {/* Right: Quick settings + hints */}
            <aside className="w-64 border-l border-primary/10 bg-background-dark/40 backdrop-blur-md p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60">빠른 설정</h3>
              <TunerOptionsDrawer
                referenceFrequency={tuner.referenceFrequency}
                onReferenceFrequencyChange={tuner.setReferenceFrequency}
                detectionSettings={tuner.detectionSettings}
                onDetectionSettingsChange={tuner.setDetectionSettings}
                sensitivityPreset={tuner.sensitivityPreset}
                onSensitivityPresetChange={tuner.applySensitivityPreset}
                headstockLayout={headstockLayout}
                onHeadstockLayoutChange={setHeadstockLayout}
                variant="inline"
              />
              <div className="border-t border-primary/10 pt-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  수동 모드에서는 선택한 줄(스트링)의 목표 주파수만 비교합니다. 헤드스탁의 원형 버튼으로 비교 대상을 전환하세요.
                </p>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Error overlay */}
      {tuner.error && (
        <div className="absolute inset-x-4 top-20 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[480px] p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-xs break-all z-50">
          {tuner.error}
        </div>
      )}
    </div>
  );
}
