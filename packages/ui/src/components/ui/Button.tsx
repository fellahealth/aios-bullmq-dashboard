import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ' +
  'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600',
  secondary:
    'bg-[var(--color-surface-3)] text-[var(--color-fg)] hover:bg-[var(--color-surface-4)] border border-[var(--color-border-subtle)]',
  ghost: 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
  outline:
    'border border-[var(--color-border-subtle)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
  icon: 'h-9 w-9',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});
