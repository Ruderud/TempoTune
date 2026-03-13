'use client';

import { ThemeModeMenu } from './theme-mode-menu.component';

type MobilePageHeaderProps = {
  title: string;
};

export function MobilePageHeader({ title }: MobilePageHeaderProps) {
  return (
    <div className="grid grid-cols-[40px_1fr_40px] items-center shrink-0 py-5">
      {/* TODO: Restore a real mobile overflow menu when there are secondary destinations worth exposing here. */}
      <div aria-hidden="true" className="h-10 w-10" />
      <span className="text-center text-lg font-bold tracking-[0.1em] text-primary">
        {title}
      </span>
      <div className="justify-self-end">
        <ThemeModeMenu />
      </div>
    </div>
  );
}
