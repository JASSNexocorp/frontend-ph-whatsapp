// Modal pantalla completa del carrito: entrega, líneas y confirmación.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MenuModalShellComponent } from '../menu-modal-shell/menu-modal-shell.component';
import { formatearPrecioBs } from '../../utils/menu-format.util';
import type { LineaCarrito, MenuRutasAssets, TipoEntregaId } from '../../models/menu.models';

@Component({
  selector: 'app-menu-cart-modal',
  standalone: true,
  imports: [MenuModalShellComponent],
  templateUrl: './menu-cart-modal.component.html',
  styleUrls: ['./menu-cart-modal.component.css', '../styles/menu-modals-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuCartModalComponent {
  readonly idAriaTitulo = 'titulo-modal-carrito';
  readonly textoTituloCarrito = 'Tu carrito';

  lineas = input.required<LineaCarrito[]>();
  tipoEntrega = input.required<TipoEntregaId>();
  totalFormateado = input.required<string>();
  /** Total de referencia tachado (suma de precios “antes” por línea), si aplica. */
  totalComparacionFormateado = input<string | null>(null);
  assets = input.required<MenuRutasAssets>();

  cerrar = output<void>();
  tipoEntregaCambio = output<TipoEntregaId>();
  incrementar = output<string>();
  decrementar = output<string>();
  eliminar = output<string>();
  editar = output<string>();
  confirmar = output<void>();

  subtotalLinea(linea: LineaCarrito): string {
    return formatearPrecioBs(linea.precioUnitario * linea.cantidad);
  }

  subtotalPrecioBaseLinea(linea: LineaCarrito): string {
    return formatearPrecioBs(linea.precioBaseUnitario * linea.cantidad);
  }

  subtotalComparacionLinea(linea: LineaCarrito): string | null {
    if (linea.precioComparacionUnitario == null) return null;
    return formatearPrecioBs(linea.precioComparacionUnitario * linea.cantidad);
  }

  /** Muestra bloque de base solo si difiere del precio con opciones. */
  mostrarPrecioBase(linea: LineaCarrito): boolean {
    return linea.precioBaseUnitario !== linea.precioUnitario;
  }
}
