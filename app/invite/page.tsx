import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { userInvites } from "@/lib/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import Link from "next/link";
import { AcceptInviteForm } from "./accept-form";

export const dynamic = "force-dynamic";
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const safeToken = /^[A-Za-z0-9_-]{32,128}$/.test(token);
  const [invite] = safeToken ? await getDb().select({ id: userInvites.id, name: userInvites.name, email: userInvites.email })
    .from(userInvites).where(and(eq(userInvites.tokenHash, createHash("sha256").update(token).digest("hex")), isNull(userInvites.acceptedAt), gt(userInvites.expiresAt, new Date()))).limit(1) : [];
  return <main className="auth-page"><section className="auth-card">
    <div className="brand-mark">P</div><p className="eyebrow">CONVITE PIXEL HUB</p>
    {invite ? <><h1>Bem-vindo(a), {invite.name}</h1><p>Ative sua conta para trabalhar nos projetos que foram atribuídos ao seu e-mail.</p><p className="invite-email">{invite.email}</p><AcceptInviteForm token={token}/></>
      : <><h1>Convite inválido</h1><p>Este link expirou ou já foi utilizado. Peça à administração do PIXEL um novo convite.</p><Link className="btn" href="/login">Ir para entrar</Link></>}
  </section></main>;
}
