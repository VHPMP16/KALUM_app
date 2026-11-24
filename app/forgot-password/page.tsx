import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";

type Props = { searchParams: Promise<{ error?: string; sent?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Comunicação interna</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Informe seu e-mail corporativo. Se houver uma conta elegível, enviaremos um link para redefinir a senha.</p>
        {sent === "1" ? (
          <p role="status" className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Se o endereço estiver cadastrado, você receberá um e-mail com as instruções. Verifique também o spam.</p>
        ) : (
          <form action={forgotPasswordAction} className="mt-6 space-y-4">
            {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error === "invalid" ? "Informe um e-mail válido." : error === "configuration" ? "Não foi possível determinar o endereço seguro da aplicação." : error === "rate_limit" ? "O serviço de e-mail atingiu o limite temporário de envios. Aguarde a renovação do limite ou tente novamente mais tarde. Para evitar essa limitação, a equipe precisa configurar um servidor SMTP próprio." : error === "provider_restriction" ? "O serviço de e-mail atual só permite enviar para endereços autorizados da equipe do projeto. Configure um servidor SMTP próprio para enviar aos funcionários." : "Não foi possível solicitar o link agora. Verifique a configuração de e-mail ou tente novamente mais tarde."}</p> : null}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">E-mail corporativo</span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="nome@empresa.com" />
            </label>
            <button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Enviar link de recuperação</button>
          </form>
        )}
        <Link href="/login" className="mt-6 block text-center text-sm font-medium text-blue-700 hover:underline">Voltar ao login</Link>
      </section>
    </main>
  );
}
