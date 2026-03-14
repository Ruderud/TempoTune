import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

if (typeof globalThis !== 'undefined') {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

export function renderTestHook<T>(useHook: () => T) {
  let currentValue: T;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function TestHookHost() {
    currentValue = useHook();
    return null;
  }

  act(() => {
    root.render(<TestHookHost />);
  });

  return {
    result: {
      get current(): T {
        return currentValue;
      },
    },
    rerender() {
      act(() => {
        root.render(<TestHookHost />);
      });
    },
    async waitFor(assertion: () => void, timeoutMs = 1000) {
      const start = Date.now();

      while (true) {
        try {
          assertion();
          return;
        } catch (error) {
          if (Date.now() - start >= timeoutMs) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}
