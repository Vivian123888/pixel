import Link from "next/link";
import { eq } from "drizzle-orm";
import { Eye, Globe2 } from "lucide-react";
import { updatePublicVisibility } from "@/lib/actions";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { publicVisibility } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export default async function PublicSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireUser();
  const [settings] = await getDb().select().from(publicVisibility).where(eq(publicVisibility.id, 1)).limit(1);
  const query = await searchParams;
  const options = [
    ["showActiveMembers", "Membros ativos", "Nome, cargo, ano de entrada e projeto dos integrantes ativos."],
    ["showFormerMembers", "Antigos membros", "Nomes e projeto/afiliação registrados na planilha do grupo."],
    ["showPortfolio", "Portfólio", "Projetos cadastrados e seus resumos."],
    ["showAwards", "Prêmios e conquistas", "Conquistas e prêmios registrados no módulo de Gamificação."],
  ] as const;
  return <>
    <div className="workspace-breadcrumb"><Link href="/dashboard">PIXEL Hub</Link><span>·</span><span>Visibilidade pública</span></div>
    <div className="heading"><p className="eyebrow">PÁGINA PÚBLICA</p><h1>Escolher informações públicas</h1><p>Defina o que visitantes sem login podem ver. Contas, e-mails e dados internos do grupo continuam protegidos pelo login.</p></div>
    {query.saved === "1" && <p className="form-success" role="status">Preferências públicas salvas.</p>}
    <section className="card form-card"><h2><Globe2 size={18}/> Seções visíveis sem login</h2><form action={updatePublicVisibility} className="visibility-form">
      {options.map(([name, title, description]) => <label className="visibility-option" key={name}><input type="checkbox" name={name} defaultChecked={settings?.[name] ?? true}/><span><strong>{title}</strong><small>{description}</small></span><Eye size={17}/></label>)}
      <button className="btn" type="submit">Salvar visibilidade</button><Link href="/" target="_blank">Ver página pública ↗</Link>
    </form></section>
  </>;
}

