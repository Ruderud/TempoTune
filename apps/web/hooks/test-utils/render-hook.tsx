import React, { useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

if (typeof globalThis !== 'undefined') {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
}

export function renderTestHook<T>(useHook: () => T) {
  const currentValueRef: { current: T | undefined } = { current: undefined };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function TestHookHost() {
    const value = useHook();

    useLayoutEffect(() => {
      currentValueRef.current = value;
    }, [value]);

    return null;
  }

  act(() => {
    root.render(<TestHookHost />);
  });

  return {
    result: {
      get current(): T {
        return currentValueRef.current as T;
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
