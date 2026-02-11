import type {BridgeResponse} from '@tempo-tune/shared/types';
import {triggerHaptic} from '../services/haptic.service';

export async function handlePlayClick(data: unknown): Promise<BridgeResponse> {
  const {isAccent} = data as {isAccent: boolean};
  await triggerHaptic(isAccent ? 'heavy' : 'light');
  return {success: true};
}

export async function handleVibrate(data: unknown): Promise<BridgeResponse> {
  const {duration} = (data as {duration?: number}) || {};
  await triggerHaptic('medium', duration);
  return {success: true};
}
