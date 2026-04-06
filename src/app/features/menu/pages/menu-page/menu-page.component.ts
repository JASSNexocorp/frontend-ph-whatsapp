// Orquesta el menú móvil: catálogo, navegación por colección, carrito y modales hijos.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { MenuCartModalComponent } from '../../components/menu-cart-modal/menu-cart-modal.component';
import { MenuCollectionsNavComponent } from '../../components/menu-collections-nav/menu-collections-nav.component';
import { MenuProductModalComponent } from '../../components/menu-product-modal/menu-product-modal.component';
import { MENU_RUTAS_ASSETS } from '../../constants/menu-assets';
import { MENU_CATALOGO_COLECCIONES } from '../../data/menu-catalogo.data';
import type { LineaCarrito, ProductoMenuEjemplo, TipoEntregaId } from '../../models/menu.models';
import {
  calcularPrecioUnitarioConOpciones,
  firmaLineaCarrito,
  formatearPrecioBs,
} from '../../utils/menu-format.util';

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
export class MenuPageComponent {
  readonly assetsMenu = MENU_RUTAS_ASSETS;
  readonly colecciones = MENU_CATALOGO_COLECCIONES;

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
    const col = this.colecciones.find((c) =>
      c.productos.some((pr) => pr.id === p.id),
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

  private fijarScrollDocumento(bloquear: boolean): void {
    document.body.style.overflow = bloquear ? 'hidden' : '';
  }

  private buscarProductoPorId(idProducto: string): ProductoMenuEjemplo | null {
    for (const c of this.colecciones) {
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
    this.lineaEditandoId.set(null);
    this.productoActivo.set(producto);
    this.idsOpcionesActivas.set([]);
    this.modalProductoAbierto.set(true);
    this.fijarScrollDocumento(true);
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
    this.lineaEditandoId.set(idLinea);
    this.productoActivo.set(producto);
    this.idsOpcionesActivas.set([...linea.idsOpcionesSeleccionadas]);
    this.modalCarritoAbierto.set(false);
    this.modalProductoAbierto.set(true);
    this.fijarScrollDocumento(true);
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
