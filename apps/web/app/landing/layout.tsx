import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TempoTune - 음악의 완벽한 템포',
  description: '전문 연주자와 작곡가를 위한 고정밀 튜닝 엔진과 스마트 메트로놈',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
