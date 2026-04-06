// Orquesta el menú móvil: catálogo, navegación por colección, carrito y modales hijos.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
  ProductoDetalleUI,
  ProductoMenuEjemplo,
  SeleccionesPorSeccion,
  TipoEntregaId,
} from '../../models/menu.models';
import type { InformacionTiendaDto } from '../../models/tienda-informacion.models';
import type { ProductoTiendaDto } from '../../models/tienda-producto.models';
import {
  calcularPrecioTotalDetalle,
  firmaLineaCarrito,
  formatearPrecioBs,
} from '../../utils/menu-format.util';
import {
  mapearInformacionAColeccionesMenu,
  resolverProductoDetalle,
} from '../../utils/tienda-mappers.util';

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
export class MenuPageComponent implements OnInit {
  private readonly tiendaApi = inject(TiendaApiService);
  private readonly menuCliente = inject(MenuClienteStore);

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

  readonly precioComparacionModalProducto = computed((): string | null => {
    const detalle = this.productoDetalleActivo();
    if (detalle?.precioComparacionBase == null) return null;
    return formatearPrecioBs(detalle.precioComparacionBase);
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
    const te = this.menuCliente.tipoEntrega();
    if (te === 'domicilio' || te === 'retiro') {
      this.tipoEntrega.set(te);
    }
    void this.cargarInformacion();
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
    void this.abrirModalProductoInterno(producto.nombre, null, {});
  }

  private async abrirModalProductoInterno(
    nombreProducto: string,
    idLineaEdicion: string | null,
    seleccionesIniciales: SeleccionesPorSeccion,
  ): Promise<void> {
    this.lineaEditandoId.set(idLineaEdicion);
    this.fijarScrollDocumento(true);
    try {
      const dto = await firstValueFrom(
        this.tiendaApi.obtenerProductoPorTitulo(nombreProducto.trim()),
      );
      this.dtoProdutoActivo.set(dto);

      // Pre-selección automática del primer tamaño para productos de la colección Pizzas
      const selecciones = { ...seleccionesIniciales };
      if (dto.colecciones?.includes('Pizzas')) {
        const secTamano = dto.metafield?.secciones?.find((s) => s.key === 'tamano');
        if (secTamano && !selecciones['tamano']?.length) {
          const primeroDesbloqueado = secTamano.productos.find((p) => p.estado);
          if (primeroDesbloqueado) {
            selecciones['tamano'] = [primeroDesbloqueado.id];
          }
        }
      }
      this.seleccionesPorSeccion.set(selecciones);
    } catch {
      // Si falla la carga del detalle, igual abrimos el modal sin secciones
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
   * Alterna la selección de un producto dentro de una sección,
   * respetando el máximo permitido (no valida mínimo aquí).
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
        // Deseleccionar siempre es posible (el mínimo solo se valida al agregar)
        return { ...sel, [seccionKey]: actuales.filter((id) => id !== idProducto) };
      }

      if (actuales.length >= seccion.max) {
        if (seccion.max === 1) {
          // Sección de selección única: reemplazar
          return { ...sel, [seccionKey]: [idProducto] };
        }
        // Máximo alcanzado, no agregar
        return sel;
      }

      return { ...sel, [seccionKey]: [...actuales, idProducto] };
    });
  }

  // ---------------------------------------------------------------------------
  // Agregar al carrito
  // ---------------------------------------------------------------------------

  agregarDesdeModalProducto(): void {
    const detalle = this.productoDetalleActivo();
    if (!detalle || !detalle.disponible) return;

    const selecciones = this.seleccionesPorSeccion();
    const precioUnitario = calcularPrecioTotalDetalle(detalle, selecciones);
    const precioBaseUnitario = detalle.precioBase;
    const precioComparacionUnitario = detalle.precioComparacionBase ?? undefined;

    // Recopilar IDs efectivos y etiquetas de cada selección
    const idsEfectivos: string[] = [];
    const etiquetas: string[] = [];

    for (const seccion of detalle.secciones) {
      const idsSeleccionados = selecciones[seccion.key] ?? [];
      for (const idSel of idsSeleccionados) {
        const prod = seccion.productos.find((p) => p.id === idSel);
        if (!prod || prod.bloqueado) continue;
        idsEfectivos.push(prod.idEfectivo);
        etiquetas.push(`${seccion.titulo}: ${prod.titulo}`);
      }
    }

    const idEdicion = this.lineaEditandoId();
    if (idEdicion) {
      this.lineasCarrito.update((lineas) =>
        lineas.map((l) =>
          l.idLinea === idEdicion
            ? {
                ...l,
                precioUnitario,
                precioBaseUnitario,
                precioComparacionUnitario,
                idsOpcionesSeleccionadas: idsEfectivos,
                etiquetasOpciones: etiquetas,
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
          nombre: detalle.nombre,
          precioUnitario,
          precioBaseUnitario,
          cantidad: 1,
          precioComparacionUnitario,
          idsOpcionesSeleccionadas: idsEfectivos,
          etiquetasOpciones: etiquetas,
        };
        return [...lineas, nueva];
      }
      const copia = [...lineas];
      copia[idx] = {
        ...copia[idx],
        cantidad: copia[idx].cantidad + 1,
        precioUnitario,
        precioBaseUnitario,
        precioComparacionUnitario,
        idsOpcionesSeleccionadas: idsEfectivos,
        etiquetasOpciones: etiquetas,
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
    // Reconstruimos selecciones básicas desde las etiquetas guardadas
    void this.abrirModalProductoInterno(producto.nombre, idLinea, {});
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
    this.tipoEntrega.set(tipo);
  }

  confirmarPedido(): void {
    this.cerrarCarrito();
  }
}
