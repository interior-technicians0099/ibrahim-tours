"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash, verify as verifyArgon2 } from "@node-rs/argon2";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface ChangePasswordState {
  success?: boolean;
  error?: string | null;
  targetUrl?: string;
  userEmail?: string;
}

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to change your password." };
  }

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All password fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New password and confirmation do not match." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  if (newPassword === currentPassword) {
    return { success: false, error: "New password must be different from your current password." };
  }

  // Look up user in database
  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.isActive) {
    return { success: false, error: "User account not found or deactivated." };
  }

  // Verify current password (argon2id or bcrypt fallback)
  let isMatch = false;
  if (user.passwordHash.startsWith("$argon2id$")) {
    try {
      isMatch = await verifyArgon2(user.passwordHash, currentPassword);
    } catch {
      isMatch = false;
    }
  } else {
    isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  }

  if (!isMatch) {
    return { success: false, error: "Current password is incorrect." };
  }

  // Hash new password using Argon2id (default)
  const newHash = await hash(newPassword);

  // Update user record: save new hash and clear mustChangePassword flag
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  // Resolve client IP
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PASSWORD_CHANGED",
      entityType: "AdminUser",
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: ip,
    },
  });

  const targetUrl = user.role === "PLATFORM_ADMIN" ? "/platform" : "/operator";
  return { success: true, targetUrl, userEmail: user.email };
}

export async function logoutAction(): Promise<void> {
  const session = await auth();

  if (session?.user?.id) {
    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "LOGOUT",
          entityType: "AdminUser",
          entityId: session.user.id,
          details: {
            email: session.user.email,
            role: session.user.role,
          },
          ipAddress: ip,
        },
      });
    } catch (err) {
      console.error("Failed to write logout audit log:", err);
    }
  }

  await signOut({ redirectTo: "/login" });
}
