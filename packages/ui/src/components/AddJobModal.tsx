import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueName: string;
  queueDisplayName?: string;
}

interface OptsState {
  jobId: string;
  delay: string;
  attempts: string;
  priority: string;
}

const EMPTY_OPTS: OptsState = { jobId: '', delay: '', attempts: '', priority: '' };

export function AddJobModal({ open, onOpenChange, queueName, queueDisplayName }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [dataText, setDataText] = useState('{\n  \n}');
  const [opts, setOpts] = useState<OptsState>(EMPTY_OPTS);
  const [optsOpen, setOptsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the modal opens.
  useEffect(() => {
    if (open) {
      setName('');
      setDataText('{\n  \n}');
      setOpts(EMPTY_OPTS);
      setOptsOpen(false);
      setError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; data: unknown; options?: Record<string, any> }) =>
      api.addJob(queueName, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queues'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const apiMsg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to add job. Try again.';
      setError(String(apiMsg));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Job name is required.');
      return;
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(dataText);
    } catch (err: any) {
      setError(`Job data is not valid JSON: ${err?.message ?? 'parse error'}`);
      return;
    }

    const options = buildOptions(opts);
    mutation.mutate({ name: name.trim(), data: parsedData, options });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[min(680px,calc(100vh-2rem))] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col',
            'overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]',
            'shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
          )}
        >
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/30">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[15px] font-semibold leading-tight text-[var(--color-fg)]">
                  Add a job
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                  Enqueue a new job to{' '}
                  <span className="font-medium text-[var(--color-fg)]">
                    {queueDisplayName ?? queueName}
                  </span>
                  .
                </Dialog.Description>
              </div>
              <Dialog.Close
                type="button"
                className="-mr-1 -mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <Field label="Job name" hint="The name your worker will receive.">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. send-welcome-email"
                  autoFocus
                  className="h-9 w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </Field>

              <Field
                label="Data"
                hint="JSON payload passed to the worker. Must parse as valid JSON."
              >
                <textarea
                  value={dataText}
                  onChange={(e) => setDataText(e.target.value)}
                  spellCheck={false}
                  rows={8}
                  className="w-full resize-y rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </Field>

              <div className="space-y-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]/40">
                <button
                  type="button"
                  onClick={() => setOptsOpen((o) => !o)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      optsOpen && 'rotate-180'
                    )}
                  />
                  Advanced options
                  <span className="text-[var(--color-fg-subtle)]">
                    (job ID, delay, attempts, priority)
                  </span>
                </button>
                {optsOpen && (
                  <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border-subtle)] px-3 py-3">
                    <OptField
                      label="Job ID"
                      hint="Optional custom ID."
                      value={opts.jobId}
                      onChange={(v) => setOpts((s) => ({ ...s, jobId: v }))}
                      placeholder="auto"
                    />
                    <OptField
                      label="Priority"
                      hint="1 = highest. Omit for default."
                      type="number"
                      min={1}
                      value={opts.priority}
                      onChange={(v) => setOpts((s) => ({ ...s, priority: v }))}
                      placeholder="—"
                    />
                    <OptField
                      label="Delay (ms)"
                      hint="Wait before processing."
                      type="number"
                      min={0}
                      value={opts.delay}
                      onChange={(v) => setOpts((s) => ({ ...s, delay: v }))}
                      placeholder="0"
                    />
                    <OptField
                      label="Attempts"
                      hint="Total tries on failure."
                      type="number"
                      min={1}
                      value={opts.attempts}
                      onChange={(v) => setOpts((s) => ({ ...s, attempts: v }))}
                      placeholder="1"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                  <span className="font-mono leading-relaxed">{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={mutation.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
                {mutation.isPending ? 'Adding…' : 'Add job'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function buildOptions(opts: OptsState): Record<string, any> | undefined {
  const out: Record<string, any> = {};
  if (opts.jobId.trim()) out.jobId = opts.jobId.trim();
  if (opts.delay.trim()) {
    const n = Number(opts.delay);
    if (Number.isFinite(n) && n >= 0) out.delay = n;
  }
  if (opts.attempts.trim()) {
    const n = Number(opts.attempts);
    if (Number.isFinite(n) && n >= 1) out.attempts = n;
  }
  if (opts.priority.trim()) {
    const n = Number(opts.priority);
    if (Number.isFinite(n) && n >= 1) out.priority = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--color-fg)]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[var(--color-fg-subtle)]">{hint}</p>}
    </div>
  );
}

function OptField({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[var(--color-fg-muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        className="h-8 w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-2.5 text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      />
      {hint && (
        <p className="mt-1 text-[10px] leading-tight text-[var(--color-fg-subtle)]">{hint}</p>
      )}
    </div>
  );
}
