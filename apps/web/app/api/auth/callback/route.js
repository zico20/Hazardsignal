import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// OAuth + magic-link return URL.
// Supabase appends `?code=…` after the user clicks the link / completes the
// OAuth dance. We exchange that code for a session and write the resulting
// session cookies directly onto the redirect response — using cookies()
// from next/headers does NOT auto-attach them to NextResponse.redirect().
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") || "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  const response = NextResponse.redirect(`${origin}${next}`);

  if (!code) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/en/signin?err=callback`);
  }

  return response;
}
