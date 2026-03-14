import { test, expect } from '@playwright/test';

test.describe('Tuner Audio Input', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['microphone']);

    await page.addInitScript(() => {
      class FakeAnalyserNode {
        fftSize = 1024;
        smoothingTimeConstant = 0;

        getFloatTimeDomainData(buffer: Float32Array) {
          buffer.fill(0);
        }
      }

      class FakeMediaStreamSourceNode {
        connect() {}
        disconnect() {}
      }

      class FakeAudioContext {
        sampleRate = 44100;
        state: AudioContextState = 'running';

        resume = async () => {
          this.state = 'running';
        };

        createMediaStreamSource() {
          return new FakeMediaStreamSourceNode();
        }

        createAnalyser() {
          return new FakeAnalyserNode();
        }
      }

      const fakeTrack = { stop() {} };
      const fakeStream = {
        getTracks: () => [fakeTrack],
      };

      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        writable: true,
        value: FakeAudioContext,
      });
      Object.defineProperty(window, 'webkitAudioContext', {
        configurable: true,
        writable: true,
        value: FakeAudioContext,
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => fakeStream,
          enumerateDevices: async () => [],
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      });
      Object.defineProperty(navigator, 'permissions', {
        configurable: true,
        value: {
          query: async () => ({ state: 'granted' }),
        },
      });

      let rafId = 0;
      const rafHandles = new Map<number, number>();
      window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        rafId += 1;
        const handle = window.setTimeout(() => callback(performance.now()), 16);
        rafHandles.set(rafId, handle);
        return rafId;
      };
      window.cancelAnimationFrame = (id: number) => {
        const handle = rafHandles.get(id);
        if (handle != null) {
          window.clearTimeout(handle);
          rafHandles.delete(id);
        }
      };
    });

    await page.goto('/tuner');
  });

  test('starts and stops the tuner with mocked web audio input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
    await page.waitForTimeout(300);

    await page.getByTestId('tuner-play-stop').first().click({ force: true });
    await expect(page.getByTestId('tuner-play-stop').first()).toContainText('중지');

    await page.getByTestId('tuner-play-stop').first().click({ force: true });
    await expect(page.getByTestId('tuner-play-stop').first()).toContainText('시작');
  });
});
