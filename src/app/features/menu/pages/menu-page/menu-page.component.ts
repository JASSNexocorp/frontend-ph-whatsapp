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
import { formatearPrecioBs } from '../../utils/menu-format.util';

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
  cantidadEnModalProducto = signal(1);
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

  private fijarScrollDocumento(bloquear: boolean): void {
    document.body.style.overflow = bloquear ? 'hidden' : '';
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
    this.productoActivo.set(producto);
    this.idsOpcionesActivas.set([]);
    const existente = this.lineasCarrito().find(
      (l) => l.idProducto === producto.id,
    );
    this.cantidadEnModalProducto.set(existente?.cantidad ?? 1);
    this.modalProductoAbierto.set(true);
    this.fijarScrollDocumento(true);
  }

  cerrarModalProducto(): void {
    this.modalProductoAbierto.set(false);
    this.productoActivo.set(null);
    this.idsOpcionesActivas.set([]);
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

  ajustarCantidadModal(delta: number): void {
    this.cantidadEnModalProducto.update((n) => Math.max(1, n + delta));
  }

  agregarDesdeModalProducto(): void {
    const producto = this.productoActivo();
    if (!producto) return;
    const cantidad = this.cantidadEnModalProducto();
    this.lineasCarrito.update((lineas) => {
      const idx = lineas.findIndex((l) => l.idProducto === producto.id);
      if (idx === -1) {
        return [
          ...lineas,
          {
            idProducto: producto.id,
            nombre: producto.nombre,
            precioUnitario: producto.precioUnitario,
            cantidad,
          },
        ];
      }
      const copia = [...lineas];
      copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cantidad };
      return copia;
    });
    this.cerrarModalProducto();
  }

  incrementarLinea(idProducto: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas.map((l) =>
        l.idProducto === idProducto ? { ...l, cantidad: l.cantidad + 1 } : l,
      ),
    );
  }

  decrementarLinea(idProducto: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas
        .map((l) =>
          l.idProducto === idProducto
            ? { ...l, cantidad: l.cantidad - 1 }
            : l,
        )
        .filter((l) => l.cantidad > 0),
    );
  }

  eliminarLinea(idProducto: string): void {
    this.lineasCarrito.update((lineas) =>
      lineas.filter((l) => l.idProducto !== idProducto),
    );
  }

  seleccionarTipoEntrega(tipo: TipoEntregaId): void {
    this.tipoEntrega.set(tipo);
  }

  confirmarPedido(): void {
    this.cerrarCarrito();
  }
}
