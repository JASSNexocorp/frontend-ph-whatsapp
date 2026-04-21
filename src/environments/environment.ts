// URLs y flags de entorno para la app (ajustar apiUrl en producción).

export const environment = {
  /** En true: el guard de menú no llama a validar-token (solo desarrollo local). */
  development: true,
  /** Base del backend (sin barra final). */
  apiUrl: 'https://b589-190-180-46-101.ngrok-free.app',
  /** Línea WhatsApp del menú (+591 64534476 en formato wa.me, sin espacios ni +). */
  whatsappUrl: 'https://wa.me/59164534476',
};
