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
  ProductoMenuEjemplo,
  TipoEntregaId,
} from '../../models/menu.models';
import type { InformacionTiendaDto } from '../../models/tienda-informacion.models';
import {
  calcularPrecioUnitarioConOpciones,
  firmaLineaCarrito,
  formatearPrecioBs,
} from '../../utils/menu-format.util';
import {
  mapearInformacionAColeccionesMenu,
  mapearProductoTiendaAUIMenu,
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

  /** Catálogo cargado desde GET /tienda/informacion. */
  colecciones = signal<ColeccionMenuEjemplo[]>([]);

  informacionTienda = signal<InformacionTiendaDto | null>(null);

  estadoCarga = signal<'cargando' | 'exito' | 'error'>('cargando');

  mensajeError = signal<string | null>(null);

  coleccionActivaId = signal('pizzas');
  modalCarritoAbierto = signal(false);
  modalProductoAbierto = signal(false);
  productoActivo = signal<ProductoMenuEjemplo | null>(null);
  /** Si se edita una línea existente, su `idLinea` hasta confirmar en el modal. */
  lineaEditandoId = signal<string | null>(null);
  idsOpcionesActivas = signal<string[]>([]);

  lineasCarrito = signal<LineaCarrito[]>([]);
  tipoEntrega = signal<TipoEntregaId>('domicilio');

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

  readonly nombreColeccionProductoModal = computed(() => {
    const p = this.productoActivo();
    if (!p) return '';
    const col = this.colecciones().find((c) =>
      c.productos.some((pr) => pr.id === p.id || pr.nombre === p.nombre),
    );
    return col?.nombre ?? '';
  });

  readonly precioModalProducto = computed(() => {
    const p = this.productoActivo();
    if (!p) return 'Bs. 0';
    return formatearPrecioBs(
      calcularPrecioUnitarioConOpciones(p, this.idsOpcionesActivas()),
    );
  });

  readonly precioComparacionModalProducto = computed((): string | null => {
    const p = this.productoActivo();
    if (p?.precioComparacionUnitario == null) return null;
    return formatearPrecioBs(p.precioComparacionUnitario);
  });

  readonly totalCarritoComparacionFormateado = computed((): string | null => {
    const suma = this.lineasCarrito().reduce((acc, l) => {
      if (l.precioComparacionUnitario == null) return acc;
      return acc + l.precioComparacionUnitario * l.cantidad;
    }, 0);
    return suma > 0 ? formatearPrecioBs(suma) : null;
  });

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
      this.colecciones.set(mapearInformacionAColeccionesMenu(info));
      const primera = this.colecciones()[0]?.id;
      if (primera) {
        this.coleccionActivaId.set(primera);
      }
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

  private etiquetasOpcionesDesdeProducto(
    producto: ProductoMenuEjemplo,
    idsOpciones: string[],
  ): string[] {
    return (producto.opciones ?? [])
      .filter((o) => idsOpciones.includes(o.id))
      .map((o) => o.etiqueta);
  }

  seleccionarColeccion(id: string): void {
    this.coleccionActivaId.set(id);
    queueMicrotask(() => {
      document.getElementById(`coleccion-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  abrirCarrito(): void {
    this.modalCarritoAbierto.set(true);
    this.fijarScrollDocumento(true);
  }

  cerrarCarrito(): void {
    this.modalCarritoAbierto.set(false);
    this.fijarScrollDocumento(this.modalProductoAbierto());
  }

  abrirModalProducto(producto: ProductoMenuEjemplo): void {
    void this.abrirModalProductoInterno(producto, null, []);
  }

  private async abrirModalProductoInterno(
    productoResumen: ProductoMenuEjemplo,
    idLineaEdicion: string | null,
    idsOpcionesIniciales: string[],
  ): Promise<void> {
    this.lineaEditandoId.set(idLineaEdicion);
    this.fijarScrollDocumento(true);
    try {
      const dto = await firstValueFrom(
        this.tiendaApi.obtenerProductoPorTitulo(productoResumen.nombre),
      );
      const mapeado = mapearProductoTiendaAUIMenu(dto);
      this.productoActivo.set(mapeado);
      const idsValidos = new Set((mapeado.opciones ?? []).map((o) => o.id));
      this.idsOpcionesActivas.set(
        idsOpcionesIniciales.filter((id) => idsValidos.has(id)),
      );
    } catch {
      this.productoActivo.set(productoResumen);
      this.idsOpcionesActivas.set([...idsOpcionesIniciales]);
    }
    this.modalProductoAbierto.set(true);
  }

  cerrarModalProducto(): void {
    this.modalProductoAbierto.set(false);
    this.productoActivo.set(null);
    this.idsOpcionesActivas.set([]);
    this.lineaEditandoId.set(null);
    this.fijarScrollDocumento(this.modalCarritoAbierto());
  }

  alternarOpcionProducto(idOpcion: string): void {
    this.idsOpcionesActivas.update((ids) => {
      const conjunto = new Set(ids);
      if (conjunto.has(idOpcion)) {
        conjunto.delete(idOpcion);
      } else {
        conjunto.add(idOpcion);
      }
      return [...conjunto];
    });
  }

  editarLineaCarrito(idLinea: string): void {
    const linea = this.lineasCarrito().find((l) => l.idLinea === idLinea);
    if (!linea) return;
    const producto = this.buscarProductoPorId(linea.idProducto);
    if (!producto) return;
    this.modalCarritoAbierto.set(false);
    void this.abrirModalProductoInterno(producto, idLinea, [
      ...linea.idsOpcionesSeleccionadas,
    ]);
  }

  agregarDesdeModalProducto(): void {
    const producto = this.productoActivo();
    if (!producto) return;
    const idsOp = [...this.idsOpcionesActivas()];
    const precioUnitario = calcularPrecioUnitarioConOpciones(producto, idsOp);
    const precioBaseUnitario = producto.precioUnitario;
    const etiquetasOpciones = this.etiquetasOpcionesDesdeProducto(producto, idsOp);
    const precioComparacionUnitario = producto.precioComparacionUnitario;

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
                idsOpcionesSeleccionadas: idsOp,
                etiquetasOpciones,
              }
            : l,
        ),
      );
      this.lineaEditandoId.set(null);
      this.cerrarModalProducto();
      return;
    }

    const firma = firmaLineaCarrito(producto.id, idsOp);
    this.lineasCarrito.update((lineas) => {
      const idx = lineas.findIndex(
        (l) =>
          firmaLineaCarrito(l.idProducto, l.idsOpcionesSeleccionadas) === firma,
      );
      if (idx === -1) {
        const nueva: LineaCarrito = {
          idLinea: crypto.randomUUID(),
          idProducto: producto.id,
          nombre: producto.nombre,
          precioUnitario,
          precioBaseUnitario,
          cantidad: 1,
          precioComparacionUnitario,
          idsOpcionesSeleccionadas: idsOp,
          etiquetasOpciones,
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
        idsOpcionesSeleccionadas: idsOp,
        etiquetasOpciones,
      };
      return copia;
    });
    this.cerrarModalProducto();
  }

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
