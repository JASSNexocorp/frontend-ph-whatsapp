// Mapeo de DTOs de tienda al modelo de UI del menú.

import type {
  ColeccionMenuEjemplo,
  ProductoDetalleUI,
  ProductoMenuEjemplo,
  ProductoSeccionUI,
  SeccionProductoUI,
  SeleccionesPorSeccion,
} from '../models/menu.models';
import type {
  InformacionTiendaDto,
  ProductoResumenInformacionDto,
} from '../models/tienda-informacion.models';
import type {
  ProductoMetafieldSeccionDto,
  ProductoOpcionMetafieldDto,
  ProductoTiendaDto,
} from '../models/tienda-producto.models';
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

// ---------------------------------------------------------------------------
// Resolución del detalle con secciones
// ---------------------------------------------------------------------------

const CLAVE_COLECCION_PIZZA = 'Pizzas';
const CLAVE_SECCION_TAMANO = 'tamano';

/**
 * Resuelve un producto de sección aplicando:
 * - disponibilidad en sucursal (código PH01/PH02…)
 * - criterios_ver si el producto es de una pizza (precios e IDs por tamaño)
 * - estado (false → bloqueado pero visible)
 */
function resolverProductoDeSeccion(
  op: ProductoOpcionMetafieldDto,
  seccionKey: string,
  esPizza: boolean,
  tamanoSeleccionadoId: string | null,
  codigoSucursal: string | null,
): ProductoSeccionUI {
  // FASE 1: Disponibilidad en la sucursal del cliente
  const enSucursal =
    !codigoSucursal || op.sucursales.includes(codigoSucursal);

  // FASE 2: Criterios_ver — solo para pizzas, en secciones que NO son el tamaño
  let idEfectivo = op.id;
  let precio = op.precio;
  let precioComparacion = op.precio_comparacion;
  let sinCriterio = false;

  const esTamano = seccionKey === CLAVE_SECCION_TAMANO;
  if (esPizza && !esTamano && op.criterios_ver.length > 0) {
    if (tamanoSeleccionadoId) {
      const criterio = op.criterios_ver.find(
        (c) => c.seccionKey === CLAVE_SECCION_TAMANO && c.opcionId === tamanoSeleccionadoId,
      );
      if (criterio) {
        idEfectivo = criterio.id;
        precio = criterio.precio;
        precioComparacion = criterio.precio_comparacion;
      } else {
        // No hay criterio para este tamaño → deshabilitado
        sinCriterio = true;
      }
    }
    // Si no hay tamaño seleccionado todavía, mostramos valores base
  }

  const bloqueado = !op.estado || !enSucursal || sinCriterio;

  return {
    id: op.id,
    idEfectivo,
    titulo: op.titulo,
    precio,
    precioComparacion,
    imagenUrl: op.urlImage?.trim() ? normalizarUrlImagen(op.urlImage) ?? null : null,
    bloqueado,
  };
}

/**
 * Procesa una sección del metafield:
 * - Ignora secciones tipo subcarrito
 * - Ordena productos por precio asc (bloqueados mantienen su posición relativa)
 * - Aplica la lógica de criterios_ver y sucursal a cada producto
 */
function resolverSeccion(
  sec: ProductoMetafieldSeccionDto,
  esPizza: boolean,
  tamanoSeleccionadoId: string | null,
  codigoSucursal: string | null,
): SeccionProductoUI | null {
  if (sec.tipo === 'subcarrito') return null;

  const productos = sec.productos
    .map((op) =>
      resolverProductoDeSeccion(op, sec.key, esPizza, tamanoSeleccionadoId, codigoSucursal),
    )
    .sort((a, b) => a.precio - b.precio);

  return {
    key: sec.key,
    titulo: sec.titulo,
    min: sec.min ?? 0,
    max: sec.max ?? 1,
    productos,
  };
}

/**
 * Convierte el DTO crudo + selecciones actuales en el modelo UI completo
 * que consume el modal de detalle de producto.
 *
 * Se llama cada vez que el usuario cambia una selección (computed reactivo).
 */
export function resolverProductoDetalle(
  dto: ProductoTiendaDto,
  selecciones: SeleccionesPorSeccion,
  codigoSucursal: string | null,
): ProductoDetalleUI {
  const esPizza = dto.colecciones?.includes(CLAVE_COLECCION_PIZZA) ?? false;
  const tamanoSeleccionadoId = selecciones[CLAVE_SECCION_TAMANO]?.[0] ?? null;

  const secciones: SeccionProductoUI[] = (dto.metafield?.secciones ?? [])
    .map((sec) => resolverSeccion(sec, esPizza, tamanoSeleccionadoId, codigoSucursal))
    .filter((s): s is SeccionProductoUI => s !== null);

  // Disponibilidad global del producto (igual que el resumen del catálogo)
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
  const { disponible, mensaje } = dto.estado === false
    ? { disponible: false, mensaje: 'Este producto no está disponible en catálogo.' }
    : evaluarDisponibilidadProductoResumen(resumenLike, null);

  return {
    id: dto.id_ofisistema,
    nombre: dto.nombre,
    precioBase: dto.precio,
    precioComparacionBase: dto.precio_comparacion > 0 ? dto.precio_comparacion : null,
    imagenUrl: normalizarUrlImagen(dto.imagen) ?? null,
    disponible,
    mensajeNoDisponible: mensaje,
    secciones,
    esPizza,
  };
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
