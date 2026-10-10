import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";
export default async function SetupPage() {
  const [admin] = await getDb().select({ id: users.id }).from(users).where(eq(users.primaryRole, "ADMIN")).limit(1);
  const configuredEmail = process.env.PIXEL_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const configured = Boolean(configuredEmail && process.env.PIXEL_ADMIN_SETUP_TOKEN && process.env.AUTH_SECRET);
  return <main className="auth-page"><section className="auth-card">
    <div className="brand-mark">P</div><p className="eyebrow">CONFIGURAÇÃO SEGURA</p><h1>Ativar conta administrativa</h1>
    {admin ? <><p>A administração inicial já foi ativada.</p><Link className="btn" href="/login">Ir para entrar</Link></>
      : configured ? <><p>Esta etapa está disponível somente para o e-mail administrativo configurado. Defina sua própria senha para concluir a ativação.</p><SetupForm/>
        <p className="auth-foot">Depois da ativação, remova <code>PIXEL_ADMIN_SETUP_TOKEN</code> das variáveis do Vercel.</p></>
      : <><p>Finalize a configuração no Vercel antes de ativar o primeiro acesso.</p><p className="form-help">Configure <code>PIXEL_ADMIN_EMAIL</code>, <code>PIXEL_ADMIN_SETUP_TOKEN</code> e <code>AUTH_SECRET</code> em Production e Preview.</p><Link href="/login">Voltar para entrar</Link></>}
  </section></main>;
}
