import Link from "next/link";
import { eq, asc, isNotNull } from "drizzle-orm";
import { Camera, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { updateMemberProfile } from "@/lib/actions";
import { ProfileProjectPicker } from "./project-picker";

export const dynamic = "force-dynamic";
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const viewer = await requireUser();
  const [{ profile }, availableProjects, query] = await Promise.all([
    getDb().select({ name: users.name, email: users.email, pixelRole: users.pixelRole, enteredYear: users.enteredYear, profileProjectId: users.profileProjectId, hasPhoto: isNotNull(users.profilePhotoData) }).from(users).where(eq(users.id, viewer.id)).limit(1).then((rows) => ({ profile: rows[0] })),
    getDb().select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name)).limit(500),
    searchParams,
  ]);
  if (!profile) return <div className="card empty"><UserRound size={24}/><strong>Perfil não encontrado</strong></div>;
  return <>
    <div className="workspace-breadcrumb"><Link href="/dashboard">PIXEL Hub</Link><span>·</span><span>Meu perfil</span></div>
    <div className="heading"><p className="eyebrow">MINHA JORNADA</p><h1>Meu perfil no PIXEL</h1><p>Atualize as informações que aparecem no diretório interno e, se permitido, na página pública.</p></div>
    {query.saved === "1" && <p className="form-success" role="status">Perfil salvo.</p>}
    <section className="card form-card profile-card"><div className="profile-photo-preview">{profile.hasPhoto ? <img src={`/api/profile-photo/${viewer.id}`} alt="" /> : <UserRound size={28}/>}</div><form action={updateMemberProfile} className="form-grid" encType="multipart/form-data">
      <label className="field wide">Nome e sobrenome<input name="name" required minLength={2} maxLength={160} defaultValue={profile.name}/></label>
      <label className="field wide">E-mail<input name="email" type="email" required maxLength={320} defaultValue={profile.email}/></label>
      <label className="field">Cargo no PIXEL<input name="pixelRole" maxLength={100} placeholder="Ex.: Bolsista, pesquisadora, atleta" defaultValue={profile.pixelRole ?? ""}/></label>
      <label className="field">Ano de entrada<input name="enteredYear" type="number" min={1990} max={new Date().getFullYear()} defaultValue={profile.enteredYear ?? ""}/></label>
      <div className="field wide"><ProfileProjectPicker projects={availableProjects} selectedId={profile.profileProjectId}/></div>
      <label className="field wide"><span><Camera size={15}/> Foto de perfil (PNG, JPG ou WebP; até 1 MB)</span><input name="photo" type="file" accept="image/png,image/jpeg,image/webp"/></label>
      <button className="btn" type="submit">Salvar perfil</button>
    </form></section>
  </>;
}

