// Modal pantalla completa de detalle de producto: secciones con min/max, criterios y carrito.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { MenuModalShellComponent } from '../menu-modal-shell/menu-modal-shell.component';
import type {
  MenuRutasAssets,
  ProductoDetalleUI,
  ProductoSeccionUI,
  SeccionProductoUI,
  SeleccionesPorSeccion,
} from '../../models/menu.models';

@Component({
  selector: 'app-menu-product-modal',
  standalone: true,
  imports: [MenuModalShellComponent],
  templateUrl: './menu-product-modal.component.html',
  styleUrls: ['./menu-product-modal.component.css', '../styles/menu-modals-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuProductModalComponent implements OnDestroy {
  readonly idAriaTitulo = 'titulo-modal-producto';

  detalle = input.required<ProductoDetalleUI>();
  selecciones = input.required<SeleccionesPorSeccion>();
  nombreColeccion = input.required<string>();
  precioFormateado = input.required<string>();
  /** Total de comparación (tachado); `null` si no aplica. Siempre enlazado desde la página. */
  precioComparacionFormateado = input.required<string | null>();
  assets = input.required<MenuRutasAssets>();

  volver = output<void>();
  seleccionarOpcion = output<{ seccionKey: string; idProducto: string }>();
  agregar = output<void>();

  /** Mensaje de validación temporal (min no cumplido). Vacío = no se muestra. */
  mensajeValidacion = signal('');
  private _timerValidacion: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this._timerValidacion) clearTimeout(this._timerValidacion);
  }

  // ---------------------------------------------------------------------------
  // Computed helpers para el template
  // ---------------------------------------------------------------------------

  /** Texto descriptivo del producto. */
  textoDescripcion = computed(() => {
    return 'Elegí las opciones; el precio se actualiza abajo.';
  });

  // ---------------------------------------------------------------------------
  // Métodos de presentación por sección
  // ---------------------------------------------------------------------------

  estaSeleccionado(seccionKey: string, idProducto: string): boolean {
    return (this.selecciones()[seccionKey] ?? []).includes(idProducto);
  }

  textoRequisito(seccion: SeccionProductoUI): string {
    const { min, max } = seccion;
    if (min === 0 && max === 1) return 'Opcional';
    if (min === 0) return `Hasta ${max}`;
    if (min === max) return `Elegí ${min}`;
    return `Mín. ${min} / Máx. ${max}`;
  }

  textoPrecioOpcion(precio: number): string {
    return precio === 0 ? 'Sin costo adicional' : `+ Bs. ${precio}`;
  }

  /** Precio de comparación tachado para la opción, si aplica. */
  textoPrecioComparacionOpcion(op: ProductoSeccionUI): string | null {
    if (op.precioComparacion > 0) {
      return `Bs. ${op.precioComparacion}`;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Lógica de selección y validación
  // ---------------------------------------------------------------------------

  onSeleccionarOpcion(seccionKey: string, idProducto: string): void {
    this.seleccionarOpcion.emit({ seccionKey, idProducto });
  }

  onAgregar(): void {
    const seccionFaltante = this.detalle().secciones.find((sec) => {
      const cantidadSeleccionada = (this.selecciones()[sec.key] ?? []).length;
      return cantidadSeleccionada < sec.min;
    });

    if (seccionFaltante) {
      this.mostrarMensajeValidacion(
        `Seleccioná al menos ${seccionFaltante.min} opción en "${seccionFaltante.titulo}"`,
      );
      return;
    }

    this.agregar.emit();
  }

  private mostrarMensajeValidacion(mensaje: string): void {
    this.mensajeValidacion.set(mensaje);
    if (this._timerValidacion) clearTimeout(this._timerValidacion);
    this._timerValidacion = setTimeout(() => {
      this.mensajeValidacion.set('');
      this._timerValidacion = null;
    }, 3000);
  }
}
