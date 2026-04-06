import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Base URL del API de tienda (inyectable para tests). */
export const API_URL = new InjectionToken<string>('API_URL', {
  factory: () => environment.apiUrl,
});
