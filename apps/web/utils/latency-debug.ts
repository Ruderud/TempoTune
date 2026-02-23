export function isLatencyDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem('tempo_tuner_latency_debug') === '1') return true;
  } catch {
    // ignore storage errors
  }

  try {
    return new URLSearchParams(window.location.search).get('tunerDebug') === '1';
  } catch {
    return false;
  }
}
