import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /**
   * Icon rendered inside the confirm button (and reused as the modal's
   * leading icon). Pass a lucide-react component as JSX, e.g. `<Pause />`.
   */
  icon?: ReactElement;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PendingState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...opts, open: true });
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => (prev ? { ...prev, open: false } : prev));
  };

  const isDanger = state?.variant === 'danger';
  const leadingIcon = state?.icon
    ? sizedIcon(state.icon, 'h-4 w-4')
    : isDanger
      ? <AlertTriangle className="h-4 w-4" />
      : null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog.Root open={state?.open ?? false} onOpenChange={(o) => !o && close(false)}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-40 bg-black/30',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0'
            )}
          />
          <Dialog.Content
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
              'overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]',
              'shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
            )}
          >
            <div className="flex items-start gap-3 px-5 pb-4 pt-5">
              {leadingIcon && (
                <div
                  className={cn(
                    'grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg ring-1 ring-inset',
                    isDanger
                      ? 'bg-red-500/10 text-red-400 ring-red-500/30'
                      : 'bg-blue-500/10 text-blue-400 ring-blue-500/30'
                  )}
                >
                  {leadingIcon}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <Dialog.Title className="text-[15px] font-semibold leading-tight text-[var(--color-fg)]">
                  {state?.title}
                </Dialog.Title>
                {state?.description && (
                  <Dialog.Description className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
                    {state.description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                className="-mr-1 -mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => close(false)}>
                {state?.cancelText ?? 'Cancel'}
              </Button>
              <Button
                variant={isDanger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => close(true)}
                autoFocus
              >
                {state?.icon && sizedIcon(state.icon, 'h-3.5 w-3.5')}
                {state?.confirmText ?? 'Confirm'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}

// Clone the caller-provided icon with a consistent sizing class so it lines
// up with the rest of the modal regardless of what classes they passed.
function sizedIcon(icon: ReactElement, sizeClass: string): ReactElement {
  if (!isValidElement(icon)) return icon;
  const existing = (icon.props as { className?: string }).className ?? '';
  return {
    ...icon,
    props: { ...(icon.props as object), className: cn(existing, sizeClass) },
  } as ReactElement;
}
