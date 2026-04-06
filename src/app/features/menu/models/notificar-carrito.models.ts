// Contrato del body POST /tienda/notificar-carrito (alineado al DTO Nest).

export interface NotificarCarritoLineaOpcionDto {
  tituloSeccion: string;
  nombreOpcion: string;
  idOfisistema?: string;
}

export interface NotificarCarritoLineaDto {
  nombre: string;
  cantidad: number;
  idOfisistema?: string;
  idShopify?: string;
  opciones?: NotificarCarritoLineaOpcionDto[];
}

export interface NotificarCarritoRequestDto {
  token: string;
  subtotalProductos: number;
  costoEnvio: number;
  total: number;
  lineas: NotificarCarritoLineaDto[];
  subtotalComparacion?: number;
}

export interface NotificarCarritoOkDto {
  ok: true;
}
