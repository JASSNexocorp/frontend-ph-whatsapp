// DTO de GET /tienda/producto (detalle para armar el modal y opciones).

export interface ProductoMetafieldSeccionDto {
  key: string;
  titulo: string;
  tipo: string;
  min: number;
  max: number;
  productos: ProductoOpcionMetafieldDto[];
}

export interface CriterioVerDto {
  seccionKey: string;
  opcionId: string;
  precio: number;
  precio_comparacion: number;
  /** ID de ofisistema efectivo para esta combinación tamano+opcion. */
  id: string;
}

export interface ProductoOpcionMetafieldDto {
  id: string;
  titulo: string;
  precio: number;
  precio_comparacion: number;
  estado: boolean;
  sucursales: string[];
  urlImage: string;
  urlImage2: string;
  criterios_ver: CriterioVerDto[];
}

export interface ProductoMetafieldDto {
  id: string;
  /** A veces el API no lo envía; si viene, se usa en el carrito / notificar. */
  object_number?: string;
  dia: string;
  secciones: ProductoMetafieldSeccionDto[];
}

export interface ColeccionDetalleDto {
  titulo: string;
  handle: string;
}

export interface ProductoTiendaDto {
  id_shopify: string;
  id_ofisistema: string;
  /** A veces vacío o ausente; respaldo si `metafield.object_number` no viene. */
  obj_num?: string;
  handle: string;
  nombre: string;
  descripcion: string;
  tags: string[];
  colecciones: string[];
  estado: boolean;
  precio: number;
  precio_comparacion: number;
  imagen: string;
  stock_total: number;
  sucursales: { nombre: string; stock: number }[];
  metafield: ProductoMetafieldDto;
  tipo_producto: string;
  dia: string;
  url: string;
  colecciones_detalle: ColeccionDetalleDto[];
}
