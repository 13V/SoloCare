import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Supabase sometimes redirects OAuth codes to Site URL (/) instead of /auth/callback
  // Intercept and forward to the correct handler
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicPaths = ["/login", "/signup", "/", "/auth/callback", "/reset-password", "/auth/update-password"];
  const isPublicPath = publicPaths.some((p) => pathname === p) || pathname.startsWith("/api/");

  // Not logged in → login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in on auth pages → dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding + subscription gate for app pages
  if (user && !isPublicPath && pathname !== "/subscribe" && pathname !== "/onboarding" && pathname !== "/settings" && !pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, onboarding_complete")
      .eq("id", user.id)
      .single();

    // No profile or onboarding incomplete → force onboarding first
    if (!profile?.onboarding_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Onboarding done but no active subscription → force subscribe
    if (profile.subscription_status !== "active") {
      const url = request.nextUrl.clone();
      url.pathname = "/subscribe";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
