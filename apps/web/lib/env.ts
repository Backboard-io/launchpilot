export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    "http://localhost:8000/v1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
};
