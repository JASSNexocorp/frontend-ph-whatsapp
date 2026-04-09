// Construye el cuerpo del pedido para otro servicio: líneas, opciones con id y resumen de montos.

import type { LineaCarrito, TipoEntregaId } from '../models/menu.models';

export interface OpcionPedidoPayload {
  tituloSeccion: string;
  nombreOpcion: string;
  /** ID ofisistema efectivo de la opción (mismo orden que al armar el carrito). */
  idOfisistema: string;
}

export interface LineaPedidoPayload {
  idOfisistema: string;
  idShopify: string;
  /** Mismo nombre que en el metafield / Nest cuando el API lo envía. */
  object_number?: string;
  nombre: string;
  cantidad: number;
  opciones: OpcionPedidoPayload[];
}

export interface CarritoPedidoPayload {
  /** JWT del menú (mismo que en query al entrar); el backend infiere domicilio/retiro. */
  token: string;
  /** Suma de (precio unitario × cantidad) por línea — productos, sin envío. */
  subtotalProductos: number;
  /**
   * Suma de precios de comparación (tachados) por línea, si aplica.
   * Misma regla que la UI: null si no hay monto de comparación relevante.
   */
  subtotalComparacion: number | null;
  /** Costo de envío aplicado (0 si retiro en local). */
  costoEnvio: number;
  /** subtotalProductos + costoEnvio. */
  total: number;
  lineas: LineaPedidoPayload[];
}

function resumenMontosPedido(
  lineas: LineaCarrito[],
  tipoEntrega: TipoEntregaId,
  costoEnvioDomicilio: number,
): Omit<CarritoPedidoPayload, 'token' | 'lineas'> {
  const subtotalProductos = lineas.reduce(
    (acc, l) => acc + l.precioUnitario * l.cantidad,
    0,
  );
  const sumaComparacion = lineas.reduce((acc, l) => {
    if (l.precioComparacionUnitario == null) return acc;
    return acc + l.precioComparacionUnitario * l.cantidad;
  }, 0);
  const subtotalComparacion = sumaComparacion > 0 ? sumaComparacion : null;
  const costoEnvio =
    tipoEntrega === 'domicilio' ? Math.max(0, costoEnvioDomicilio) : 0;
  const total = subtotalProductos + costoEnvio;
  return { subtotalProductos, subtotalComparacion, costoEnvio, total };
}

/**
 * Arma el payload del pedido.
 * `tipoEntrega` solo afecta costoEnvio/total en front; no se serializa (va implícito en el token).
 * Cada opción lleva su id ofisistema; el orden de `idsOpcionesSeleccionadas` debe coincidir con `opcionesCarrito`.
 */
export function construirPayloadPedidoDesdeCarrito(
  lineas: LineaCarrito[],
  tipoEntrega: TipoEntregaId,
  costoEnvioDomicilio: number,
  token: string,
): CarritoPedidoPayload {
  const montos = resumenMontosPedido(lineas, tipoEntrega, costoEnvioDomicilio);
  return {
    token,
    ...montos,
    lineas: lineas.map((l) => ({
      idOfisistema: l.idProducto,
      idShopify: l.idShopify,
      ...(l.object_number != null && l.object_number.trim() !== ''
        ? { object_number: l.object_number.trim() }
        : {}),
      nombre: l.nombre,
      cantidad: l.cantidad,
      opciones: l.opcionesCarrito.map((o, i) => ({
        tituloSeccion: o.tituloSeccion,
        nombreOpcion: o.nombreOpcion,
        idOfisistema: l.idsOpcionesSeleccionadas[i] ?? '',
      })),
    })),
  };
}
