// Bloquea /menu sin token JWT válido y persiste el contexto del cliente en el store.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MenuClienteStore } from '../aplicacion/menu-cliente.store';
import { TiendaApiService } from '../data/tienda-api.service';
import type { RespuestaValidarTokenOk } from '../models/menu-cliente-jwt.models';

/** Contexto mínimo para probar el menú sin POST /tienda/validar-token. */
const validacionOkDesarrollo = (): RespuestaValidarTokenOk => ({
  valido: true,
  clienteId: 'desarrollo-local',
  tipoEntrega: '',
  emitidoEn: null,
  expiraEn: null,
});

export const menuTokenValidoGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const tiendaApi = inject(TiendaApiService);
  const menuCliente = inject(MenuClienteStore);

  const tokenRaw = route.queryParamMap.get('token');
  const tokenConsulta = tokenRaw?.trim() ?? '';

  if (environment.development) {
    const tokenEfectivo =
      tokenConsulta !== '' ? tokenConsulta : 'dev-sin-token-query';
    menuCliente.establecerDesdeValidacionOk(tokenEfectivo, validacionOkDesarrollo());
    return true;
  }

  const token = tokenConsulta;

  if (!token) {
    await router.navigate(['/link-expirado'], {
      state: {
        motivo: 'FALTA_TOKEN',
        detalle:
          'No se encontró el enlace de menú. Solicitá un enlace nuevo por WhatsApp.',
      },
    });
    return false;
  }

  try {
    const resp = await firstValueFrom(tiendaApi.validarToken(token));
    if (!resp.valido) {
      await router.navigate(['/link-expirado'], {
        state: { motivo: resp.motivo, detalle: resp.detalle },
      });
      return false;
    }
    menuCliente.establecerDesdeValidacionOk(token, resp);
    return true;
  } catch {
    await router.navigate(['/link-expirado'], {
      state: {
        motivo: 'ERROR_RED',
        detalle:
          'No se pudo validar el enlace. Verificá tu conexión e intentá de nuevo.',
      },
    });
    return false;
  }
};
