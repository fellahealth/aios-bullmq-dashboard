import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/80 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]',
        'backdrop-blur-sm',
        className
      )}
      {...rest}
    />
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3', className)}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3', className)} {...rest} />;
}
