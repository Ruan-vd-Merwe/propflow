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
    pathname.startsWith("/auth/") || // /auth/callback (email confirm) and /auth/reset-password
    // Marketing pages
    pathname === "/features" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/area-match" ||
    pathname === "/areas" ||
    pathname === "/how-scoring-works" ||
    pathname === "/unsubscribe" ||
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

  // Redirect authenticated users away from /login and /register
  // (leave / alone so logged-in users can still view the marketing page)
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
