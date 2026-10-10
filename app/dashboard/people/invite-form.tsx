"use client";

import { useActionState } from "react";
import { createInvitation } from "@/lib/actions";

type ProjectOption = { id: string; name: string };
export function InviteForm({ projects }: { projects: ProjectOption[] }) {
  const [state, action, pending] = useActionState(createInvitation, {} as { inviteUrl?: string; error?: string });
  return <form action={action} className="form-grid">
    <label className="field">Nome<input name="name" required minLength={2} maxLength={160} autoComplete="name"/></label>
    <label className="field">E-mail<input name="email" type="email" required maxLength={320} autoComplete="email"/></label>
    <fieldset className="field wide assignment-options"><legend>Projetos atribuídos</legend>{projects.map((project)=><label key={project.id}><input type="checkbox" name="projectIds" value={project.id}/>{project.name}</label>)}</fieldset>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.inviteUrl && <p className="form-success wide" role="status">Convite criado. Envie este link à pessoa dentro de sete dias:<output className="invite-url">{state.inviteUrl}</output></p>}
    <button className="btn" type="submit" disabled={pending}>{pending ? "Criando convite…" : "Criar convite"}</button>
  </form>;
}
