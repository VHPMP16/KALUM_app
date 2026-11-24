"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAppOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Não foi possível identificar o endereço da aplicação.");
  return `${protocol}://${host}`;
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1) redirect("/login?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut();
    redirect("/login?error=credentials");
  }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("status").eq("id", userData.user.id).maybeSingle();
  if (profileError || !profile || profile.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?error=pending");
  }
  redirect("/chat");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/forgot-password?error=invalid");
  const headerStore = await headers();
  let redirectTo: string;
  try {
    redirectTo = new URL("/auth/confirm?next=/update-password", getAppOrigin(headerStore)).toString();
  } catch {
    redirect("/forgot-password?error=configuration");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    // Supabase's built-in SMTP has a project-wide hourly limit. Keep the
    // response generic about account existence, but explain operational limits.
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      redirect("/forgot-password?error=rate_limit");
    }
    if (error.code === "email_address_not_authorized") {
      redirect("/forgot-password?error=provider_restriction");
    }
    redirect("/forgot-password?error=send");
  }
  redirect("/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 12 || password.length > 128 || password !== confirmation) redirect("/update-password?error=invalid");
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?error=link_invalid");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/update-password?error=update");
  redirect("/login?password_updated=1");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
