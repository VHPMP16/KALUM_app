import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["invite", "recovery", "signup", "email"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/update-password";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/update-password";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();
  let error: { message: string } | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && type && allowedTypes.has(type)) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "invite" | "recovery" | "signup" | "email" });
    error = result.error;
  } else {
    error = { message: "Missing or invalid authentication token." };
  }

  if (error) {
    const reason = type === "invite" ? "invite_expired" : "link_invalid";
    return NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
