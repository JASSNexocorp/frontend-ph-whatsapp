// DTO de GET /tienda/producto (detalle para armar el modal y opciones).

export interface ProductoMetafieldSeccionDto {
  key: string;
  titulo: string;
  tipo: string;
  min: number;
  max: number;
  productos: ProductoOpcionMetafieldDto[];
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
  criterios_ver: unknown[];
}

export interface ProductoMetafieldDto {
  id: string;
  object_number: string;
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
  obj_num: string;
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
