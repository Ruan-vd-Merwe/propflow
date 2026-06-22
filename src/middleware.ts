import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  // Note: /tenant/profile is auth-protected even though /tenant/[token] is public
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" || // password reset landing page (must be public for Supabase redirect)
    pathname === "/confirm-email" ||
    pathname.startsWith("/auth/") || // /auth/callback, /auth/confirm
    // Marketing pages
    pathname === "/features" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/area-match" ||
    pathname === "/areas" ||
    pathname === "/how-scoring-works" ||
    pathname === "/unsubscribe" ||
    pathname === "/trust" ||
    pathname === "/for-tenants" ||
    pathname === "/for-landlords" ||
    pathname.startsWith("/browse") ||
    pathname.startsWith("/solutions/") ||
    pathname.startsWith("/resources/") ||
    // App public routes
    pathname.startsWith("/apply/") ||
    pathname.startsWith("/checkin/") ||
    pathname.startsWith("/api/") ||
    (pathname.startsWith("/tenant/") && pathname !== "/tenant/profile");

  // Protect all non-public routes
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const m = user.user_metadata ?? {};
    const isLandlord = !!(m.is_landlord ?? m.user_type === "landlord");
    const isTenant = !!(m.is_tenant ?? m.user_type === "tenant");
    const isConnector = !!(m.is_connector ?? m.user_type === "connector");

    // Redirect authenticated users away from /login and /register
    if (pathname === "/login" || pathname === "/register") {
      const dest =
        isTenant && !isLandlord && !isConnector
          ? "/tenant/profile"
          : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Guard landlord-only routes for tenant-only users
    if (
      isTenant &&
      !isLandlord &&
      !isConnector &&
      (pathname === "/dashboard" ||
        pathname.startsWith("/portfolio") ||
        pathname === "/onboarding")
    ) {
      return NextResponse.redirect(
        new URL("/tenant/profile", request.url),
      );
    }

    // Guard landlord-only routes for connector-only users
    if (
      isConnector &&
      !isLandlord &&
      !isTenant &&
      (pathname === "/dashboard" ||
        pathname.startsWith("/portfolio") ||
        pathname === "/onboarding")
    ) {
      return NextResponse.redirect(
        new URL("/connector/tasks", request.url),
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
