
import { Service, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Service()
export class ThemeService {

  private readonly storageKey = 'vinoteca-theme';

  readonly theme = signal<Theme>('light');

  constructor() {
    const savedTheme = localStorage.getItem(this.storageKey);

    const initialTheme: Theme =
      savedTheme === 'dark' ? 'dark' : 'light';

    this.setTheme(initialTheme);
  }

  toggleTheme(): void {
    const nextTheme: Theme =
      this.theme() === 'light' ? 'dark' : 'light';

    this.setTheme(nextTheme);
  }

  private setTheme(theme: Theme): void {
    this.theme.set(theme);

    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark'
    );

    localStorage.setItem(this.storageKey, theme);
  }
}

