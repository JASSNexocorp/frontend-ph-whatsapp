// Modal pantalla completa de detalle de producto: opciones on/off y agregar al carrito.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MenuModalShellComponent } from '../menu-modal-shell/menu-modal-shell.component';
import type { MenuRutasAssets, ProductoMenuEjemplo } from '../../models/menu.models';

@Component({
  selector: 'app-menu-product-modal',
  standalone: true,
  imports: [MenuModalShellComponent],
  templateUrl: './menu-product-modal.component.html',
  styleUrls: ['./menu-product-modal.component.css', '../styles/menu-modals-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuProductModalComponent {
  readonly idAriaTitulo = 'titulo-modal-producto';

  producto = input.required<ProductoMenuEjemplo>();
  /** Nombre de la colección a la que pertenece (cabecera del modal). */
  nombreColeccion = input.required<string>();
  /** Precio actual con extras de opciones marcadas. */
  precioFormateado = input.required<string>();
  /** Precio de comparación tachado (oferta); si no hay, no se muestra. */
  precioComparacionFormateado = input<string | null>(null);
  idsOpcionesActivas = input.required<string[]>();
  assets = input.required<MenuRutasAssets>();

  volver = output<void>();
  alternarOpcion = output<string>();
  agregar = output<void>();

  opcionActiva(id: string): boolean {
    return this.idsOpcionesActivas().includes(id);
  }

  iconoOpcion(id: string): string {
    return this.opcionActiva(id)
      ? this.assets().iconoOpcionOn
      : this.assets().iconoOpcionOff;
  }

  textoDescripcionProducto(): string {
    const texto = this.producto().descripcion?.trim();
    return texto && texto.length > 0
      ? texto
      : 'Elegí las opciones que quieras; el precio se actualiza abajo.';
  }
}
