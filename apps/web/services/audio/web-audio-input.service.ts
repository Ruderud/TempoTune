import type { AudioInputDevice, AudioInputTransport } from '@tempo-tune/shared/types';

/**
 * Thin wrapper around MediaDevices for input device enumeration on web.
 */

function classifyTransport(device: MediaDeviceInfo): AudioInputTransport {
  const label = device.label.toLowerCase();
  if (label.includes('usb')) return 'usb';
  if (label.includes('bluetooth') || label.includes('airpods')) return 'bluetooth';
  if (label.includes('wired') || label.includes('headset')) return 'wired';
  if (label.includes('built-in') || label.includes('internal') || label.includes('default')) return 'built-in';
  return 'unknown';
}

export async function listWebInputDevices(): Promise<AudioInputDevice[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === 'audioinput')
    .map((d) => ({
      id: d.deviceId,
      label: d.label || 'Microphone',
      transport: classifyTransport(d),
      platformKind: 'web',
      channelCount: 1,
      sampleRates: [],
      isDefault: d.deviceId === 'default',
      isAvailable: true,
    }));
}

export function onWebDeviceChange(callback: (devices: AudioInputDevice[]) => void): () => void {
  const handler = async () => {
    const devices = await listWebInputDevices();
    callback(devices);
  };
  navigator.mediaDevices.addEventListener('devicechange', handler);
  return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
}
