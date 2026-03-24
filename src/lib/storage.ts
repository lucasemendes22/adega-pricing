const STORAGE_KEY = 'adega-pricing-state';

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}
