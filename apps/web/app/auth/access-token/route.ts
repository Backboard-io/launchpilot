import { NextResponse } from "next/server";

import { auth, createApiToken, isAuthEnabled } from "@/lib/auth";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await createApiToken({
      sub: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Token creation failed" }, { status: 500 });
  }
}
