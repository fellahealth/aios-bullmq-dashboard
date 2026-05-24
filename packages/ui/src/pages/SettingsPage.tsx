import { Monitor, Moon, Sun, Timer } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { uiConfig } from '../lib/uiConfig';
import type { Theme } from '../lib/theme';
import { POLLING_OPTIONS, type PollingInterval } from '../lib/settings';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">
          Preferences are stored locally in this browser.
        </p>
      </header>

      <ThemeSection />
      <PollingSection />
    </div>
  );
}

function PollingSection() {
  const { pollingInterval, set } = useSettings();
  const forced = uiConfig.pollingInterval?.forceInterval;
  const isForced = typeof forced === 'number';

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
            <Timer className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
            Polling interval
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-fg-subtle)]">
            How often the dashboard re-fetches queue and job data.{' '}
            {isForced ? (
              <span className="text-amber-400">
                Server overrides this to {(forced as number) / 1000}s — your selection is ignored.
              </span>
            ) : (
              'Pick "Off" to stop background refreshes; the refresh button still works.'
            )}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <div
          role="radiogroup"
          aria-label="Polling interval"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
        >
          {POLLING_OPTIONS.map(({ value, label }) => {
            const active = pollingInterval === value;
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                disabled={isForced}
                onClick={() => set('pollingInterval', value as PollingInterval)}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-blue-500/60 bg-blue-500/10 text-[var(--color-fg)] ring-1 ring-inset ring-blue-500/30'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
                  isForced && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function ThemeSection() {
  const { theme, resolved, setTheme } = useTheme();

  const options: Array<{
    value: Theme;
    label: string;
    description: string;
    Icon: typeof Sun;
  }> = [
    {
      value: 'light',
      label: 'Light',
      description: 'A bright theme for well-lit environments.',
      Icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easier on the eyes in low-light environments.',
      Icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match your operating system preference automatically.',
      Icon: Monitor,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-fg)]">Theme</h2>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            Choose how the dashboard looks. Currently displaying:{' '}
            <span className="font-medium text-[var(--color-fg-muted)]">{resolved}</span>
            {theme === 'system' && (
              <span className="ml-1 text-[var(--color-fg-subtle)]">(from system)</span>
            )}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="grid gap-3 sm:grid-cols-3"
        >
          {options.map(({ value, label, description, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={cn(
                  'group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
                  active
                    ? 'border-blue-500/60 bg-blue-500/5 ring-2 ring-inset ring-blue-500/30'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <Preview variant={value} />
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
                      active
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-[var(--color-border-strong)] bg-transparent'
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
                      <span className="text-sm font-medium text-[var(--color-fg)]">{label}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-[var(--color-fg-subtle)]">
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function Preview({ variant }: { variant: Theme }) {
  // Mini mock of the dashboard chrome. For 'system' show a split view.
  if (variant === 'system') {
    return (
      <div className="relative h-20 overflow-hidden rounded-lg border border-[var(--color-border-subtle)]">
        <div className="absolute inset-0 grid grid-cols-2">
          <Mock dark={false} />
          <Mock dark={true} />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--color-border-strong)]" />
      </div>
    );
  }
  return (
    <div className="h-20 overflow-hidden rounded-lg border border-[var(--color-border-subtle)]">
      <Mock dark={variant === 'dark'} />
    </div>
  );
}

function Mock({ dark }: { dark: boolean }) {
  const bg = dark ? '#0a0b0e' : '#f7f7f9';
  const surface = dark ? '#181a23' : '#ffffff';
  const border = dark ? '#242732' : '#e5e7eb';
  const fg = dark ? '#fafafa' : '#0a0b0e';
  const fgMuted = dark ? '#71717a' : '#9ca3af';

  return (
    <div className="flex h-full w-full" style={{ background: bg }}>
      <div
        className="flex h-full w-1/3 flex-col gap-1 p-1.5"
        style={{ background: dark ? '#11131a' : '#ffffff', borderRight: `1px solid ${border}` }}
      >
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: fgMuted, opacity: 0.5 }} />
        <div className="mt-1 h-1 w-full rounded-full" style={{ background: '#3b82f6' }} />
        <div className="h-1 w-3/4 rounded-full" style={{ background: fgMuted, opacity: 0.3 }} />
        <div className="h-1 w-2/3 rounded-full" style={{ background: fgMuted, opacity: 0.3 }} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <div className="h-1.5 w-1/3 rounded-full" style={{ background: fg, opacity: 0.7 }} />
        <div className="flex gap-1.5">
          <div
            className="h-6 flex-1 rounded"
            style={{ background: surface, border: `1px solid ${border}` }}
          />
          <div
            className="h-6 flex-1 rounded"
            style={{ background: surface, border: `1px solid ${border}` }}
          />
        </div>
        <div
          className="h-1.5 w-1/2 rounded-full"
          style={{ background: fgMuted, opacity: 0.5 }}
        />
      </div>
    </div>
  );
}
