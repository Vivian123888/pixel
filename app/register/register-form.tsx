"use client";

import { useActionState } from "react";
import { registerAccount } from "@/lib/actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAccount, {});
  return <form action={action} className="form-grid">
    {state.error && <p className="form-error wide" role="alert">{state.error}</p>}
    <label className="field wide">Nome completo<input name="name" autoComplete="name" required minLength={2} maxLength={160}/></label>
    <label className="field wide">E-mail<input name="email" type="email" autoComplete="email" required maxLength={320}/></label>
    <label className="field wide">Código compartilhado<input name="signupCode" type="password" autoComplete="off" required maxLength={256}/></label>
    <label className="field wide">Senha<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72}/></label>
    <label className="field wide">Confirme a senha<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={72}/></label>
    <button className="btn" type="submit" disabled={pending}>{pending ? "Criando conta…" : "Criar conta"}</button>
  </form>;
}
