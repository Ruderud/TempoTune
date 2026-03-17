import { useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

export function renderTestHook<T>(useHook: () => T) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let currentValue: T;
  let root: Root | null = createRoot(container);

  function HookHarness({ onValue }: { onValue: (value: T) => void }) {
    const value = useHook();

    useLayoutEffect(() => {
      onValue(value);
    }, [onValue, value]);

    return null;
  }

  const render = () => {
    flushSync(() => {
      root?.render(
        <HookHarness
          onValue={(value) => {
            currentValue = value;
          }}
        />,
      );
    });
  };

  render();

  return {
    get result() {
      return {
        get current() {
          return currentValue;
        },
      };
    },
    rerender() {
      render();
    },
    async waitFor(assertion: () => void, timeoutMs = 1000) {
      const deadline = Date.now() + timeoutMs;
      let lastError: unknown;

      while (Date.now() <= deadline) {
        try {
          render();
          assertion();
          return;
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error('Timed out waiting for hook assertion');
    },
    unmount() {
      flushSync(() => {
        root?.unmount();
      });
      root = null;
      container.remove();
    },
  };
}
