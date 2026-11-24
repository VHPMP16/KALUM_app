import { redirect } from "next/navigation";

export default function HomePage() {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (isConfigured) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Ambiente de desenvolvimento</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">ChatApp</h1>
        <p className="mt-4 leading-7 text-slate-600">
          A base de dados e as políticas de segurança foram preparadas. Para habilitar o login, configure a URL
          e a chave publicável do Supabase no ambiente local.
        </p>
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Utilize somente contas, mensagens e arquivos fictícios durante o desenvolvimento.
        </div>
      </section>
    </main>
  );
}
