"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCompletePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando seu acesso com segurança...");

  useEffect(() => {
    let active = true;
    async function completeAuth() {
      const queryParams = new URLSearchParams(window.location.search);
      const nextParam = queryParams.get("next") ?? "/update-password";
      const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/update-password";
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const supabase = createClient();

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!active) return;
        if (error) {
          setMessage("O convite expirou ou não pôde ser confirmado. Solicite à TI um novo convite.");
          return;
        }
        router.replace(next);
        return;
      }

      const code = queryParams.get("code");
      const tokenHash = queryParams.get("token_hash");
      const type = queryParams.get("type");
      if (code || tokenHash) {
        const query = new URLSearchParams();
        if (code) query.set("code", code);
        if (tokenHash) query.set("token_hash", tokenHash);
        if (type) query.set("type", type);
        query.set("next", next);
        router.replace("/auth/confirm?" + query.toString());
        return;
      }

      setMessage("O link expirou, já foi utilizado ou está incompleto. Solicite à TI o reenvio do convite.");
    }
    void completeAuth();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">ChatApp</p>
        <h1 className="mt-3 text-xl font-bold text-slate-950">Confirmando convite</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <a href="/login" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">Ir para o login</a>
      </section>
    </main>
  );
}
