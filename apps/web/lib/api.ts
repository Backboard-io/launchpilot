import { auth0 } from "@/lib/auth0";
import { env } from "@/lib/env";

// Client-side token fetch
async function getClientAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch("/auth/access-token", {
      method: "GET",
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { token?: string };
    return payload.token ?? null;
  } catch {
    return null;
  }
}

// Server-side token fetch
async function getServerAccessToken(): Promise<string | null> {
  if (!auth0) {
    return null;
  }

  try {
    const tokenResponse = await auth0.getAccessToken();
    return tokenResponse?.token ?? null;
  } catch {
    return null;
  }
}

// Client-side API fetch (for use in client components)
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const token = await getClientAccessToken();
    const headers = new Headers(init?.headers ?? {});
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload.data as T;
  } catch {
    return null;
  }
}

// Server-side API fetch (for use in server components)
export async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const token = await getServerAccessToken();
    const headers = new Headers(init?.headers ?? {});
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload.data as T;
  } catch {
    return null;
  }
}
