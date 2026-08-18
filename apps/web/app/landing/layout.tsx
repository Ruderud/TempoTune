import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TempoTune - 박자와 음정을 위한 연습 도구',
  description:
    '메트로놈, 튜너, 리듬 연습을 웹과 모바일에서 사용하는 음악 연습 도구',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
