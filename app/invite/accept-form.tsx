"use client";

import { useActionState } from "react";
import { acceptInvitation } from "@/lib/actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitation, {} as { error?: string });
  return <form action={action} className="form-grid">
    <input type="hidden" name="token" value={token}/>
    <label className="field wide">Crie sua senha<input name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password"/><small>Use pelo menos 12 caracteres. Não compartilhe sua senha.</small></label>
    <label className="field wide">Confirme a senha<input name="confirmPassword" type="password" required minLength={12} maxLength={72} autoComplete="new-password"/></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="btn" type="submit" disabled={pending}>{pending ? "Ativando conta…" : "Ativar minha conta"}</button>
  </form>;
}
