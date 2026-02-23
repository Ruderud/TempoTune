'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { HeadstockLayout } from '../components/tuner/guitar-headstock.component';

const HEADSTOCK_LAYOUT_STORAGE_KEY = 'tempo_tuner_headstock_layout_v1';
const DEFAULT_LAYOUT: HeadstockLayout = 'three-plus-three';

const layoutSubscribers = new Set<() => void>();

function subscribeLayout(callback: () => void) {
  layoutSubscribers.add(callback);
  return () => { layoutSubscribers.delete(callback); };
}

function getLayoutSnapshot(): HeadstockLayout {
  const saved = window.localStorage.getItem(HEADSTOCK_LAYOUT_STORAGE_KEY);
  if (saved === 'three-plus-three' || saved === 'six-inline') return saved;
  return DEFAULT_LAYOUT;
}

function getServerLayoutSnapshot(): HeadstockLayout {
  return DEFAULT_LAYOUT;
}

export function useTunerLayout() {
  const headstockLayout = useSyncExternalStore(
    subscribeLayout,
    getLayoutSnapshot,
    getServerLayoutSnapshot,
  );

  const setHeadstockLayout = useCallback((layout: HeadstockLayout) => {
    window.localStorage.setItem(HEADSTOCK_LAYOUT_STORAGE_KEY, layout);
    layoutSubscribers.forEach((cb) => cb());
  }, []);

  return { headstockLayout, setHeadstockLayout };
}
