// Visibilidad de productos por metafield `dia` (misma regla que el Liquid de Shopify).

import type { ProductoResumenInformacionDto } from '../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../models/tienda-producto.models';

/** Índice 0 = Domingo … 6 = Sábado (igual que Date.getDay() y el template Liquid). */
const NOMBRES_DIA_CATALOGO = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
] as const;

const INDICE_POR_NOMBRE: Readonly<Record<string, number>> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
};

function indiceDesdeNombreDiaCatalogo(nombre: string): number {
  return INDICE_POR_NOMBRE[nombre.trim()] ?? -1;
}

function nombreDiaCatalogoDesdeFecha(fecha: Date): string {
  return NOMBRES_DIA_CATALOGO[fecha.getDay()] ?? 'Domingo';
}

/**
 * `dia` vacío o solo espacios → siempre visible.
 * Contiene `-` → rango (inclusive); si inicio > fin, el rango cruza fin de semana.
 * Sin `-` → solo visible si coincide con el nombre del día actual (catálogo Shopify).
 */
export function productoVisibleSegunCampoDia(
  cadenaDia: string | null | undefined,
  fechaReferencia: Date = new Date(),
): boolean {
  const raw =
    cadenaDia == null ? '' : String(cadenaDia).replace(/\s+/g, ' ').trim();
  if (raw === '') {
    return true;
  }

  const indiceActual = fechaReferencia.getDay();

  if (raw.includes('-')) {
    const partes = raw.split('-');
    if (partes.length < 2) {
      return false;
    }
    const diaInicio = partes[0].trim();
    const diaFin = partes.slice(1).join('-').trim();

    const indiceInicio = indiceDesdeNombreDiaCatalogo(diaInicio);
    const indiceFin = indiceDesdeNombreDiaCatalogo(diaFin);
    if (indiceInicio === -1 || indiceFin === -1) {
      return false;
    }

    if (indiceInicio <= indiceFin) {
      return indiceActual >= indiceInicio && indiceActual <= indiceFin;
    }
    return indiceActual >= indiceInicio || indiceActual <= indiceFin;
  }

  const diaActualNombre = nombreDiaCatalogoDesdeFecha(fechaReferencia);
  return raw === diaActualNombre;
}

/** Campo `dia` del resumen de catálogo (GET /tienda/informacion). */
export function cadenaDiaDesdeResumenProducto(
  p: ProductoResumenInformacionDto,
): string {
  const d = p.dia;
  return typeof d === 'string' ? d : '';
}

/** Prioriza `dia` raíz del DTO; si falta, usa `metafield.dia`. */
export function cadenaDiaDesdeProductoTienda(dto: ProductoTiendaDto): string {
  if (typeof dto.dia === 'string' && dto.dia.trim() !== '') {
    return dto.dia;
  }
  const meta = dto.metafield?.dia;
  return typeof meta === 'string' ? meta : '';
}
