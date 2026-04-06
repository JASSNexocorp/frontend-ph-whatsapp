// Respuestas del endpoint POST /tienda/validar-token (alineado al backend).

export type MotivoTokenInvalido =
  | 'TOKEN_EXPIRADO'
  | 'TOKEN_INVALIDO'
  | 'TOKEN_INCOMPLETO'
  | string;

export type RespuestaValidarToken =
  | RespuestaValidarTokenOk
  | RespuestaValidarTokenError;

export interface RespuestaValidarTokenOk {
  valido: true;
  clienteId: string;
  tipoEntrega: string;
  /** Identificador de sucursal si el backend lo envía (legacy u otros clientes). */
  sucursalId?: string;
  /** Nombre de sucursal para cruzar stock por tienda (GET /tienda/informacion). */
  nombreSucursal?: string;
  emitidoEn: string | null;
  expiraEn: string | null;
}

export interface RespuestaValidarTokenError {
  valido: false;
  motivo: MotivoTokenInvalido;
  detalle: string;
}
