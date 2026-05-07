import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase auth session on every request. Without this, access
// tokens expire after ~1 hour and the user appears anonymous on the next
// navigation even though they're "still signed in" client-side.
//
// The middleware also writes refreshed cookies back to the browser so they
// stay in sync with the server. Skip the daily-pipeline / health endpoints
// — they don't need a session and we don't want middleware overhead there.
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // No Supabase auth configured — pass through unchanged.
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  // Touching getUser() forces a token refresh if the access token is
  // expired and a valid refresh token exists. Result is intentionally
  // discarded; we just want the cookie side effects.
  await supabase.auth.getUser();

  return response;
}

// Run on every navigation EXCEPT static files, the favicon, Next's
// internal _next/* paths, and the auth API routes. The auth routes are
// excluded because the PKCE OAuth flow stores a temporary code_verifier
// cookie that this middleware can clobber when refreshing sessions —
// causing "invalid flow state" errors at the callback exchange step.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|api/healthcheck|api/run|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
