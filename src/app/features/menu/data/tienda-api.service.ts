// Cliente HTTP para endpoints de tienda (validar token, catálogo, producto).

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../core/tokens/api-url.token';
import type { RespuestaValidarToken } from '../models/menu-cliente-jwt.models';
import type { InformacionTiendaDto } from '../models/tienda-informacion.models';
import type {
  NotificarCarritoOkDto,
  NotificarCarritoRequestDto,
} from '../models/notificar-carrito.models';
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
   * Catálogo y sucursales — GET /tienda/informacion.
   * Contrato backend: solo header `ngrok-skip-browser-warning: true` (túnel ngrok).
   */
  obtenerInformacion(): Observable<InformacionTiendaDto> {
    const headers = new HttpHeaders({
      'ngrok-skip-browser-warning': 'true',
    });
    return this.http.get<InformacionTiendaDto>(
      `${this.apiUrl}/tienda/informacion`,
      { headers },
    );
  }

  /**
   * Detalle de producto por nombre/título.
   * El backend exige `titulo` en la query string (?titulo=...).
   * No usar body en GET: el navegador puede no enviarlo y Nest/Express no lo lee igual que la query.
   */
  obtenerProductoPorTitulo(titulo: string): Observable<ProductoTiendaDto> {
    const params = new HttpParams().set('titulo', titulo.trim());
    return this.http.get<ProductoTiendaDto>(`${this.apiUrl}/tienda/producto`, {
      params,
    });
  }

  /** Notifica el carrito y dispara el resumen por WhatsApp (JWT en body, sin Authorization). */
  notificarCarrito(
    cuerpo: NotificarCarritoRequestDto,
  ): Observable<NotificarCarritoOkDto> {
    return this.http.post<NotificarCarritoOkDto>(
      `${this.apiUrl}/tienda/notificar-carrito`,
      cuerpo,
    );
  }
}
