import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser, requireRole, getOperatorScope, RETIRED_ROLES, AuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export { getCurrentUser, requireRole, getOperatorScope, RETIRED_ROLES };
export type { AuthenticatedUser };

/**
 * Scopes database queries to the company/operator specific ID.
 * - If user is OPERATOR, returns their operatorId (or active company profile).
 * - If user is PLATFORM_ADMIN, allows viewing a requested operator or returns null (unrestricted).
 */
export async function getScopedOperatorId(requestedOperatorId?: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if ((RETIRED_ROLES as Role[]).includes(user.role)) {
    throw new Error(
      '403 Forbidden: This role has been retired. Please ask a super admin to re-provision your account as PLATFORM_ADMIN or OPERATOR.'
    );
  }

  if (user.role === Role.OPERATOR) {
    if (!user.operatorId) {
      const first = await prisma.companyProfile.findFirst();
      return first?.id || null;
    }
    return user.operatorId;
  }

  // PLATFORM_ADMIN can scope to a requested operator or view all
  return requestedOperatorId || null;
}
