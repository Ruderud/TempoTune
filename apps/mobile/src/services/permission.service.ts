import {Platform, PermissionsAndroid} from 'react-native';
import type {AudioPermissionStatus} from '@tempo-tune/shared/types';

export async function requestMicPermission(): Promise<AudioPermissionStatus> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'TempoTune 마이크 권한',
          message: '튜너 기능을 사용하려면 마이크 권한이 필요합니다.',
          buttonPositive: '허용',
          buttonNegative: '거부',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED
        ? 'granted'
        : 'denied';
    } catch {
      return 'error';
    }
  }

  // iOS는 getUserMedia 호출 시 자동으로 권한 요청
  return 'granted';
}

export async function getMicPermissionStatus(): Promise<AudioPermissionStatus> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted ? 'granted' : 'undetermined';
  }
  return 'undetermined';
}
