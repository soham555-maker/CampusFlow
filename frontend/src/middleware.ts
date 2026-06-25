import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

export async function middleware(request: NextRequest) {
  // Dev bypass — skip all auth so mock-data pages are viewable without Supabase
  if (DEV_BYPASS) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth pages — redirect logged-in users away to their dashboard
  if (pathname.startsWith("/(auth)") || pathname === "/login" || pathname === "/register") {
    if (user) {
      const { data: role } = await supabase.rpc("auth_role");
      if (role === "admin") return NextResponse.redirect(new URL("/admin/students", request.url));
      if (role === "teacher") return NextResponse.redirect(new URL("/teacher", request.url));
      return NextResponse.redirect(new URL("/student", request.url));
    }
    return supabaseResponse;
  }

  // Landing page — always public; logged-in users get redirected to their dashboard
  if (pathname === "/") {
    if (user) {
      const { data: role } = await supabase.rpc("auth_role");
      if (role === "admin") return NextResponse.redirect(new URL("/admin/students", request.url));
      if (role === "teacher") return NextResponse.redirect(new URL("/teacher", request.url));
      return NextResponse.redirect(new URL("/student", request.url));
    }
    return supabaseResponse;
  }

  // All other routes require auth
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
