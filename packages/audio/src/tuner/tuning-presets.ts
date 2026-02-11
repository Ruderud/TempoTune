import type { TuningPreset } from '@tempo-tune/shared/types';
import {
  ALL_TUNING_PRESETS,
  STANDARD_GUITAR_TUNING,
  DROP_D_GUITAR_TUNING,
  STANDARD_BASS_TUNING,
} from '@tempo-tune/shared/constants';

/**
 * 악기 타입별 프리셋 필터링
 */
export function getPresetsForInstrument(
  instrument: 'guitar' | 'bass'
): TuningPreset[] {
  return ALL_TUNING_PRESETS.filter(
    (preset) => preset.instrument === instrument
  );
}

/**
 * 이름으로 프리셋 찾기
 */
export function findPresetByName(
  name: string,
  instrument: 'guitar' | 'bass'
): TuningPreset | undefined {
  return ALL_TUNING_PRESETS.find(
    (preset) => preset.name === name && preset.instrument === instrument
  );
}

export {
  STANDARD_GUITAR_TUNING,
  DROP_D_GUITAR_TUNING,
  STANDARD_BASS_TUNING,
  ALL_TUNING_PRESETS,
};
