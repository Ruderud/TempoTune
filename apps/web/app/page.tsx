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
  title: 'TempoTune - 음악의 완벽한 템포',
  description: '전문 연주자와 작곡가를 위한 고정밀 튜닝 엔진과 스마트 메트로놈',
};

export default async function Home() {
  const cookieStore = await cookies();
  const lastRoute = sanitizeLastAppRoute(
    cookieStore.get(LAST_APP_ROUTE_COOKIE_KEY)?.value
  );

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
