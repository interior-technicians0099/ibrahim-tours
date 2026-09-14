import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const host = rawHost.includes("0.0.0.0") ? "10.254.75.221:3000" : rawHost;
  const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https");
  const baseUrl = `${isHttps ? "https" : "http"}://${host}`;

  // 0. Enforce HTTPS in production
  const proto = request.headers.get("x-forwarded-proto");
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
      const loginUrl = new URL("/login", baseUrl);
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
        return NextResponse.redirect(new URL("/change-password", baseUrl));
      }
      return NextResponse.next();
    }

    // If user does NOT need to change password, prevent access to /change-password & /login
    if (isLoginPage || isChangePasswordPage) {
      const target = user.role === "PLATFORM_ADMIN" ? "/platform" : "/operator/tours";
      return NextResponse.redirect(new URL(target, baseUrl));
    }

    // Handle generic /admin/** alias → route based on role
    if (isAdminRoute) {
      const target = user.role === "PLATFORM_ADMIN" ? "/platform" : "/operator";
      return NextResponse.redirect(new URL(target, baseUrl));
    }

    // PLATFORM_ADMIN landing on /operator → redirect to /platform
    if ((pathname === "/operator" || pathname === "/operator/") && user.role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/platform", baseUrl));
    }

    // Platform routes: strictly PLATFORM_ADMIN only
    if (isPlatformRoute && user.role !== "PLATFORM_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Platform Admin access required" }, { status: 403 });
      }
      // OPERATOR is forbidden from accessing /platform/** -> redirect to /operator/tours?from=platform
      const targetUrl = new URL("/operator/tours", baseUrl);
      targetUrl.searchParams.set("from", "platform");
      return NextResponse.redirect(targetUrl);
    }

    // Operator routes: accessible by OPERATOR, COMPANY_ADMIN, and PLATFORM_ADMIN (superadmin override)
    if (isOperatorRoute && user.role !== "OPERATOR" && user.role !== "COMPANY_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Operator or Company Admin access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", baseUrl));
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
