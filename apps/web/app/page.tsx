import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from '../components/landing/landing-page.component';
import { ResumeLastAppRoute } from '../components/landing/resume-last-app-route.component';
import {
  LAST_APP_ROUTE_COOKIE_KEY,
  sanitizeLastAppRoute,
} from '../lib/last-app-route';

export const metadata: Metadata = {
  title: 'TempoTune - 박자와 음정을 위한 연습 도구',
  description:
    '메트로놈, 튜너, 리듬 연습을 웹과 모바일에서 사용하는 음악 연습 도구',
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nativeAppRoute = sanitizeLastAppRoute(
    typeof resolvedSearchParams?.appEntryPath === 'string'
      ? resolvedSearchParams.appEntryPath
      : null
  );
  const isNativeAppBootstrap = resolvedSearchParams?.nativeApp === '1';
  const lastRoute = sanitizeLastAppRoute(
    cookieStore.get(LAST_APP_ROUTE_COOKIE_KEY)?.value
  );

  if (isNativeAppBootstrap) {
    redirect(nativeAppRoute ?? '/metronome');
  }

  if (lastRoute) {
    redirect(lastRoute);
  }

  return (
    <>
      <ResumeLastAppRoute />
      <LandingPage />
    </>
  );
}
