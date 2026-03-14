const APP_ROUTE_PREFIXES = ['/metronome', '/tuner', '/settings'] as const;

export const LAST_APP_ROUTE_STORAGE_KEY = 'tempo_last_app_route_v1';
export const LAST_APP_ROUTE_COOKIE_KEY = 'tempo_last_app_route_v1';

const LAST_APP_ROUTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function sanitizeLastAppRoute(
  rawPath: string | null | undefined
): string | null {
  if (!rawPath) return null;

  const decodedPath = decodeRouteValue(rawPath);
  const pathname = decodedPath.split(/[?#]/, 1)[0];

  if (!pathname.startsWith('/')) {
    return null;
  }

  const matchingPrefix = APP_ROUTE_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  return matchingPrefix ? pathname : null;
}

export function persistLastAppRoute(pathname: string): void {
  const route = sanitizeLastAppRoute(pathname);

  if (!route || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LAST_APP_ROUTE_STORAGE_KEY, route);

  const secureAttribute =
    window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie =
    `${LAST_APP_ROUTE_COOKIE_KEY}=${encodeURIComponent(route)}; Path=/; ` +
    `Max-Age=${LAST_APP_ROUTE_COOKIE_MAX_AGE}; SameSite=Lax${secureAttribute}`;
}

export function readLastAppRouteFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return sanitizeLastAppRoute(
    window.localStorage.getItem(LAST_APP_ROUTE_STORAGE_KEY)
  );
}

function decodeRouteValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
