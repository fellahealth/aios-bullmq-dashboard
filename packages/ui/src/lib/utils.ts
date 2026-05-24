import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  formatDistanceToNowStrict,
  format,
  intervalToDuration,
  formatDuration,
} from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(ts: number | string | Date | null | undefined) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatAbsolute(ts: number | string | Date | null | undefined) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM d, yyyy HH:mm:ss');
}

export function formatDurationMs(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const d = intervalToDuration({ start: 0, end: ms });
  return formatDuration(d, { format: ['hours', 'minutes', 'seconds'] }) || `${ms}ms`;
}

export function formatNumber(n: number | null | undefined) {
  if (n == null) return '0';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
