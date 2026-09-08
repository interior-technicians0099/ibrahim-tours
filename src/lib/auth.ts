import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export { auth, signIn, signOut };

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  operatorId: string | null;
  mustChangePassword: boolean;
}

/**
 * Retrieves the currently authenticated session user on the server.
 * Never trust client-sent headers or role claims.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role,
    operatorId: session.user.operatorId ?? null,
    mustChangePassword: Boolean(session.user.mustChangePassword),
  };
}

/**
 * Enforces that the current request is from an authenticated user with an authorized role.
 * Redirects to /login if unauthenticated, or to /change-password if temporary password is active.
 * Throws 403 error if the user's role is not authorized.
 * PLATFORM_ADMIN holds superuser access to both platform and operator routes.
 */
export async function requireRole(
  allowedRoles: Role | Role[],
  ...additionalRoles: Role[]
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Force password change before any dashboard access
  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const roleList: Role[] = Array.isArray(allowedRoles)
    ? [...allowedRoles, ...additionalRoles]
    : [allowedRoles, ...additionalRoles];

  const isAuthorized = roleList.includes(user.role) || user.role === Role.PLATFORM_ADMIN;

  if (!isAuthorized) {
    throw new Error("403 Forbidden: You do not have permission to access this resource.");
  }

  return user;
}

/**
 * Scopes database queries to the operator's specific operatorId.
 * - If user is OPERATOR, strictly returns their operatorId.
 * - If user is PLATFORM_ADMIN, returns null (unrestricted scope across all operators).
 */
export async function getOperatorScope(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.OPERATOR) {
    if (!user.operatorId) {
      throw new Error("403 Forbidden: Operator profile not linked to user account.");
    }
    return user.operatorId;
  }

  // PLATFORM_ADMIN is unrestricted
  return null;
}

export { getOperatorScope as getScopedOperatorId };
