import Link from "next/link";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";
export default function RegisterPage() {
  return <main className="auth-page"><section className="auth-card">
    <div className="brand-mark">P</div><p className="eyebrow">PIXEL HUB</p><h1>Criar conta</h1>
    <p>Use o código compartilhado pela equipe para cadastrar seu próprio acesso.</p>
    <RegisterForm/>
    <p className="auth-foot">Já tem conta? <Link href="/login">Entrar</Link></p>
  </section></main>;
}
