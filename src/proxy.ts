import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // 0. Enforce HTTPS in production
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");
  if (process.env.NODE_ENV === "production" && proto === "http" && host) {
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 301);
  }

  const session = request.auth;

  const isOperatorRoute = pathname.startsWith("/operator");
  const isPlatformRoute = pathname.startsWith("/platform") || pathname.startsWith("/api/platform");
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/change-password";

  const user = session?.user;

  // 1. Unauthenticated users accessing protected routes
  if (isOperatorRoute || isPlatformRoute || isAdminRoute || isChangePasswordPage) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Authenticated user handling
  if (user) {
    const mustChange = Boolean(user.mustChangePassword);

    // If user has a temporary password, force them to /change-password
    if (mustChange) {
      if (!isChangePasswordPage && !pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }
      return NextResponse.next();
    }

    // If user does NOT need to change password, prevent access to /change-password & /login
    if (isLoginPage || isChangePasswordPage) {
      if (user.role === "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/platform", request.url));
      }
      return NextResponse.redirect(new URL("/operator", request.url));
    }

    // Handle generic /admin/** alias
    if (isAdminRoute) {
      if (user.role === "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/platform", request.url));
      }
      return NextResponse.redirect(new URL("/operator", request.url));
    }

    // Platform routes: strictly PLATFORM_ADMIN only
    if (isPlatformRoute && user.role !== "PLATFORM_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Platform Admin access required" }, { status: 403 });
      }
      // OPERATOR is forbidden from accessing /platform/** -> redirect to /operator
      return NextResponse.redirect(new URL("/operator", request.url));
    }

    // Operator routes: accessible by OPERATOR and PLATFORM_ADMIN (superadmin override)
    if (isOperatorRoute && user.role !== "OPERATOR" && user.role !== "PLATFORM_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Operator access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
});

export const config = {
  matcher: [
    "/login",
    "/change-password",
    "/admin",
    "/admin/:path*",
    "/operator",
    "/operator/:path*",
    "/platform",
    "/platform/:path*",
    "/api/platform/:path*",
  ],
};
