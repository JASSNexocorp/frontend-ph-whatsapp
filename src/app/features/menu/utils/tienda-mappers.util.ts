// Mapeo de DTOs de tienda al modelo de UI del menú.

import type { ColeccionMenuEjemplo, ProductoMenuEjemplo } from '../models/menu.models';
import type { InformacionTiendaDto, ProductoResumenInformacionDto } from '../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../models/tienda-producto.models';
import { formatearPrecioBs } from './menu-format.util';

/** Genera un id estable en kebab-case a partir del título de colección. */
export function idColeccionDesdeTitulo(titulo: string): string {
  const base = titulo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'coleccion';
}

function mapearProductoResumenAUIMenu(
  p: ProductoResumenInformacionDto,
  indice: number,
): ProductoMenuEjemplo {
  const nombre = String(p.nombre ?? p.titulo ?? 'Producto');
  const precioUnitario = typeof p.precio === 'number' ? p.precio : 0;
  const idBase = idColeccionDesdeTitulo(nombre);
  return {
    id: `${idBase}-${indice}`,
    nombre,
    precio: formatearPrecioBs(precioUnitario),
    precioUnitario,
    imagenUrl: typeof p.imagen === 'string' ? p.imagen : undefined,
  };
}

export function mapearInformacionAColeccionesMenu(
  dto: InformacionTiendaDto,
): ColeccionMenuEjemplo[] {
  return dto.colecciones.map((c) => ({
    id: idColeccionDesdeTitulo(c.titulo),
    nombre: c.titulo,
    productos: (c.productos ?? []).map((p, i) => mapearProductoResumenAUIMenu(p, i)),
  }));
}

/** Convierte el detalle de API en el modelo usado por el modal y el carrito. */
export function mapearProductoTiendaAUIMenu(dto: ProductoTiendaDto): ProductoMenuEjemplo {
  const opciones: NonNullable<ProductoMenuEjemplo['opciones']> = [];
  for (const sec of dto.metafield?.secciones ?? []) {
    if (sec.tipo !== 'opcion') continue;
    for (const op of sec.productos) {
      if (!op.estado) continue;
      opciones.push({
        id: `${sec.key}-${op.id}`,
        etiqueta: `${sec.titulo}: ${op.titulo}`,
        extraPrecio: op.precio ?? 0,
      });
    }
  }
  return {
    id: dto.id_ofisistema,
    nombre: dto.nombre,
    precio: formatearPrecioBs(dto.precio),
    precioUnitario: dto.precio,
    precioComparacionUnitario:
      dto.precio_comparacion > 0 ? dto.precio_comparacion : undefined,
    descripcion: dto.descripcion,
    imagenUrl: dto.imagen,
    opciones: opciones.length > 0 ? opciones : undefined,
  };
}
