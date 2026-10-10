import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=1");
    throw error;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <div className="brand-mark">P</div><p className="eyebrow">PIXEL HUB</p><h1>Entrar no espaço de trabalho</h1>
    {query.error && <p className="form-error" role="alert">E-mail ou senha inválidos. Confira os dados e tente novamente.</p>}
    {query.invited && <p className="form-success">Conta ativada. Entre com o e-mail e a senha que você criou.</p>}
    {query.setup && <p className="form-success">Conta administrativa criada. Entre para continuar.</p>}
    {query.blocked && <p className="form-error" role="alert">Esta conta não está ativa. Fale com a administração do PIXEL.</p>}
    <form action={login} className="form-grid">
      <label className="field wide">E-mail<input name="email" type="email" autoComplete="username" required/></label>
      <label className="field wide">Senha<input name="password" type="password" autoComplete="current-password" required minLength={12}/></label>
      <button className="btn" type="submit">Entrar</button>
    </form>
    <p className="auth-foot">Primeiro acesso administrativo? <a href="/setup">Ativar conta</a></p>
  </section></main>;
}
