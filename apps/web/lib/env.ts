const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8000/v1";

export const env = {
  apiBaseUrl: apiBase,
  /** Server-side only: fetch directly to API backend, bypassing Next.js proxy (fixes self-request in Docker). */
  apiInternalBaseUrl:
    process.env.API_INTERNAL_URL ?? apiBase,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
};
