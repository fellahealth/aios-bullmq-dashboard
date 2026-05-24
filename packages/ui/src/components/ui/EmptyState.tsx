import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/40 py-14 px-6 text-center',
        className
      )}
    >
      {icon && <div className="text-[var(--color-fg-subtle)]">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-[var(--color-fg)]">{title}</p>
        {description && <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
