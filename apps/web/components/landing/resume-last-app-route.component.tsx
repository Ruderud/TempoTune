'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readLastAppRouteFromStorage } from '../../lib/last-app-route';

export function ResumeLastAppRoute() {
  const router = useRouter();

  useEffect(() => {
    const lastRoute = readLastAppRouteFromStorage();

    if (lastRoute) {
      router.replace(lastRoute);
    }
  }, [router]);

  return null;
}
