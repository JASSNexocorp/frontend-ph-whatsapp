// Normalización de URLs de imágenes (CDN con protocolo relativo //, etc.).

/**
 * Devuelve una URL absoluta usable en `src` de `<img>`.
 * Si viene `//dominio/...` se asume HTTPS.
 */
export function normalizarUrlImagen(
  url: string | undefined | null,
): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const t = url.trim();
  if (t === '') return undefined;
  if (t.startsWith('//')) {
    return `https:${t}`;
  }
  return t;
}
