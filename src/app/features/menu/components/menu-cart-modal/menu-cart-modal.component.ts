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
  assets = input.required<MenuRutasAssets>();

  cerrar = output<void>();
  tipoEntregaCambio = output<TipoEntregaId>();
  incrementar = output<string>();
  decrementar = output<string>();
  eliminar = output<string>();
  confirmar = output<void>();

  precioLinea(linea: LineaCarrito): string {
    return formatearPrecioBs(linea.precioUnitario * linea.cantidad);
  }
}
