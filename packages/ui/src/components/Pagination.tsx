import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  const pages = visiblePages(page, pageCount);

  return (
    <nav className="flex items-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={idx} className="px-1 text-xs text-[var(--color-fg-subtle)]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'min-w-7 rounded-md px-2 py-1 text-xs tabular-nums',
              p === page
                ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function visiblePages(current: number, total: number): Array<number | '…'> {
  const range: Array<number | '…'> = [];
  const window = 1;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - window && i <= current + window)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '…') {
      range.push('…');
    }
  }
  return range;
}
