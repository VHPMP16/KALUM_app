import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function UpdatePasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Comunicação interna</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">Definir senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Crie uma senha com pelo menos 12 caracteres para acessar o ChatApp.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error === "invalid" ? "As senhas devem ser iguais e ter pelo menos 12 caracteres." : "Não foi possível atualizar a senha. Solicite um novo link e tente novamente."}</p> : null}
        <form action={updatePasswordAction} className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Nova senha</span><input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Confirmar nova senha</span><input name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Salvar nova senha</button>
        </form>
        <Link href="/login" className="mt-6 block text-center text-sm font-medium text-blue-700 hover:underline">Voltar ao login</Link>
      </section>
    </main>
  );
}
