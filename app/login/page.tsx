import Link from "next/link";
import { signInAction } from "@/app/actions/auth";

type LoginPageProps = { searchParams: Promise<{ error?: string; password_updated?: string }> };

const errorMessages: Record<string, string> = {
  invalid: "Informe um e-mail válido e sua senha.",
  credentials: "Não foi possível autenticar. Confira suas credenciais.",
  pending: "Sua conta ainda não foi liberada pela equipe de TI.",
  invite_expired: "O convite expirou ou já foi utilizado. Solicite à TI o reenvio do convite.",
  link_invalid: "O link expirou ou é inválido. Solicite um novo link.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, password_updated } = await searchParams;
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Comunicação interna</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Entrar no ChatApp</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Acesso restrito a funcionários previamente cadastrados e liberados pela TI.</p>
        {!isConfigured ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Integração ainda não configurada. Defina a URL e a chave publicável do Supabase nas variáveis de ambiente.</div>
        ) : (
          <form action={signInAction} className="mt-8 space-y-5">
            {error && errorMessages[error] ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessages[error]}</p> : null}
            {password_updated === "1" ? <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Senha atualizada. Entre com sua nova senha.</p> : null}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">E-mail corporativo</span>
              <input name="email" type="email" autoComplete="username" required maxLength={254} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="nome@empresa.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
              <input name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="Sua senha" />
            </label>
            <div className="-mt-2 text-right"><Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">Esqueceu sua senha?</Link></div>
            <button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">Entrar</button>
          </form>
        )}
        <p className="mt-8 text-center text-xs text-slate-500">Ambiente de desenvolvimento com dados fictícios. Cadastro público desabilitado por requisito.</p>
        <Link href="/" className="mt-4 block text-center text-xs font-medium text-blue-700 hover:underline">Voltar ao início</Link>
      </section>
    </main>
  );
}
