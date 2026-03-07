import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Get the current session user. Throws AuthError if not authenticated.
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Não autenticado", 401);
  }
  return session.user;
}

/**
 * Require the current user to have one of the specified roles.
 * Throws AuthError (403) if role doesn't match.
 */
export async function requireRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("Sem permissão", 403);
  }
  return user;
}

/**
 * Alias for getSessionUser — ensures the request is authenticated.
 */
export const requireAuth = getSessionUser;

/**
 * Helper to build a JSON error response from an AuthError or unknown error.
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Unexpected error:", error);
  return Response.json({ error: "Erro interno" }, { status: 500 });
}
