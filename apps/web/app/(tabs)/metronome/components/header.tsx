'use client';

import { Icon } from '../../../../components/common/icon.component';

export function MetronomeHeader() {
  return (
    <div className="flex items-center justify-between shrink-0 py-5">
      <button
        type="button"
        aria-label="메뉴"
        className="p-2 rounded-lg bg-card-soft border border-border-subtle flex items-center justify-center text-primary/70"
      >
        <Icon name="menu" size={18} label="메뉴" />
      </button>
      <span className="text-lg font-bold tracking-[0.1em] text-primary">
        TEMPOTUNE
      </span>
      <button
        type="button"
        aria-label="설정"
        className="p-2 rounded-lg bg-card-soft border border-border-subtle flex items-center justify-center text-primary/70"
      >
        <Icon name="settings" size={20} label="설정" />
      </button>
    </div>
  );
}
