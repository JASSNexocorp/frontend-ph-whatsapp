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
 * - Producto normal: precio base del catálogo + suma de precios por sección.
 * - Pizza: solo suma de precios de opciones seleccionadas (no se usa el precio del producto padre).
 */
export function calcularPrecioTotalDetalle(
  detalle: ProductoDetalleUI,
  selecciones: SeleccionesPorSeccion,
): number {
  let total = detalle.esPizza ? 0 : detalle.precioBase;
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

/** Incremento de comparación por opción de sección: API o mismo monto que el extra de venta. */
function comparacionIncrementalOpcion(producto: {
  precio: number;
  precioComparacion: number;
}): number {
  if (producto.precioComparacion > 0) return producto.precioComparacion;
  if (producto.precio > 0) return producto.precio;
  return 0;
}

/**
 * Comparación total (modal y carrito): por cada opción seleccionada se suma
 * `precioComparacion` si viene; si no, el `precio` del extra (igual que al total de venta).
 * Además, si no es pizza, el precioComparacionBase del producto.
 */
export function calcularPrecioComparacionTotalDetalle(
  detalle: ProductoDetalleUI,
  selecciones: SeleccionesPorSeccion,
): number | undefined {
  let desdeSecciones = 0;
  for (const seccion of detalle.secciones) {
    const idsSeleccionados = selecciones[seccion.key] ?? [];
    for (const producto of seccion.productos) {
      if (idsSeleccionados.includes(producto.id) && !producto.bloqueado) {
        desdeSecciones += comparacionIncrementalOpcion(producto);
      }
    }
  }
  const desdeProducto = detalle.esPizza ? 0 : (detalle.precioComparacionBase ?? 0);
  const total = desdeProducto + desdeSecciones;
  return total > 0 ? total : undefined;
}

/** Firma para fusionar líneas: mismo producto y mismas opciones. */
export function firmaLineaCarrito(
  idProducto: string,
  idsOpcionesSeleccionadas: string[],
): string {
  return `${idProducto}|${[...idsOpcionesSeleccionadas].sort().join(',')}`;
}
