// Cliente HTTP para endpoints de tienda (validar token, catálogo, producto).

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../core/tokens/api-url.token';
import type { RespuestaValidarToken } from '../models/menu-cliente-jwt.models';
import type { InformacionTiendaDto } from '../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../models/tienda-producto.models';

@Injectable({ providedIn: 'root' })
export class TiendaApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  validarToken(token: string): Observable<RespuestaValidarToken> {
    return this.http.post<RespuestaValidarToken>(
      `${this.apiUrl}/tienda/validar-token`,
      { token },
    );
  }

  /**
   * Catálogo y sucursales. Si se pasa `titulo`, el backend puede filtrar
   * (mismo contrato que el cURL con body urlencoded en GET).
   */
  obtenerInformacion(titulo?: string): Observable<InformacionTiendaDto> {
    const url = `${this.apiUrl}/tienda/informacion`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    if (titulo != null && titulo.trim() !== '') {
      const body = new HttpParams().set('titulo', titulo).toString();
      return this.http.request<InformacionTiendaDto>('GET', url, {
        headers,
        body,
      });
    }
    return this.http.get<InformacionTiendaDto>(url);
  }

  /** Detalle de producto por nombre/título (contrato del backend con body en GET). */
  obtenerProductoPorTitulo(titulo: string): Observable<ProductoTiendaDto> {
    const url = `${this.apiUrl}/tienda/producto`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = new HttpParams().set('titulo', titulo).toString();
    return this.http.request<ProductoTiendaDto>('GET', url, {
      headers,
      body,
    });
  }
}
