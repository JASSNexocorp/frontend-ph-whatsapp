// Agrega el header que pide ngrok (plan free) para no devolver HTML de aviso en lugar del JSON del API.

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_URL } from '../tokens/api-url.token';

const HEADER_NGROK = 'ngrok-skip-browser-warning';

export const interceptorNgrokSkipBrowserWarning: HttpInterceptorFn = (req, next) => {
  const baseApi = inject(API_URL).replace(/\/$/, '');
  const url = req.url;
  const esHaciaNuestroApi =
    url.startsWith(baseApi) || url.startsWith(`${baseApi}/`);

  if (!esHaciaNuestroApi || req.headers.has(HEADER_NGROK)) {
    return next(req);
  }

  const clon = req.clone({
    setHeaders: { [HEADER_NGROK]: 'true' },
  });
  return next(clon);
};
