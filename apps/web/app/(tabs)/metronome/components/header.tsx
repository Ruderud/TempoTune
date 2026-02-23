'use client';

import { Icon } from '../../../../components/common/icon.component';

export function MetronomeHeader() {
  return (
    <div className="flex items-center justify-between shrink-0">
      <button type="button" className="p-2 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
        <Icon src="/assets/icons/menu.svg" size={18} label="메뉴" />
      </button>
      <span className="text-lg font-bold tracking-[0.1em] text-primary">TEMPOTUNE</span>
      <button type="button" className="p-2 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
        <Icon src="/assets/icons/settings.svg" size={20} label="설정" />
      </button>
    </div>
  );
}
