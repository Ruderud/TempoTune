import {Vibration, Platform} from 'react-native';

type HapticIntensity = 'light' | 'medium' | 'heavy';

const HAPTIC_DURATIONS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 20,
  heavy: 40,
};

export async function triggerHaptic(
  intensity: HapticIntensity = 'medium',
  durationMs?: number,
): Promise<void> {
  const duration = durationMs ?? HAPTIC_DURATIONS[intensity];

  if (Platform.OS === 'android') {
    Vibration.vibrate(duration);
  } else {
    // iOS: Vibration.vibrate()는 고정 패턴만 지원
    // 향후 react-native-haptic-feedback 라이브러리로 교체 권장
    Vibration.vibrate(duration);
  }
}

export function cancelHaptic(): void {
  Vibration.cancel();
}
