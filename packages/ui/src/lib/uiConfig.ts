import type { UIConfig } from './types';

export function readUIConfig(): UIConfig {
  try {
    const el = document.getElementById('__UI_CONFIG__');
    if (!el?.textContent) return {};
    return JSON.parse(el.textContent) as UIConfig;
  } catch {
    return {};
  }
}

export const uiConfig = readUIConfig();
