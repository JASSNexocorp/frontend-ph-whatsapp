// Formato de precios en bolivianos para UI del menú.

import type { ProductoDetalleUI, ProductoMenuEjemplo, SeleccionesPorSeccion } from '../models/menu.models';

export function formatearPrecioBs(valor: number): string {
  return `Bs. ${valor}`;
}

/** Precio unitario base más extras de opciones activas (condimentos). */
export function calcularPrecioUnitarioConOpciones(
  producto: ProductoMenuEjemplo,
  idsOpcionesActivas: string[],
): number {
  const extra = (producto.opciones ?? [])
    .filter((o) => idsOpcionesActivas.includes(o.id))
    .reduce((acc, o) => acc + (o.extraPrecio ?? 0), 0);
  return producto.precioUnitario + extra;
}

/**
 * Precio total de un detalle de producto según las selecciones activas.
 * = precio base + suma de precios de cada producto seleccionado por sección.
 */
export function calcularPrecioTotalDetalle(
  detalle: ProductoDetalleUI,
  selecciones: SeleccionesPorSeccion,
): number {
  let total = detalle.precioBase;
  for (const seccion of detalle.secciones) {
    const idsSeleccionados = selecciones[seccion.key] ?? [];
    for (const producto of seccion.productos) {
      if (idsSeleccionados.includes(producto.id) && !producto.bloqueado) {
        total += producto.precio;
      }
    }
  }
  return total;
}

/** Firma para fusionar líneas: mismo producto y mismas opciones. */
export function firmaLineaCarrito(
  idProducto: string,
  idsOpcionesSeleccionadas: string[],
): string {
  return `${idProducto}|${[...idsOpcionesSeleccionadas].sort().join(',')}`;
}
