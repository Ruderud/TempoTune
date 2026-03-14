import { describe, it, expect, vi } from 'vitest';
import { AudioInputSessionStore } from './audio-input-session.store';

describe('AudioInputSessionStore', () => {
  it('initial state is idle with monotonic timestamp source', () => {
    const store = new AudioInputSessionStore();
    expect(store.getState()).toEqual({ status: 'idle', timestampSource: 'monotonic' });
  });

  it('update() merges partial state', () => {
    const store = new AudioInputSessionStore();
    store.update({ status: 'running', sampleRate: 44100 });

    expect(store.getState()).toEqual({
      status: 'running',
      timestampSource: 'monotonic',
      sampleRate: 44100,
    });
  });

  it('isCapturing() returns true only when status is running', () => {
    const store = new AudioInputSessionStore();

    expect(store.isCapturing()).toBe(false);

    store.update({ status: 'starting' });
    expect(store.isCapturing()).toBe(false);

    store.update({ status: 'running' });
    expect(store.isCapturing()).toBe(true);

    store.update({ status: 'stopping' });
    expect(store.isCapturing()).toBe(false);

    store.update({ status: 'error' });
    expect(store.isCapturing()).toBe(false);
  });

  it('onChange() fires on updates', () => {
    const store = new AudioInputSessionStore();
    const listener = vi.fn();

    store.onChange(listener);
    store.update({ status: 'running' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'running' }),
    );
  });

  it('unsubscribed listeners do not fire', () => {
    const store = new AudioInputSessionStore();
    const listener = vi.fn();

    const unsub = store.onChange(listener);
    unsub();
    store.update({ status: 'running' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('reset() returns to idle', () => {
    const store = new AudioInputSessionStore();
    store.update({ status: 'running', sampleRate: 48000, deviceId: 'mic-1' });

    store.reset();
    expect(store.getState()).toEqual({ status: 'idle', timestampSource: 'monotonic' });
  });

  it('dispose() clears listeners', () => {
    const store = new AudioInputSessionStore();
    const listener = vi.fn();

    store.onChange(listener);
    store.dispose();
    store.update({ status: 'running' });

    expect(listener).not.toHaveBeenCalled();
  });
});
