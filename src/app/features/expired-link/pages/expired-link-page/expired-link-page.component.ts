// Pantalla informativa cuando el enlace del menú por WhatsApp ya no es válido.

import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-expired-link-page',
  standalone: true,
  templateUrl: './expired-link-page.component.html',
  styleUrl: './expired-link-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpiredLinkPageComponent {
  private readonly ubicacion = inject(Location);

  /** Texto extra del backend o del guard (si viene por `navigate` con `state`). */
  readonly detalle = signal<string | null>(null);

  constructor() {
    const estado = this.ubicacion.getState() as {
      motivo?: string;
      detalle?: string;
    } | null;
    const texto = estado?.detalle?.trim();
    this.detalle.set(texto && texto.length > 0 ? texto : null);
  }
}
