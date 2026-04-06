// Normaliza el tipo de entrega que viene en el JWT hacia el id usado en la UI.

import type { TipoEntregaId } from '../models/menu.models';

/**
 * Convierte valores típicos del backend (`delivery`, `DOMICILIO`, etc.) a `domicilio` | `retiro`.
 * Si no se reconoce, devuelve null (la UI permite elegir en el carrito).
 */
export function normalizarTipoEntregaJwt(
  valor: string | null | undefined,
): TipoEntregaId | null {
  if (valor == null || String(valor).trim() === '') return null;
  const v = String(valor).trim().toLowerCase();
  if (
    v === 'domicilio' ||
    v === 'delivery' ||
    v === 'envio' ||
    v === 'envío'
  ) {
    return 'domicilio';
  }
  if (
    v === 'retiro' ||
    v === 'pickup' ||
    v === 'local' ||
    v === 'tienda'
  ) {
    return 'retiro';
  }
  return null;
}
