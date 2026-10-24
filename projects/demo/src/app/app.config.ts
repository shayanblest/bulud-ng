import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideBuludLocale, provideBuludTheme } from 'bulud-ng';

import { buludTheme } from '../bulud.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideBuludTheme(buludTheme),
    provideBuludLocale(),
  ],
};
