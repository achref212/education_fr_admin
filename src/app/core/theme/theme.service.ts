import { effect, Injectable, signal } from '@angular/core';

type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function readStoredTheme(): AppTheme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private hasManualPreference = readStoredTheme() !== null;

  readonly isDark = signal<boolean>(
    readStoredTheme() ? readStoredTheme() === 'dark' : systemPrefersDark(),
  );

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    });

    this.colorSchemeQuery.addEventListener('change', event => {
      if (!this.hasManualPreference) {
        this.isDark.set(event.matches);
      }
    });
  }

  toggle(): void {
    this.isDark.update(value => {
      const nextValue = !value;
      localStorage.setItem(THEME_STORAGE_KEY, nextValue ? 'dark' : 'light');
      this.hasManualPreference = true;
      return nextValue;
    });
  }
}
