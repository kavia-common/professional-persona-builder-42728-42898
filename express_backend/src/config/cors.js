'use strict';

/**
 * Build CORS options from environment variables.
 *
 * This backend is typically accessed via the Next.js `/api` rewrite (server-to-server),
 * in which case CORS is largely irrelevant. However, during development the browser
 * may call Express directly, so we keep CORS permissive-by-default unless an allowlist
 * is explicitly configured.
 */

const { URL } = require('url');

function normalizeOrigin(origin) {
  try {
    const u = new URL(origin);
    // Normalize to protocol+hostname+port (if specified).
    return `${u.protocol}//${u.host}`;
  } catch (_) {
    return null;
  }
}

// PUBLIC_INTERFACE
function buildCorsOptions() {
  /** Build CORS options used by the Express app. */
  const originsRaw =
    process.env.ALLOWED_ORIGINS ||
    // Prefer the env vars that exist in this repo/container set.
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    '';

  const allowedOrigins = originsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((o) => normalizeOrigin(o) || o);

  const allowedHeaders = (process.env.ALLOWED_HEADERS || 'Content-Type,Authorization')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedMethods = (process.env.ALLOWED_METHODS || 'GET,POST,PUT,DELETE,OPTIONS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const maxAge = Number(process.env.CORS_MAX_AGE || 3600);

  return {
    origin: (origin, cb) => {
      // Allow non-browser clients or same-origin (e.g., Next.js rewrite / server-to-server).
      if (!origin) return cb(null, true);

      // If no allowlist configured, keep permissive dev behavior.
      if (allowedOrigins.length === 0) return cb(null, true);

      const normalized = normalizeOrigin(origin) || origin;

      if (allowedOrigins.includes(origin) || allowedOrigins.includes(normalized)) {
        return cb(null, true);
      }

      // IMPORTANT: return "not allowed" as false (no throw) so the request fails cleanly
      // rather than crashing middleware with an unhandled error.
      return cb(null, false);
    },
    methods: allowedMethods,
    allowedHeaders,
    maxAge,
    credentials: true,
    // Helps some proxies/clients handle 204 preflights more consistently.
    optionsSuccessStatus: 204
  };
}

module.exports = { buildCorsOptions };
