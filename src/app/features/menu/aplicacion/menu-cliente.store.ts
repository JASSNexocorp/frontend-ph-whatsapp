// Estado del cliente tras validar el JWT del menú (memoria; no persistir en storage).

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import type { RespuestaValidarTokenOk } from '../models/menu-cliente-jwt.models';

export type EstadoMenuCliente = {
  clienteId: string | null;
  tipoEntrega: string | null;
  sucursalId: string | null;
  /** Nombre de sucursal del JWT (match con `sucursales[].nombre` del catálogo). */
  nombreSucursal: string | null;
  emitidoEn: string | null;
  expiraEn: string | null;
  tokenMenu: string | null;
};

const estadoInicialMenuCliente: EstadoMenuCliente = {
  clienteId: null,
  tipoEntrega: null,
  sucursalId: null,
  nombreSucursal: null,
  emitidoEn: null,
  expiraEn: null,
  tokenMenu: null,
};

export const MenuClienteStore = signalStore(
  { providedIn: 'root' },
  withState(estadoInicialMenuCliente),
  withMethods((store) => ({
    establecerDesdeValidacionOk(token: string, datos: RespuestaValidarTokenOk) {
      patchState(store, {
        tokenMenu: token,
        clienteId: datos.clienteId,
        tipoEntrega: datos.tipoEntrega,
        sucursalId: datos.sucursalId ?? null,
        nombreSucursal: datos.nombreSucursal?.trim() ?? null,
        emitidoEn: datos.emitidoEn,
        expiraEn: datos.expiraEn,
      });
    },
    limpiarSesion() {
      patchState(store, estadoInicialMenuCliente);
    },
  })),
);
