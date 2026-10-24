import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class BasePreferences {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<'fa' | 'en'>('fa');
  readonly dark = signal(false);
  readonly text = (fa: string, en: string) =>
    this.language() === 'fa' ? fa : en;
  constructor() {
    try {
      const saved = JSON.parse(
        this.document.defaultView?.localStorage.getItem(
          'bulud-base-preferences',
        ) ?? 'null',
      ) as { language?: unknown; dark?: unknown } | null;
      if (saved?.language === 'en') this.language.set('en');
      if (saved?.dark === true) this.dark.set(true);
    } catch {
      /* Storage is optional. */
    }
    effect(() => {
      const root = this.document.documentElement;
      root.lang = this.language();
      root.dir = this.language() === 'fa' ? 'rtl' : 'ltr';
      root.setAttribute('data-theme', this.dark() ? 'dark' : 'light');
      this.document.title = this.text(
        'بلود · بیس انگور',
        'Bulud · Angour foundation',
      );
      try {
        this.document.defaultView?.localStorage.setItem(
          'bulud-base-preferences',
          JSON.stringify({ language: this.language(), dark: this.dark() }),
        );
      } catch {
        /* Private browsing may deny storage. */
      }
    });
  }
}
