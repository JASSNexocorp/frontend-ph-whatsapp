// DTO de GET /tienda/informacion (catálogo y sucursales).

export interface ColeccionInformacionDto {
  titulo: string;
  imagen: string;
  /** Productos listados en la colección (puede venir vacío). */
  productos: ProductoResumenInformacionDto[];
}

/** Resumen de producto dentro de una colección (si el backend lo envía). */
export interface ProductoResumenInformacionDto {
  nombre?: string;
  titulo?: string;
  precio?: number;
  imagen?: string;
  [key: string]: unknown;
}

export interface TurnoSucursalDto {
  dias: number[];
  horaInicial: string;
  horaFinal: string;
}

export interface SucursalInformacionDto {
  id_ofisistema: string;
  id_shopify: string;
  lat: number;
  lng: number;
  nombre: string;
  estado: boolean;
  servicios: string[];
  turnos: TurnoSucursalDto[];
  telefono: string;
  localizacion: string;
}

export interface ConfiguracionCarritoDto {
  cantidad_minima: number;
  costo_envio_domicilio: number;
}

export interface InformacionTiendaDto {
  colecciones: ColeccionInformacionDto[];
  sucursales: SucursalInformacionDto[];
  configuracion_carrito: ConfiguracionCarritoDto;
}
