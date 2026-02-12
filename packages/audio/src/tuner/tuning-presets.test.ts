import { describe, it, expect } from 'vitest';
import {
  getPresetsForInstrument,
  findPresetByName,
  STANDARD_GUITAR_TUNING,
  DROP_D_GUITAR_TUNING,
  STANDARD_BASS_TUNING,
} from './tuning-presets';

describe('getPresetsForInstrument', () => {
  it('기타 프리셋 2개 반환 (Standard, Drop D)', () => {
    const presets = getPresetsForInstrument('guitar');
    expect(presets).toHaveLength(2);
    expect(presets.map((p) => p.name)).toEqual(['Standard', 'Drop D']);
  });

  it('베이스 프리셋 1개 반환 (Standard)', () => {
    const presets = getPresetsForInstrument('bass');
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Standard');
  });
});

describe('findPresetByName', () => {
  it('Standard 기타 프리셋 찾기', () => {
    const preset = findPresetByName('Standard', 'guitar');
    expect(preset).toBeDefined();
    expect(preset).toEqual(STANDARD_GUITAR_TUNING);
  });

  it('Drop D 기타 프리셋 찾기', () => {
    const preset = findPresetByName('Drop D', 'guitar');
    expect(preset).toEqual(DROP_D_GUITAR_TUNING);
  });

  it('Standard 베이스 프리셋 찾기', () => {
    const preset = findPresetByName('Standard', 'bass');
    expect(preset).toEqual(STANDARD_BASS_TUNING);
  });

  it('없는 프리셋은 undefined 반환', () => {
    const preset = findPresetByName('Open G', 'guitar');
    expect(preset).toBeUndefined();
  });
});

describe('프리셋 데이터 무결성', () => {
  it('Standard 기타는 6줄', () => {
    expect(STANDARD_GUITAR_TUNING.strings).toHaveLength(6);
  });

  it('Drop D 기타는 6줄', () => {
    expect(DROP_D_GUITAR_TUNING.strings).toHaveLength(6);
  });

  it('Standard 베이스는 4줄', () => {
    expect(STANDARD_BASS_TUNING.strings).toHaveLength(4);
  });

  it('Drop D의 6번줄은 D2(~73.42Hz)', () => {
    const lowString = DROP_D_GUITAR_TUNING.strings[0];
    expect(lowString.name).toBe('D');
    expect(lowString.octave).toBe(2);
    expect(lowString.frequency).toBeCloseTo(73.42, 1);
  });

  it('모든 프리셋의 주파수는 양수', () => {
    const allPresets = [STANDARD_GUITAR_TUNING, DROP_D_GUITAR_TUNING, STANDARD_BASS_TUNING];
    for (const preset of allPresets) {
      for (const string of preset.strings) {
        expect(string.frequency).toBeGreaterThan(0);
      }
    }
  });
});
