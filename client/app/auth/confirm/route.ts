import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles email confirmation links (invite, password reset, signup).
 * Supabase emails include a token_hash + type that must be verified
 * server-side, then the user is redirected to the appropriate page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "invite"
    | "recovery"
    | "signup"
    | "email"
    | null;
  const next = searchParams.get("next") ?? "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      // For invite & recovery, send to password creation page
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      // For other types (signup confirmation), send to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
