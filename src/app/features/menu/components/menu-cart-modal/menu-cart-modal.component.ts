// Modal pantalla completa del carrito: entrega, líneas y confirmación.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MenuModalShellComponent } from '../menu-modal-shell/menu-modal-shell.component';
import { formatearPrecioBs } from '../../utils/menu-format.util';
import type {
  LineaCarrito,
  MenuRutasAssets,
  OpcionLineaCarrito,
  TipoEntregaId,
} from '../../models/menu.models';

/** Opciones del carrito agrupadas: un título de sección y varias elecciones. */
interface GrupoOpcionesCarrito {
  tituloSeccion: string;
  nombresOpcion: string[];
}

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
  /** Si el JWT ya definió domicilio/retiro, no se muestran los dos botones. */
  entregaSoloLectura = input(false);
  /** Suma solo de productos (sin costo de envío). */
  subtotalProductosFormateado = input.required<string>();
  /** Costo de envío cuando la entrega es domicilio; null si es retiro. */
  costoEnvioFormateado = input<string | null>(null);
  /** Total a pagar: subtotal + envío si aplica. */
  totalFormateado = input.required<string>();
  /** Total de referencia tachado (suma de precios “antes” por línea), si aplica. */
  totalComparacionFormateado = input<string | null>(null);
  /** Texto del monto mínimo de pedido; null si el catálogo no lo define. */
  pedidoMinimoFormateado = input<string | null>(null);
  cumplePedidoMinimo = input(true);
  /** Cuánto falta para el mínimo; null si ya se cumple o no hay mínimo. */
  faltaParaPedidoMinimoFormateado = input<string | null>(null);
  /** Evita doble envío mientras el POST /tienda/notificar-carrito está en curso. */
  enviandoPedido = input(false);
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

  etiquetaEntregaResumen(): string {
    return this.tipoEntrega() === 'domicilio'
      ? 'Domicilio'
      : 'Retiro en local';
  }

  confirmacionBloqueada(): boolean {
    return (
      this.lineas().length === 0 ||
      !this.cumplePedidoMinimo() ||
      this.enviandoPedido()
    );
  }

  /** Debajo de «Tu carrito» en el header del modal. */
  textoPedidoMinimoBajoTitulo(): string | null {
    const m = this.pedidoMinimoFormateado();
    return m ? `Pedido mínimo: ${m}` : null;
  }

  textoFaltaMinimoBajoTitulo(): string | null {
    const f = this.faltaParaPedidoMinimoFormateado();
    return f ? `Te faltan ${f} para confirmar.` : null;
  }

  /** Evita repetir el título de sección por cada extra (p. ej. 5 ingredientes → un bloque). */
  opcionesAgrupadasPorSeccion(linea: LineaCarrito): GrupoOpcionesCarrito[] {
    const orden: string[] = [];
    const porTitulo = new Map<string, string[]>();

    for (const op of linea.opcionesCarrito) {
      this.acumularOpcionEnGrupo(op, orden, porTitulo);
    }

    return orden.map((titulo) => ({
      tituloSeccion: titulo,
      nombresOpcion: porTitulo.get(titulo) ?? [],
    }));
  }

  private acumularOpcionEnGrupo(
    op: OpcionLineaCarrito,
    orden: string[],
    porTitulo: Map<string, string[]>,
  ): void {
    if (!porTitulo.has(op.tituloSeccion)) {
      orden.push(op.tituloSeccion);
      porTitulo.set(op.tituloSeccion, []);
    }
    porTitulo.get(op.tituloSeccion)!.push(op.nombreOpcion);
  }
}
