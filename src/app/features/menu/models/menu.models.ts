// Modelos del dominio del menú móvil (productos, carrito, entrega).

export interface OpcionConfigurableProducto {
  id: string;
  etiqueta: string;
  /** Suma al precio base cuando la opción está activa (condimentos / extras). */
  extraPrecio?: number;
}

export interface ProductoMenuEjemplo {
  id: string;
  nombre: string;
  precio: string;
  precioUnitario: number;
  /** Precio de referencia (tachado) frente al actual, p. ej. oferta. */
  precioComparacionUnitario?: number;
  /** Texto comercial bajo el nombre (visible en el modal). */
  descripcion?: string;
  /** Imagen del producto; si falta se muestra un marcador neutro. */
  imagenUrl?: string;
  opciones?: OpcionConfigurableProducto[];
}

export interface ColeccionMenuEjemplo {
  id: string;
  nombre: string;
  productos: ProductoMenuEjemplo[];
}

export interface LineaCarrito {
  /** Identificador único de la fila (mismo producto puede repetirse con distintas opciones). */
  idLinea: string;
  idProducto: string;
  nombre: string;
  /** Precio unitario con opciones / extras aplicados. */
  precioUnitario: number;
  /** Precio unitario del producto en catálogo sin extras (referencia “base”). */
  precioBaseUnitario: number;
  cantidad: number;
  /** Precio unitario de comparación (oferta tachada), si existe en catálogo. */
  precioComparacionUnitario?: number;
  /** Ids de opciones activas al agregar o editar. */
  idsOpcionesSeleccionadas: string[];
  /** Etiquetas para mostrar en el carrito. */
  etiquetasOpciones: string[];
}

export type TipoEntregaId = 'domicilio' | 'retiro';

export interface MenuRutasAssets {
  logo: string;
  iconoCarrito: string;
  iconoDelivery: string;
  iconoLocal: string;
  iconoFlechaIzquierda: string;
  iconoFlechaArriba: string;
  iconoBorrar: string;
  iconoEditar: string;
  iconoOpcionOn: string;
  iconoOpcionOff: string;
}
