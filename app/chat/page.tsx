import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { ChatWorkspace } from "@/app/chat/chat-workspace";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mensagens" };

export default async function ChatPage() {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (!isConfigured) redirect("/login");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "active") redirect("/login?error=pending");

  const { data: adminRole } = await supabase
    .from("profile_roles")
    .select("roles!inner(code)")
    .eq("profile_id", userId)
    .eq("roles.code", "it_admin")
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/chat" className="flex min-w-0 items-center gap-3" aria-label="ChatApp, página inicial">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-700 text-sm font-bold tracking-tight text-white shadow-sm">C</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight text-slate-950">CALUNGA</span>
              <span className="block truncate text-xs text-slate-500">CHAT CORPORATIVO</span>
            </span>
          </Link>
          <nav aria-label="Navegação principal" className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-red-800 md:inline-flex">AMBIENTE AUDITADO</span>
            {adminRole ? (
              <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-800">
                Administração
              </Link>
            ) : null}
            <span className="hidden max-w-44 truncate rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 sm:inline-flex">
              {profile.full_name}
            </span>
            <form action={signOutAction}>
              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <ChatWorkspace userId={userId} userName={profile.full_name} />
    </main>
  );
}
