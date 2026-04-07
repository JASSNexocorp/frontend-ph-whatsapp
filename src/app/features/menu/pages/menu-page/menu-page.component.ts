// Orquesta el menú móvil: catálogo, navegación por colección, carrito y modales hijos.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MenuClienteStore } from '../../aplicacion/menu-cliente.store';
import { MenuCartModalComponent } from '../../components/menu-cart-modal/menu-cart-modal.component';
import { MenuCollectionsNavComponent } from '../../components/menu-collections-nav/menu-collections-nav.component';
import { MenuProductModalComponent } from '../../components/menu-product-modal/menu-product-modal.component';
import { MENU_RUTAS_ASSETS } from '../../constants/menu-assets';
import { TiendaApiService } from '../../data/tienda-api.service';
import type {
  ColeccionMenuEjemplo,
  LineaCarrito,
  OpcionLineaCarrito,
  ProductoDetalleUI,
  ProductoMenuEjemplo,
  SeleccionesPorSeccion,
  TipoEntregaId,
} from '../../models/menu.models';
import type { InformacionTiendaDto } from '../../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../../models/tienda-producto.models';
import { normalizarTipoEntregaJwt } from '../../utils/menu-entrega.util';
import {
  calcularPrecioComparacionTotalDetalle,
  calcularPrecioTotalDetalle,
  firmaLineaCarrito,
  formatearPrecioBs,
} from '../../utils/menu-format.util';
import { construirPayloadPedidoDesdeCarrito } from '../../utils/menu-pedido-payload.util';
import {
  aCuerpoNotificarCarritoApi,
  mensajeUsuarioNotificarCarrito,
} from '../../utils/notificar-carrito.util';
import {
  mapearInformacionAColeccionesMenu,
  reconstruirSeleccionesDesdeIdsCarrito,
  resolverProductoDetalle,
} from '../../utils/tienda-mappers.util';
import { urlWaMeSucursalCliente } from '../../utils/wa-me-url.util';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    MenuCollectionsNavComponent,
    MenuCartModalComponent,
    MenuProductModalComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent implements OnInit, OnDestroy {
  private readonly tiendaApi = inject(TiendaApiService);
  private readonly menuCliente = inject(MenuClienteStore);
  private idTimerAvisoPedido: ReturnType<typeof setTimeout> | null = null;

  readonly assetsMenu = MENU_RUTAS_ASSETS;
  readonly formatearPrecioBs = formatearPrecioBs;

  // ---------------------------------------------------------------------------
  // Estado del catálogo
  // ---------------------------------------------------------------------------

  colecciones = signal<ColeccionMenuEjemplo[]>([]);
  informacionTienda = signal<InformacionTiendaDto | null>(null);
  estadoCarga = signal<'cargando' | 'exito' | 'error'>('cargando');
  mensajeError = signal<string | null>(null);
  coleccionActivaId = signal('pizzas');

  // ---------------------------------------------------------------------------
  // Estado del modal de producto
  // ---------------------------------------------------------------------------

  modalProductoAbierto = signal(false);
  /** DTO crudo del producto abierto en el modal. */
  dtoProdutoActivo = signal<ProductoTiendaDto | null>(null);
  /** Selecciones activas por clave de sección. */
  seleccionesPorSeccion = signal<SeleccionesPorSeccion>({});
  /** Si se edita una línea existente del carrito, su idLinea hasta confirmar. */
  lineaEditandoId = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // Estado del carrito
  // ---------------------------------------------------------------------------

  modalCarritoAbierto = signal(false);
  lineasCarrito = signal<LineaCarrito[]>([]);
  tipoEntrega = signal<TipoEntregaId>('domicilio');
  /** POST /tienda/notificar-carrito en curso. */
  enviandoPedido = signal(false);
  /** Aviso tras confirmar o error (se oculta solo a los pocos segundos). */
  avisoPedido = signal<{ mensaje: string; esError: boolean } | null>(null);

  // ---------------------------------------------------------------------------
  // Código de sucursal del cliente (PH01, PH02…)
  // ---------------------------------------------------------------------------

  readonly codigoSucursalCliente = computed((): string | null => {
    const nombre = this.menuCliente.nombreSucursal();
    const info = this.informacionTienda();
    if (!nombre || !info) return null;
    const nombreNorm = nombre.trim().toUpperCase();
    return (
      info.sucursales.find((s) => s.nombre.trim().toUpperCase() === nombreNorm)
        ?.id_ofisistema ?? null
    );
  });

  // ---------------------------------------------------------------------------
  // Detalle de producto resuelto reactivamente
  // ---------------------------------------------------------------------------

  /** Re-evalúa cada vez que cambian el DTO, las selecciones o la sucursal. */
  readonly productoDetalleActivo = computed((): ProductoDetalleUI | null => {
    const dto = this.dtoProdutoActivo();
    if (!dto) return null;
    return resolverProductoDetalle(
      dto,
      this.seleccionesPorSeccion(),
      this.codigoSucursalCliente(),
    );
  });

  // ---------------------------------------------------------------------------
  // Computed para el pie del modal
  // ---------------------------------------------------------------------------

  readonly precioModalProducto = computed((): string => {
    const detalle = this.productoDetalleActivo();
    if (!detalle) return 'Bs. 0';
    return formatearPrecioBs(
      calcularPrecioTotalDetalle(detalle, this.seleccionesPorSeccion()),
    );
  });

  /** Total tachado: comparación del producto (si aplica) + opciones; pizzas solo secciones. */
  readonly precioComparacionModalProducto = computed((): string | null => {
    const detalle = this.productoDetalleActivo();
    if (!detalle) return null;
    const total = calcularPrecioComparacionTotalDetalle(
      detalle,
      this.seleccionesPorSeccion(),
    );
    return total != null ? formatearPrecioBs(total) : null;
  });

  // ---------------------------------------------------------------------------
  // Computed del carrito
  // ---------------------------------------------------------------------------

  readonly cantidadItemsCarrito = computed(() =>
    this.lineasCarrito().reduce((acc, l) => acc + l.cantidad, 0),
  );

  readonly totalCarrito = computed(() =>
    this.lineasCarrito().reduce(
      (acc, l) => acc + l.precioUnitario * l.cantidad,
      0,
    ),
  );

  readonly totalCarritoFormateado = computed(() =>
    formatearPrecioBs(this.totalCarrito()),
  );

  /** El JWT fija domicilio/retiro: no se puede cambiar desde el carrito. */
  readonly tipoEntregaFijadoPorToken = computed(
    () => normalizarTipoEntregaJwt(this.menuCliente.tipoEntrega()) !== null,
  );

  readonly costoEnvioDomicilio = computed(() => {
    const cfg = this.informacionTienda()?.configuracion_carrito;
    return cfg?.costo_envio_domicilio ?? 0;
  });

  readonly pedidoMinimoMonto = computed(
    () => this.informacionTienda()?.configuracion_carrito?.cantidad_minima ?? 0,
  );

  readonly totalAPagarCarrito = computed(() => {
    const sub = this.totalCarrito();
    const envio =
      this.tipoEntrega() === 'domicilio' ? this.costoEnvioDomicilio() : 0;
    return sub + envio;
  });

  readonly totalAPagarCarritoFormateado = computed(() =>
    formatearPrecioBs(this.totalAPagarCarrito()),
  );

  readonly costoEnvioFormateadoParaCarrito = computed((): string | null => {
    if (this.tipoEntrega() !== 'domicilio') return null;
    return formatearPrecioBs(this.costoEnvioDomicilio());
  });

  readonly cumplePedidoMinimo = computed(
    () => this.totalCarrito() >= this.pedidoMinimoMonto(),
  );

  readonly faltaParaPedidoMinimoFormateado = computed((): string | null => {
    const min = this.pedidoMinimoMonto();
    if (min <= 0) return null;
    const sub = this.totalCarrito();
    if (sub >= min) return null;
    return formatearPrecioBs(min - sub);
  });

  readonly pedidoMinimoFormateado = computed((): string | null => {
    const min = this.pedidoMinimoMonto();
    if (min <= 0) return null;
    return formatearPrecioBs(min);
  });

  readonly totalCarritoComparacionFormateado = computed((): string | null => {
    const suma = this.lineasCarrito().reduce((acc, l) => {
      if (l.precioComparacionUnitario == null) return acc;
      return acc + l.precioComparacionUnitario * l.cantidad;
    }, 0);
    return suma > 0 ? formatearPrecioBs(suma) : null;
  });

  readonly nombreColeccionProductoModal = computed(() => {
    const dto = this.dtoProdutoActivo();
    if (!dto) return '';
    return dto.colecciones?.[0] ?? '';
  });

  // ---------------------------------------------------------------------------
  // Ciclo de vida
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    const teJwt = normalizarTipoEntregaJwt(this.menuCliente.tipoEntrega());
    if (teJwt) {
      this.tipoEntrega.set(teJwt);
    }
    void this.cargarInformacion();
  }

  ngOnDestroy(): void {
    this.limpiarTimerAvisoPedido();
  }

  private async cargarInformacion(): Promise<void> {
    this.estadoCarga.set('cargando');
    this.mensajeError.set(null);
    try {
      const info = await firstValueFrom(this.tiendaApi.obtenerInformacion());
      this.informacionTienda.set(info);
      this.colecciones.set(
        mapearInformacionAColeccionesMenu(info, this.menuCliente.nombreSucursal()),
      );
      const primera = this.colecciones()[0]?.id;
      if (primera) this.coleccionActivaId.set(primera);
      this.estadoCarga.set('exito');
    } catch {
      this.estadoCarga.set('error');
      this.mensajeError.set(
        'No se pudo cargar el menú. Verificá tu conexión e intentá de nuevo.',
      );
    }
  }

  reintentarCarga(): void {
    void this.cargarInformacion();
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private fijarScrollDocumento(bloquear: boolean): void {
    document.body.style.overflow = bloquear ? 'hidden' : '';
  }

  private buscarProductoPorId(idProducto: string): ProductoMenuEjemplo | null {
    for (const c of this.colecciones()) {
      const p = c.productos.find((pr) => pr.id === idProducto);
      if (p) return p;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Navegación de colecciones
  // ---------------------------------------------------------------------------

  seleccionarColeccion(id: string): void {
    this.coleccionActivaId.set(id);
    queueMicrotask(() => {
      document.getElementById(`coleccion-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Modal de carrito
  // ---------------------------------------------------------------------------

  abrirCarrito(): void {
    this.modalCarritoAbierto.set(true);
    this.fijarScrollDocumento(true);
  }

  cerrarCarrito(): void {
    this.modalCarritoAbierto.set(false);
    this.fijarScrollDocumento(this.modalProductoAbierto());
  }

  // ---------------------------------------------------------------------------
  // Modal de producto
  // ---------------------------------------------------------------------------

  abrirModalProducto(producto: ProductoMenuEjemplo): void {
    if (!producto.disponible) return;
    void this.abrirModalProductoInterno(producto.nombre, null);
  }

  private async abrirModalProductoInterno(
    nombreProducto: string,
    idLineaEdicion: string | null,
  ): Promise<void> {
    this.lineaEditandoId.set(idLineaEdicion);
    this.fijarScrollDocumento(true);
    try {
      const dto = await firstValueFrom(
        this.tiendaApi.obtenerProductoPorTitulo(nombreProducto.trim()),
      );
      this.dtoProdutoActivo.set(dto);

      let selecciones: SeleccionesPorSeccion = {};
      if (idLineaEdicion) {
        const linea = this.lineasCarrito().find((l) => l.idLinea === idLineaEdicion);
        if (linea) {
          selecciones = reconstruirSeleccionesDesdeIdsCarrito(
            dto,
            linea.idsOpcionesSeleccionadas,
            this.codigoSucursalCliente(),
          );
        }
      }

      if (dto.colecciones?.includes('Pizzas')) {
        const secTamano = dto.metafield?.secciones?.find((s) => s.key === 'tamano');
        if (secTamano && !selecciones['tamano']?.length) {
          const primeroDesbloqueado = secTamano.productos.find((p) => p.estado);
          if (primeroDesbloqueado) {
            selecciones = {
              ...selecciones,
              tamano: [primeroDesbloqueado.id],
            };
          }
        }
      }
      this.seleccionesPorSeccion.set(selecciones);
    } catch {
      this.dtoProdutoActivo.set(null);
      this.seleccionesPorSeccion.set({});
    }
    this.modalProductoAbierto.set(true);
  }

  cerrarModalProducto(): void {
    this.modalProductoAbierto.set(false);
    this.dtoProdutoActivo.set(null);
    this.seleccionesPorSeccion.set({});
    this.lineaEditandoId.set(null);
    this.fijarScrollDocumento(this.modalCarritoAbierto());
  }

  /**
   * Alterna la selección de un producto dentro de una sección.
   * Si la sección tiene min ≥ 1, no se puede deseleccionar por debajo de ese mínimo.
   */
  seleccionarOpcionSeccion(seccionKey: string, idProducto: string): void {
    const detalle = this.productoDetalleActivo();
    if (!detalle) return;

    const seccion = detalle.secciones.find((s) => s.key === seccionKey);
    if (!seccion) return;

    const productoEnSeccion = seccion.productos.find((p) => p.id === idProducto);
    if (!productoEnSeccion || productoEnSeccion.bloqueado) return;

    this.seleccionesPorSeccion.update((sel) => {
      const actuales = sel[seccionKey] ?? [];
      const yaSeleccionado = actuales.includes(idProducto);

      if (yaSeleccionado) {
        const despuesDeQuitar = actuales.filter((id) => id !== idProducto);
        if (despuesDeQuitar.length < seccion.min) {
          return sel;
        }
        return { ...sel, [seccionKey]: despuesDeQuitar };
      }

      if (actuales.length >= seccion.max) {
        if (seccion.max === 1) {
          return { ...sel, [seccionKey]: [idProducto] };
        }
        return sel;
      }

      return { ...sel, [seccionKey]: [...actuales, idProducto] };
    });
  }

  // ---------------------------------------------------------------------------
  // Agregar al carrito
  // ---------------------------------------------------------------------------

  agregarDesdeModalProducto(): void {
    const dto = this.dtoProdutoActivo();
    const detalle = this.productoDetalleActivo();
    if (!dto || !detalle || !detalle.disponible) return;

    const selecciones = this.seleccionesPorSeccion();
    const precioUnitario = calcularPrecioTotalDetalle(detalle, selecciones);
    const precioBaseUnitario = detalle.esPizza
      ? precioUnitario
      : detalle.precioBase;
    const precioComparacionUnitario = calcularPrecioComparacionTotalDetalle(
      detalle,
      selecciones,
    );

    const idsEfectivos: string[] = [];
    const opcionesCarrito: OpcionLineaCarrito[] = [];

    for (const seccion of detalle.secciones) {
      const idsSeleccionados = selecciones[seccion.key] ?? [];
      for (const idSel of idsSeleccionados) {
        const prod = seccion.productos.find((p) => p.id === idSel);
        if (!prod || prod.bloqueado) continue;
        idsEfectivos.push(prod.idEfectivo);
        opcionesCarrito.push({
          tituloSeccion: seccion.titulo,
          nombreOpcion: prod.titulo,
        });
      }
    }

    const idEdicion = this.lineaEditandoId();
    if (idEdicion) {
      this.lineasCarrito.update((lineas) =>
        lineas.map((l) =>
          l.idLinea === idEdicion
            ? {
                ...l,
                idShopify: dto.id_shopify,
                precioUnitario,
                precioBaseUnitario,
                precioComparacionUnitario,
                idsOpcionesSeleccionadas: idsEfectivos,
                opcionesCarrito,
              }
            : l,
        ),
      );
      this.lineaEditandoId.set(null);
      this.cerrarModalProducto();
      return;
    }

    const firma = firmaLineaCarrito(detalle.id, idsEfectivos);
    this.lineasCarrito.update((lineas) => {
      const idx = lineas.findIndex(
        (l) =>
          firmaLineaCarrito(l.idProducto, l.idsOpcionesSeleccionadas) === firma,
      );
      if (idx === -1) {
        const nueva: LineaCarrito = {
          idLinea: crypto.randomUUID(),
          idProducto: detalle.id,
          idShopify: dto.id_shopify,
          nombre: detalle.nombre,
          precioUnitario,
          precioBaseUnitario,
          cantidad: 1,
          precioComparacionUnitario,
          idsOpcionesSeleccionadas: idsEfectivos,
          opcionesCarrito,
        };
        return [...lineas, nueva];
      }
      const copia = [...lineas];
      copia[idx] = {
        ...copia[idx],
        idShopify: dto.id_shopify,
        cantidad: copia[idx].cantidad + 1,
        precioUnitario,
        precioBaseUnitario,
        precioComparacionUnitario,
        idsOpcionesSeleccionadas: idsEfectivos,
        opcionesCarrito,
      };
      return copia;
    });
    this.cerrarModalProducto();
  }

  // ---------------------------------------------------------------------------
  // Editar línea del carrito
  // ---------------------------------------------------------------------------

  editarLineaCarrito(idLinea: string): void {
    const linea = this.lineasCarrito().find((l) => l.idLinea === idLinea);
    if (!linea) return;
    const producto = this.buscarProductoPorId(linea.idProducto);
    if (!producto) return;
    this.modalCarritoAbierto.set(false);
    void this.abrirModalProductoInterno(producto.nombre, idLinea);
  }

  // ---------------------------------------------------------------------------
  // Operaciones del carrito
  // ---------------------------------------------------------------------------

  incrementarLinea(idLinea: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas.map((l) =>
        l.idLinea === idLinea ? { ...l, cantidad: l.cantidad + 1 } : l,
      ),
    );
  }

  decrementarLinea(idLinea: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas
        .map((l) =>
          l.idLinea === idLinea ? { ...l, cantidad: l.cantidad - 1 } : l,
        )
        .filter((l) => l.cantidad > 0),
    );
  }

  eliminarLinea(idLinea: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas.filter((l) => l.idLinea !== idLinea),
    );
  }

  seleccionarTipoEntrega(tipo: TipoEntregaId): void {
    if (this.tipoEntregaFijadoPorToken()) return;
    this.tipoEntrega.set(tipo);
  }

  async confirmarPedido(): Promise<void> {
    if (this.enviandoPedido()) return;

    const token = (this.menuCliente.tokenMenu() ?? '').trim();
    if (token === '') {
      this.mostrarAvisoPedido(
        'No hay sesión válida. Abrí el menú desde el enlace de WhatsApp.',
        true,
      );
      return;
    }

    const lineas = this.lineasCarrito();
    if (lineas.length === 0) return;

    const payloadPedido = construirPayloadPedidoDesdeCarrito(
      lineas,
      this.tipoEntrega(),
      this.costoEnvioDomicilio(),
      token,
    );
    const cuerpo = aCuerpoNotificarCarritoApi(payloadPedido);

    this.enviandoPedido.set(true);
    try {
      await firstValueFrom(this.tiendaApi.notificarCarrito(cuerpo));
      this.lineasCarrito.set([]);
      this.cerrarCarrito();
      this.salirHaciaWhatsAppTrasPedidoOk();
    } catch (err: unknown) {
      this.mostrarAvisoPedido(mensajeUsuarioNotificarCarrito(err), true);
    } finally {
      this.enviandoPedido.set(false);
    }
  }

  private mostrarAvisoPedido(mensaje: string, esError: boolean): void {
    this.limpiarTimerAvisoPedido();
    this.avisoPedido.set({ mensaje, esError });
    this.idTimerAvisoPedido = window.setTimeout(() => {
      this.avisoPedido.set(null);
      this.idTimerAvisoPedido = null;
    }, 8000);
  }

  private limpiarTimerAvisoPedido(): void {
    if (this.idTimerAvisoPedido != null) {
      clearTimeout(this.idTimerAvisoPedido);
      this.idTimerAvisoPedido = null;
    }
  }

  /**
   * history.back() suele no hacer nada en el WebView de WhatsApp (historial de una sola página).
   * No se puede cerrar el visor con JS. Abrir wa.me con el teléfono de la sucursal del menú
   * suele llevar de vuelta a la app de WhatsApp; si falta dato, intentamos atrás igual.
   */
  private salirHaciaWhatsAppTrasPedidoOk(): void {
    const urlWa = urlWaMeSucursalCliente(
      this.informacionTienda(),
      this.menuCliente.nombreSucursal(),
    );
    if (urlWa) {
      globalThis.location.replace(urlWa);
      return;
    }
    globalThis.history.back();
  }
}
