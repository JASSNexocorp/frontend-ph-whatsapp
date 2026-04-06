// Cabecera oscura reutilizable de los modales del menú (volver, logo, título).

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-menu-modal-shell',
  standalone: true,
  templateUrl: './menu-modal-shell.component.html',
  styleUrl: './menu-modal-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuModalShellComponent {
  titulo = input.required<string>();
  idAriaTitulo = input.required<string>();
  rutaLogo = input.required<string>();
  rutaIconoVolver = input.required<string>();
  tituloCompacto = input(false);
  /** Si es false, solo se muestra el icono (p. ej. flecha arriba). */
  mostrarEtiquetaVolver = input(true);
  /** Oculta el logo junto al título (modal de producto: solo colección). */
  ocultarLogoHero = input(false);
  /** Texto accesible del botón atrás cuando no hay etiqueta visible. */
  etiquetaAccionVolver = input('Cerrar');

  volver = output<void>();
}
