// Modal pantalla completa de detalle de producto: opciones on/off y cantidad.

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
  cantidad = input.required<number>();
  idsOpcionesActivas = input.required<string[]>();
  assets = input.required<MenuRutasAssets>();

  volver = output<void>();
  alternarOpcion = output<string>();
  cantidadDelta = output<number>();
  agregar = output<void>();

  opcionActiva(id: string): boolean {
    return this.idsOpcionesActivas().includes(id);
  }

  iconoOpcion(id: string): string {
    return this.opcionActiva(id)
      ? this.assets().iconoOpcionOn
      : this.assets().iconoOpcionOff;
  }
}
