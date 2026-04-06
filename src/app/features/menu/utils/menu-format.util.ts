// Formato de precios en bolivianos para UI del menú.

import type { ProductoMenuEjemplo } from '../models/menu.models';

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

/** Firma para fusionar líneas: mismo producto y mismas opciones. */
export function firmaLineaCarrito(
  idProducto: string,
  idsOpcionesSeleccionadas: string[],
): string {
  return `${idProducto}|${[...idsOpcionesSeleccionadas].sort().join(',')}`;
}
