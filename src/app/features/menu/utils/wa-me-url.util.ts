// Construye https://wa.me/... desde el teléfono de la sucursal del JWT (catálogo GET /tienda/informacion).

import type { InformacionTiendaDto } from '../models/tienda-informacion.models';

/**
 * URL para abrir el chat de WhatsApp de la sucursal asociada al menú.
 * Si no hay match o el teléfono no es usable, devuelve null (tocará history.back u otro fallback).
 */
export function urlWaMeSucursalCliente(
  informacion: InformacionTiendaDto | null,
  nombreSucursalJwt: string | null,
): string | null {
  if (!informacion || !nombreSucursalJwt?.trim()) return null;
  const nombreNorm = nombreSucursalJwt.trim().toUpperCase();
  const sucursal = informacion.sucursales.find(
    (s) => s.nombre.trim().toUpperCase() === nombreNorm,
  );
  const tel = sucursal?.telefono?.trim() ?? '';
  if (!tel) return null;
  const digitos = tel.replace(/\D/g, '');
  if (digitos.length < 8) return null;
  return `https://wa.me/${digitos}`;
}
