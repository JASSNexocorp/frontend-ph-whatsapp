import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { interceptorNgrokSkipBrowserWarning } from './core/interceptors/ngrok-skip-browser-warning.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([interceptorNgrokSkipBrowserWarning])),
    provideRouter(routes),
  ],
};
