// Mapeo de DTOs de tienda al modelo de UI del menú.

import type { ColeccionMenuEjemplo, ProductoMenuEjemplo } from '../models/menu.models';
import type {
  InformacionTiendaDto,
  ProductoResumenInformacionDto,
} from '../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../models/tienda-producto.models';
import { formatearPrecioBs } from './menu-format.util';
import { normalizarUrlImagen } from './menu-url.util';

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

function normalizarNombreSucursalClave(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Productos con `estado === false` no se listan en el menú (se filtran antes de mapear). */
export function productoResumenVisibleEnMenu(
  p: ProductoResumenInformacionDto,
): boolean {
  return p.estado !== false;
}

const MENSAJE_STOCK_TOTAL = 'Sin stock disponible.';
const MENSAJE_SUCURSAL_ASIGNADA =
  'No disponible para la sucursal asignada.';

/**
 * Solo stock (total y por sucursal del JWT). Los inactivos por estado no llegan al listado.
 */
export function evaluarDisponibilidadProductoResumen(
  p: ProductoResumenInformacionDto,
  nombreSucursalCliente: string | null,
): { disponible: boolean; mensaje: string | undefined } {
  if (typeof p.stock_total === 'number' && p.stock_total <= 0) {
    return {
      disponible: false,
      mensaje: MENSAJE_STOCK_TOTAL,
    };
  }

  const nombreCliente = nombreSucursalCliente?.trim();
  if (!nombreCliente) {
    return { disponible: true, mensaje: undefined };
  }

  const lista = p.sucursales;
  if (!lista || lista.length === 0) {
    return {
      disponible: false,
      mensaje: MENSAJE_SUCURSAL_ASIGNADA,
    };
  }

  const clave = normalizarNombreSucursalClave(nombreCliente);
  const fila = lista.find(
    (s) => normalizarNombreSucursalClave(s.nombre) === clave,
  );

  if (!fila) {
    return {
      disponible: false,
      mensaje: MENSAJE_SUCURSAL_ASIGNADA,
    };
  }

  if (typeof fila.stock === 'number' && fila.stock <= 0) {
    return {
      disponible: false,
      mensaje: MENSAJE_SUCURSAL_ASIGNADA,
    };
  }

  return { disponible: true, mensaje: undefined };
}

function idProductoResumen(
  p: ProductoResumenInformacionDto,
  nombre: string,
  indice: number,
): string {
  const ofi = p.id_ofisistema;
  if (typeof ofi === 'string' && ofi.trim() !== '') {
    return ofi.trim();
  }
  const shop = p.id_shopify;
  if (typeof shop === 'string' && shop.trim() !== '') {
    return shop.trim();
  }
  return `${idColeccionDesdeTitulo(nombre)}-${indice}`;
}

function mapearProductoResumenAUIMenu(
  p: ProductoResumenInformacionDto,
  indice: number,
  nombreSucursalCliente: string | null,
): ProductoMenuEjemplo {
  const nombre = String(p.nombre ?? p.titulo ?? 'Producto');
  const precioUnitario = typeof p.precio === 'number' ? p.precio : 0;
  const precioCompRaw = p.precio_comparacion;
  const precioComparacionUnitario =
    typeof precioCompRaw === 'number' && precioCompRaw > 0
      ? precioCompRaw
      : undefined;
  const { disponible, mensaje } = evaluarDisponibilidadProductoResumen(
    p,
    nombreSucursalCliente,
  );

  return {
    id: idProductoResumen(p, nombre, indice),
    nombre,
    precio: formatearPrecioBs(precioUnitario),
    precioUnitario,
    precioComparacionUnitario,
    imagenUrl: normalizarUrlImagen(
      typeof p.imagen === 'string' ? p.imagen : undefined,
    ),
    disponible,
    mensajeNoDisponible: mensaje,
  };
}

export function mapearInformacionAColeccionesMenu(
  dto: InformacionTiendaDto,
  nombreSucursalCliente: string | null,
): ColeccionMenuEjemplo[] {
  return dto.colecciones.map((c) => ({
    id: idColeccionDesdeTitulo(c.titulo),
    nombre: c.titulo,
    productos: (c.productos ?? [])
      .filter((p) => productoResumenVisibleEnMenu(p))
      .map((p, i) =>
        mapearProductoResumenAUIMenu(p, i, nombreSucursalCliente),
      ),
  }));
}

/** Convierte el detalle de API en el modelo usado por el modal y el carrito. */
export function mapearProductoTiendaAUIMenu(
  dto: ProductoTiendaDto,
  nombreSucursalCliente: string | null = null,
): ProductoMenuEjemplo {
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

  if (dto.estado === false) {
    return {
      id: dto.id_ofisistema,
      nombre: dto.nombre,
      precio: formatearPrecioBs(dto.precio),
      precioUnitario: dto.precio,
      precioComparacionUnitario:
        dto.precio_comparacion > 0 ? dto.precio_comparacion : undefined,
      descripcion: dto.descripcion,
      imagenUrl: normalizarUrlImagen(dto.imagen),
      opciones: opciones.length > 0 ? opciones : undefined,
      disponible: false,
      mensajeNoDisponible: 'Este producto no está disponible en catálogo.',
    };
  }

  const resumenLike: ProductoResumenInformacionDto = {
    nombre: dto.nombre,
    precio: dto.precio,
    precio_comparacion: dto.precio_comparacion,
    imagen: dto.imagen,
    estado: dto.estado,
    stock_total: dto.stock_total,
    sucursales: dto.sucursales,
    id_ofisistema: dto.id_ofisistema,
    id_shopify: dto.id_shopify,
  };
  const { disponible, mensaje } = evaluarDisponibilidadProductoResumen(
    resumenLike,
    nombreSucursalCliente,
  );

  return {
    id: dto.id_ofisistema,
    nombre: dto.nombre,
    precio: formatearPrecioBs(dto.precio),
    precioUnitario: dto.precio,
    precioComparacionUnitario:
      dto.precio_comparacion > 0 ? dto.precio_comparacion : undefined,
    descripcion: dto.descripcion,
    imagenUrl: normalizarUrlImagen(dto.imagen),
    opciones: opciones.length > 0 ? opciones : undefined,
    disponible,
    mensajeNoDisponible: mensaje,
  };
}
