// NEXT_PUBLIC_* must be set at build time (e.g. Docker ARG); runtime env is not available in the browser.
// When missing, default to same-origin /v1 so fetch(undefined + "/me") doesn't become "undefined/me" → /app/projects/undefined/me.
const apiBaseRaw =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "/v1";
const apiBase =
  apiBaseRaw && apiBaseRaw !== "undefined" && apiBaseRaw !== "null"
    ? apiBaseRaw
    : "/v1";

export const env = {
  apiBaseUrl: apiBase,
  /** Server-side only: fetch directly to API backend, bypassing Next.js proxy (fixes self-request in Docker). */
  apiInternalBaseUrl:
    process.env.API_INTERNAL_URL ?? apiBase,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
};
