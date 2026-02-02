import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TempoTune',
  description: '메트로놈과 기타/베이스 튜너',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body>{children}</body>
    </html>
  );
}
