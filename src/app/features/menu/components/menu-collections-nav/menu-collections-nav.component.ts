// Bloque de título + grid 2 columnas para elegir colección del menú.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ColeccionMenuEjemplo } from '../../models/menu.models';

@Component({
  selector: 'app-menu-collections-nav',
  standalone: true,
  templateUrl: './menu-collections-nav.component.html',
  styleUrl: './menu-collections-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuCollectionsNavComponent {
  colecciones = input.required<ColeccionMenuEjemplo[]>();
  coleccionActivaId = input.required<string>();

  seleccionar = output<string>();
}
