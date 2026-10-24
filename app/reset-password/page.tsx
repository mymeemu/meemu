"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../home.css";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage(
        "O serviço está indisponível. Tente novamente mais tarde."
      );
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(
          "Não foi possível validar o link. Solicite um novo email de recuperação."
        );
        return;
      }

      if (data.session) {
        setReady(true);
      } else {
        setMessage(
          "Este link é inválido ou expirou. Volte à página inicial e solicite uma nova recuperação de senha."
        );
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || success) return;

    setMessage("");

    if (!supabase) {
      setMessage("O serviço está indisponível.");
      return;
    }

    if (!ready) {
      setMessage(
        "O link de recuperação não está válido. Solicite um novo email."
      );
      return;
    }

    if (password.length < 8) {
      setMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("[MEEMU update password]", error.message);

        setMessage(
          "Não foi possível alterar a senha. Solicite um novo link de recuperação e tente novamente."
        );
        return;
      }

      setSuccess(true);
      setMessage(
        "Senha alterada com sucesso! Já pode voltar ao MEEMU."
      );
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage(
        "Ocorreu um problema de ligação. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="home-page">
      <nav className="home-nav">
        <a className="home-brand" href="/" aria-label="MEEMU início">
          <span className="home-brand-icon">
            <Sparkles size={23} />
          </span>

          <span>
            mee<span className="home-brand-accent">mu</span>
          </span>
        </a>
      </nav>

      <section className="home-signup-section">
        <div className="home-signup-copy">
          <span className="home-eyebrow">
            <Sparkles size={15} /> SUA CONTA, SUA SEGURANÇA
          </span>

          <h2>Uma nova senha, um novo começo.</h2>

          <p>
            Escolha uma senha segura para voltar ao seu universo MEEMU.
          </p>
        </div>

        <div className="home-auth-card">
          <div className="auth-heading">
            <h3>
              {success ? "Tudo certo! ✨" : "Redefinir senha"}
            </h3>

            <p>
              {success
                ? "A sua senha foi atualizada."
                : "Crie uma nova senha para a sua conta."}
            </p>
          </div>

          {!success && (
            <form
              className="home-auth-form"
              onSubmit={handleSubmit}
            >
              <label>
                Nova senha

                <span className="auth-input-wrap">
                  <LockKeyhole size={17} />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={busy || !ready}
                  />
                </span>
              </label>

              <label>
                Confirmar nova senha

                <span className="auth-input-wrap">
                  <LockKeyhole size={17} />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Digite a senha novamente"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={busy || !ready}
                  />
                </span>
              </label>

              <button
                className="auth-submit"
                type="submit"
                disabled={busy || !ready}
              >
                {busy ? "A guardar..." : "Alterar minha senha"}

                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          )}

          {message && (
            <p
              className="auth-message"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <a
            href="/"
            style={{
              display: "block",
              marginTop: "20px",
              textAlign: "center",
              color: "#7c6ee6",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Voltar ao MEEMU
          </a>
        </div>
      </section>

      <footer className="home-footer">
        <span>Seu espaço. Sua identidade. Seu universo.</span>
        <span>© {new Date().getFullYear()} MEEMU</span>
      </footer>
    </main>
  );
}
