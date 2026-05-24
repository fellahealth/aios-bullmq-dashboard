import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { STATUS_META } from '../../lib/status';
import type { Status } from '../../lib/types';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  tone?: 'neutral' | 'success' | 'danger' | 'warn' | 'info';
  size?: 'sm' | 'md';
}

const tones = {
  neutral: 'bg-zinc-500/10 text-[var(--color-fg-muted)] ring-zinc-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  danger: 'bg-red-500/10 text-red-300 ring-red-500/30',
  warn: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  info: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
};

export function Badge({ status, tone = 'neutral', size = 'sm', className, children, ...rest }: Props) {
  const cls = status
    ? cn(STATUS_META[status].bg, STATUS_META[status].text, STATUS_META[status].ring)
    : tones[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full ring-1 ring-inset font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        cls,
        className
      )}
      {...rest}
    >
      {status && <Dot status={status} />}
      {children ?? (status && STATUS_META[status].label)}
    </span>
  );
}

function Dot({ status }: { status: Status }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ background: STATUS_META[status].color }}
    />
  );
}
