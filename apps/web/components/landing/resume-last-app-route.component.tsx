'use client';

import { useEffect } from 'react';
import { readLastAppRouteFromStorage } from '../../lib/last-app-route';
import { isNativeEnvironment } from '../../services/bridge/bridge-adapter';

const DEFAULT_NATIVE_APP_ROUTE = '/metronome';

export function ResumeLastAppRoute() {
  useEffect(() => {
    const lastRoute = readLastAppRouteFromStorage();

    if (lastRoute) {
      window.location.replace(lastRoute);
      return;
    }

    if (isNativeEnvironment()) {
      window.location.replace(DEFAULT_NATIVE_APP_ROUTE);
    }
  }, []);

  return null;
}
