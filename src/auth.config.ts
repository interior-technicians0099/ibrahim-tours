import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "ibrahim-tours-secret-key-32-chars-minimum-replace-in-prod",
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.userId = user.id;
        token.role = user.role;
        token.operatorId = user.operatorId;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      if (trigger === "update" && session) {
        if (session.user?.mustChangePassword !== undefined) {
          token.mustChangePassword = session.user.mustChangePassword;
        } else if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const uid = (token.userId as string) || (token.id as string);
        session.user.id = uid;
        session.user.userId = uid;
        session.user.role = token.role as any;
        session.user.operatorId = (token.operatorId as string | null) ?? null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  providers: [], // Configured with full Node.js database & crypto dependencies in auth.ts
};
