import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { SignJWT } from "jose";

const secret = process.env.AUTH_SECRET;
const hasGoogle =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasGitHub =
  process.env.GITHUB_ID && process.env.GITHUB_SECRET;
const hasProviders = hasGoogle || hasGitHub;

export function isAuthEnabled(): boolean {
  return Boolean(secret && hasProviders);
}

export function getAuthConfigError(): string | null {

  return null;
}

const providers = [
  ...(hasGoogle
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              scope: "openid email profile",
            },
          },
        }),
      ]
    : []),
  ...(hasGitHub
    ? [
        GitHub({
          clientId: process.env.GITHUB_ID!,
          clientSecret: process.env.GITHUB_SECRET!,
          authorization: {
            params: {
              scope: "read:user user:email",
            },
          },
        }),
      ]
    : []),
];

export const { auth, handlers, signIn, signOut } = NextAuth({
  basePath: "/auth",
  providers,
  secret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider && account?.providerAccountId) {
        token.sub = `${account.provider}|${account.providerAccountId}`;
        token.provider = account.provider;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? session.user.email ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

/** Build a JWT for the API from the session. Same secret must be set as AUTH_JWT_SECRET on the API. */
export async function createApiToken(payload: {
  sub: string;
  email?: string | null;
  name?: string | null;
}): Promise<string> {
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const key = new TextEncoder().encode(secret);
  const sub = payload.sub ?? "";
  return new SignJWT({
    sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
    scope: [
      "project:read",
      "project:write",
      "research:run",
      "positioning:run",
      "execution:run",
      "approval:read",
      "approval:write",
      "execution:send",
      "connector:link",
      "repo:read",
      "repo:write",
      "drive:write",
    ].join(" "),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}
