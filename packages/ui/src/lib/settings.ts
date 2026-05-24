export type PollingInterval = 0 | 1000 | 3000 | 5000 | 10000 | 30000;

export const POLLING_OPTIONS: Array<{ value: PollingInterval; label: string }> = [
  { value: 0, label: 'Off' },
  { value: 1000, label: '1 second' },
  { value: 3000, label: '3 seconds' },
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' },
];

export type JobsPerPage = 10 | 20 | 50 | 100;

export const JOBS_PER_PAGE_OPTIONS: JobsPerPage[] = [10, 20, 50, 100];

export interface Settings {
  pollingInterval: PollingInterval;
  jobsPerPage: JobsPerPage;
}

export const DEFAULT_SETTINGS: Settings = {
  pollingInterval: 5000,
  jobsPerPage: 20,
};

export const SETTINGS_STORAGE_KEY = 'aios-bullmq-settings';

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
}
