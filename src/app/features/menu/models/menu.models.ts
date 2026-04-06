// Modelos del dominio del menú móvil (productos, carrito, entrega).

export interface OpcionConfigurableProducto {
  id: string;
  etiqueta: string;
}

export interface ProductoMenuEjemplo {
  id: string;
  nombre: string;
  precio: string;
  precioUnitario: number;
  opciones?: OpcionConfigurableProducto[];
}

export interface ColeccionMenuEjemplo {
  id: string;
  nombre: string;
  productos: ProductoMenuEjemplo[];
}

export interface LineaCarrito {
  idProducto: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

export type TipoEntregaId = 'domicilio' | 'retiro';

export interface MenuRutasAssets {
  logo: string;
  iconoCarrito: string;
  iconoDelivery: string;
  iconoLocal: string;
  iconoFlechaIzquierda: string;
  iconoBorrar: string;
  iconoOpcionOn: string;
  iconoOpcionOff: string;
}
