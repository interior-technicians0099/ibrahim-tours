import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser, requireRole, getOperatorScope, AuthenticatedUser } from "@/lib/auth";

export { getCurrentUser, requireRole, getOperatorScope };
export type { AuthenticatedUser };

/**
 * Scopes database queries to the operator's specific operatorId.
 * - If user is OPERATOR, strictly returns their operatorId.
 * - If user is PLATFORM_ADMIN, allows viewing a requested operator or returns null (all).
 */
export async function getScopedOperatorId(requestedOperatorId?: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.OPERATOR) {
    if (!user.operatorId) {
      throw new Error("Operator profile not linked to user account.");
    }
    return user.operatorId;
  }

  // PLATFORM_ADMIN can scope to a requested operator or view all
  return requestedOperatorId || null;
}
