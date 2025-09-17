import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: {
              50: '{teal.50}',
              100: '{teal.100}',
              200: '{teal.200}',
              300: '{teal.300}',
              400: '{teal.400}',
              500: '{teal.500}',
              600: '{teal.600}',
              700: '{teal.700}',
              800: '{teal.800}',
              900: '{teal.900}',
              950: '{teal.950}',
            },
          },
          components: {
            button: {
              text: {
                primary: {
                  color: 'white',
                },
                secondary: {
                  color: 'white',
                  activeBackground: 'white',
                },
              },
            },
            progressbar: {
              root: {
                background: '#dbeafe',
                borderRadius: '10px',
              },
              value: {
                background: '{teal.700}',
              },
              label: {
                color: 'white',
              },
            },
          },
        }),
      },
    }),
  ],
};
