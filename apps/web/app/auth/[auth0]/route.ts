import { NextResponse } from "next/server";

import { auth0, getAuth0ConfigError, isAuthEnabled } from "@/lib/auth0";

export async function GET(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      {
        error: "AUTH0_CONFIG_MISSING",
        message: getAuth0ConfigError(),
        hint: "Set Auth0 web env vars in apps/web/.env.local, then restart Next.js."
      },
      { status: 500 }
    );
  }
  return auth0!.middleware(request);
}

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      {
        error: "AUTH0_CONFIG_MISSING",
        message: getAuth0ConfigError(),
        hint: "Set Auth0 web env vars in apps/web/.env.local, then restart Next.js."
      },
      { status: 500 }
    );
  }
  return auth0!.middleware(request);
}
