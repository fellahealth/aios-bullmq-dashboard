import type { Status } from './types';

export const STATUS_META: Record<
  Status,
  { label: string; color: string; bg: string; ring: string; text: string }
> = {
  latest: {
    label: 'Latest',
    color: '#94a3b8',
    bg: 'bg-zinc-500/10',
    ring: 'ring-zinc-500/30',
    text: 'text-[var(--color-fg-muted)]',
  },
  active: {
    label: 'Active',
    color: 'var(--color-status-active)',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/30',
    text: 'text-blue-300',
  },
  waiting: {
    label: 'Waiting',
    color: 'var(--color-status-waiting)',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/30',
    text: 'text-amber-300',
  },
  'waiting-children': {
    label: 'Waiting children',
    color: 'var(--color-status-waiting)',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/30',
    text: 'text-amber-300',
  },
  prioritized: {
    label: 'Prioritized',
    color: 'var(--color-status-prioritized)',
    bg: 'bg-cyan-500/10',
    ring: 'ring-cyan-500/30',
    text: 'text-cyan-300',
  },
  completed: {
    label: 'Completed',
    color: 'var(--color-status-completed)',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
    text: 'text-emerald-300',
  },
  failed: {
    label: 'Failed',
    color: 'var(--color-status-failed)',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/30',
    text: 'text-red-300',
  },
  delayed: {
    label: 'Delayed',
    color: 'var(--color-status-delayed)',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500/30',
    text: 'text-violet-300',
  },
  paused: {
    label: 'Paused',
    color: 'var(--color-status-paused)',
    bg: 'bg-slate-500/10',
    ring: 'ring-slate-500/30',
    text: 'text-slate-300',
  },
};

export const PRIMARY_STATUSES: Status[] = [
  'active',
  'waiting',
  'delayed',
  'completed',
  'failed',
  'paused',
];
