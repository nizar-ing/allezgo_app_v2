const BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.allezgoo.com';

/**
 * Resolves a possibly-relative backend media URL to an absolute URL.
 * Respects VITE_API_BASE_URL env var; falls back to the production host.
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function resolveMediaUrl(url) {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE}${url}`;
}
