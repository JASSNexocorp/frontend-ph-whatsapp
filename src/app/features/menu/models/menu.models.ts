// Modelos del dominio del menú móvil (productos, secciones, carrito, entrega).

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
  /** Si se puede agregar al carrito (estado + stock total + stock en sucursal del JWT). */
  disponible: boolean;
  /** Mensaje en catálogo cuando no se puede comprar. */
  mensajeNoDisponible?: string;
}

// ---------------------------------------------------------------------------
// Modelos para el modal de detalle con secciones
// ---------------------------------------------------------------------------

/** Un producto dentro de una sección, con estado resuelto para la UI. */
export interface ProductoSeccionUI {
  /** ID de ofisistema base del producto. */
  id: string;
  /** ID a enviar al carrito (puede venir de criterios_ver para pizzas). */
  idEfectivo: string;
  titulo: string;
  /** Precio efectivo según criterio activo del tamaño seleccionado. */
  precio: number;
  precioComparacion: number;
  imagenUrl: string | null;
  /**
   * true cuando: estado === false, no está en la sucursal del cliente,
   * o no tiene criterio para el tamaño seleccionado (solo pizzas).
   */
  bloqueado: boolean;
}

/** Sección de opciones del producto (masa, sabor, ingredientes extra, etc.). */
export interface SeccionProductoUI {
  key: string;
  titulo: string;
  /** Cantidad mínima de selecciones requeridas al agregar al carrito. */
  min: number;
  /** Cantidad máxima de selecciones permitidas. */
  max: number;
  /** Productos ordenados por precio asc (bloqueados se mantienen en posición). */
  productos: ProductoSeccionUI[];
}

/** Modelo completo del detalle de producto usado por el modal. */
export interface ProductoDetalleUI {
  id: string;
  nombre: string;
  precioBase: number;
  precioComparacionBase: number | null;
  imagenUrl: string | null;
  disponible: boolean;
  mensajeNoDisponible?: string;
  secciones: SeccionProductoUI[];
  /** true si el producto pertenece a la colección "Pizzas". */
  esPizza: boolean;
}

/** Selecciones activas por clave de sección: { tamano: ['110110103'], ... } */
export type SeleccionesPorSeccion = Record<string, string[]>;

export interface ColeccionMenuEjemplo {
  id: string;
  nombre: string;
  productos: ProductoMenuEjemplo[];
}

/** Una fila de opción en el carrito: sección y producto elegido por separado en la UI. */
export interface OpcionLineaCarrito {
  tituloSeccion: string;
  nombreOpcion: string;
}

export interface LineaCarrito {
  /** Identificador único de la fila (mismo producto puede repetirse con distintas opciones). */
  idLinea: string;
  idProducto: string;
  /** Variante / producto en Shopify (mismo origen que GET /tienda/producto). */
  idShopify: string;
  /**
   * Metafield / API `object_number` (a veces también en `obj_num`); va igual al POST notificar-carrito.
   */
  object_number?: string;
  nombre: string;
  /** Precio unitario con opciones / extras aplicados. */
  precioUnitario: number;
  /** Precio unitario del producto en catálogo sin extras (referencia “base”). */
  precioBaseUnitario: number;
  cantidad: number;
  /** Precio unitario de comparación (oferta tachada), si existe en catálogo. */
  precioComparacionUnitario?: number;
  /** Ids efectivos (ofisistema / criterio) al confirmar pedido. */
  idsOpcionesSeleccionadas: string[];
  /** Opciones elegidas: sección y nombre de producto por ítem. */
  opcionesCarrito: OpcionLineaCarrito[];
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
