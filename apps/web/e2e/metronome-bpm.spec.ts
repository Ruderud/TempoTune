import { test, expect } from '@playwright/test';

test.describe('Metronome BPM Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Mock AudioContext to prevent failures in headless Chrome
    await page.addInitScript(() => {
      const noop = () => {};
      const noopPromise = () => Promise.resolve();
      window.AudioContext = class MockAudioContext {
        state = 'running';
        currentTime = 0;
        sampleRate = 44100;
        createGain() { return { gain: { value: 1, setValueAtTime: noop }, connect: noop, disconnect: noop }; }
        createOscillator() { return { frequency: { value: 440 }, connect: noop, disconnect: noop, start: noop, stop: noop, type: 'sine' }; }
        createBufferSource() { return { buffer: null, connect: noop, disconnect: noop, start: noop, stop: noop, playbackRate: { value: 1 } }; }
        createBuffer() { return { getChannelData: () => new Float32Array(1) }; }
        decodeAudioData() { return Promise.resolve(this.createBuffer()); }
        resume = noopPromise;
        close = noopPromise;
        destination = {};
      } as unknown as typeof AudioContext;
    });
    await page.goto('/metronome');
    await expect(page.getByTestId('bpm-slider').first()).toBeVisible();
  });

  test('BPM controls are visible', async ({ page }) => {
    await expect(page.getByTestId('bpm-slider').first()).toBeVisible();
    await expect(page.getByTestId('bpm-decrement').first()).toBeVisible();
    await expect(page.getByTestId('bpm-increment').first()).toBeVisible();
    await expect(page.getByTestId('metronome-play-stop').first()).toBeVisible();
  });

  test('increment BPM with + button', async ({ page }) => {
    const slider = page.getByTestId('bpm-slider').first();
    const initialValue = await slider.inputValue();

    await page.getByTestId('bpm-increment').first().click();

    const newValue = await slider.inputValue();
    expect(Number(newValue)).toBe(Number(initialValue) + 1);
  });

  test('decrement BPM with - button', async ({ page }) => {
    const slider = page.getByTestId('bpm-slider').first();
    const initialValue = await slider.inputValue();

    await page.getByTestId('bpm-decrement').first().click();

    const newValue = await slider.inputValue();
    expect(Number(newValue)).toBe(Number(initialValue) - 1);
  });

  test('time signature chips are visible and clickable', async ({ page }) => {
    const chip34 = page.getByTestId('time-sig-3-4').first();
    await expect(chip34).toBeVisible();
    await chip34.click();
    await expect(chip34).toBeVisible();
  });

  test('play/stop button toggles', async ({ page }) => {
    const playStop = page.getByTestId('metronome-play-stop').first();
    await expect(playStop).toContainText('시작');

    await playStop.click();
    await expect(playStop).toContainText('정지');

    await playStop.click();
    await expect(playStop).toContainText('시작');
  });
});
