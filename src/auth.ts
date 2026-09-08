import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { verify as verifyArgon2 } from "@node-rs/argon2";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limiter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "ibrahim-tours-zanzibar-secret-jwt-key-2026",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Resolve client IP address from headers
        const forwardedFor = req?.headers?.get("x-forwarded-for");
        const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

        // 1. Rate Limiting Check (5 attempts / 15 minutes)
        const rateLimitKey = `${ip}:${email}`;
        const rateCheck = checkRateLimit(rateLimitKey);

        if (!rateCheck.allowed) {
          await prisma.auditLog.create({
            data: {
              action: "LOGIN_RATE_LIMITED",
              entityType: "AdminUser",
              details: { email, remainingLockoutSec: rateCheck.retryAfterSec },
              ipAddress: ip,
            },
          });

          // Alert PLATFORM_ADMIN about repeated failed login attempts / lockout
          try {
            await prisma.notification.create({
              data: {
                recipient: "PLATFORM_ADMIN",
                channel: "EMAIL",
                type: "SECURITY_ALERT_FAILED_LOGINS",
                payload: {
                  subject: `Security Alert: Repeated Failed Logins on ${email}`,
                  email,
                  ipAddress: ip,
                  lockoutDurationSec: rateCheck.retryAfterSec,
                  timestamp: new Date().toISOString(),
                },
                sentAt: new Date(),
              },
            });
          } catch (notifErr) {
            console.error("Failed to record security alert notification:", notifErr);
          }

          throw new Error(
            `Too many failed login attempts. Please try again in ${Math.ceil(
              rateCheck.retryAfterSec / 60
            )} minutes.`
          );
        }

        // 2. Query AdminUser
        const user = await prisma.adminUser.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          recordFailedAttempt(rateLimitKey);
          await prisma.auditLog.create({
            data: {
              userId: user?.id ?? null,
              action: "LOGIN_FAILED",
              entityType: "AdminUser",
              details: { email, reason: !user ? "USER_NOT_FOUND" : "ACCOUNT_INACTIVE" },
              ipAddress: ip,
            },
          });
          return null;
        }

        // 3. Password Verification (argon2id with bcrypt fallback)
        let isMatch = false;
        if (user.passwordHash.startsWith("$argon2id$")) {
          try {
            isMatch = await verifyArgon2(user.passwordHash, password);
          } catch {
            isMatch = false;
          }
        } else {
          isMatch = await bcrypt.compare(password, user.passwordHash);
        }

        if (!isMatch) {
          recordFailedAttempt(rateLimitKey);
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              entityType: "AdminUser",
              details: { email, reason: "INVALID_CREDENTIALS" },
              ipAddress: ip,
            },
          });
          return null;
        }

        // 4. Success: Clear rate-limit bucket, update lastLogin, record AuditLog
        resetRateLimit(rateLimitKey);

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_SUCCESS",
            entityType: "AdminUser",
            entityId: user.id,
            details: {
              role: user.role,
              operatorId: user.operatorId,
              mustChangePassword: Boolean((user as any).mustChangePassword),
            },
            ipAddress: ip,
          },
        });

        return {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          operatorId: user.operatorId,
          mustChangePassword: Boolean((user as any).mustChangePassword),
        };
      },
    }),
  ],
});
