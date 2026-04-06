// Mapeo del payload interno al DTO del backend y mensajes de error HTTP.

import { HttpErrorResponse } from '@angular/common/http';

import type { CarritoPedidoPayload } from './menu-pedido-payload.util';
import type {
  NotificarCarritoLineaDto,
  NotificarCarritoLineaOpcionDto,
  NotificarCarritoRequestDto,
} from '../models/notificar-carrito.models';

/** Body JSON listo para POST /tienda/notificar-carrito (sin nulls que rompan class-validator). */
export function aCuerpoNotificarCarritoApi(
  payload: CarritoPedidoPayload,
): NotificarCarritoRequestDto {
  const lineas: NotificarCarritoLineaDto[] = payload.lineas.map((l) => {
    const linea: NotificarCarritoLineaDto = {
      nombre: l.nombre,
      cantidad: l.cantidad,
    };
    if (l.idOfisistema.trim() !== '') {
      linea.idOfisistema = l.idOfisistema;
    }
    if (l.idShopify.trim() !== '') {
      linea.idShopify = l.idShopify;
    }
    const opciones: NotificarCarritoLineaOpcionDto[] = l.opciones.map((o) => {
      const op: NotificarCarritoLineaOpcionDto = {
        tituloSeccion: o.tituloSeccion,
        nombreOpcion: o.nombreOpcion,
      };
      if (o.idOfisistema.trim() !== '') {
        op.idOfisistema = o.idOfisistema;
      }
      return op;
    });
    if (opciones.length > 0) {
      linea.opciones = opciones;
    }
    return linea;
  });

  const cuerpo: NotificarCarritoRequestDto = {
    token: payload.token,
    subtotalProductos: payload.subtotalProductos,
    costoEnvio: payload.costoEnvio,
    total: payload.total,
    lineas,
  };
  if (payload.subtotalComparacion != null) {
    cuerpo.subtotalComparacion = payload.subtotalComparacion;
  }
  return cuerpo;
}

/** Mensaje amigable según respuesta del backend (Nest). */
export function mensajeUsuarioNotificarCarrito(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'No se pudo enviar el pedido. Verificá tu conexión e intentá de nuevo.';
  }
  if (err.status === 401) {
    const msg = err.error?.message;
    if (msg && typeof msg === 'object' && msg !== null && 'detalle' in msg) {
      const detalle = (msg as { detalle?: unknown }).detalle;
      if (typeof detalle === 'string' && detalle.trim() !== '') {
        return detalle;
      }
    }
    return 'Tu sesión expiró o el enlace no es válido. Pedí un enlace nuevo por WhatsApp.';
  }
  if (err.status === 404) {
    const m = err.error?.message;
    if (typeof m === 'string' && m.trim() !== '') {
      return m;
    }
    return 'No encontramos tu cuenta. Contactá al local.';
  }
  if (err.status === 400) {
    return 'Revisá el carrito e intentá de nuevo. Si el problema continúa, pedí ayuda por WhatsApp.';
  }
  if (err.status === 0) {
    return 'Sin conexión. Verificá tu red e intentá de nuevo.';
  }
  return 'No se pudo enviar el pedido. Intentá de nuevo en unos minutos.';
}
