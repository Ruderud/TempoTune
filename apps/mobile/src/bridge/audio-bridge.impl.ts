import type {BridgeResponse, MicPermissionResponseData} from '@tempo-tune/shared/types';
import {
  requestMicPermission,
} from '../services/permission.service';

export async function handleRequestMicPermission(): Promise<BridgeResponse<MicPermissionResponseData>> {
  const status = await requestMicPermission();
  return {
    success: true,
    data: {status},
  };
}

export async function handleStartListening(): Promise<BridgeResponse> {
  // 네이티브 오디오 녹음 시작 (향후 구현)
  return {success: true};
}

export async function handleStopListening(): Promise<BridgeResponse> {
  // 네이티브 오디오 녹음 중지 (향후 구현)
  return {success: true};
}
