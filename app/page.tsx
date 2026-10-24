"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  LockKeyhole,
  Palette,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./home.css";

export default function HomePage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setMessage("");

    if (!supabase) {
      setMessage(
        "A ligação ao serviço ainda não está configurada. Verifique as variáveis do Supabase no Vercel."
      );
      return;
    }

    setBusy(true);

    try {
      const cleanEmail = email.trim();

      if (mode === "signup") {
        const cleanUsername = username.trim();

        if (!cleanUsername) {
          setMessage("Digite o nome que pretende usar no MEEMU.");
          setBusy(false);
            async function handlePasswordReset() {
    if (busy) return;

    setMessage("");

    if (!supabase) {
      setMessage(
        "O serviço está indisponível. Tente novamente mais tarde."
      );
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Digite o seu email no campo acima.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error("[MEEMU password reset]", error.message);

        setMessage(
          "Não foi possível enviar o email de recuperação. Tente novamente."
        );
        return;
      }

      setMessage(
        "Se existir uma conta com esse email, enviaremos um link para redefinir a senha. Verifique também o spam."
      );
    } catch {
      setMessage(
        "Ocorreu um problema de ligação. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: cleanUsername,
              username: cleanUsername,
            },
          },
        });

        
if (error) {
  console.error("[MEEMU login]", {
    message: error.message,
    status: error.status,
    code: error.code,
  });

  const errorText = error.message.toLowerCase();

  if (errorText.includes("email not confirmed")) {
    setMessage(
      "Confirme o seu email antes de entrar. Verifique a sua caixa de entrada."
    );
  } else if (errorText.includes("invalid login credentials")) {
    setMessage(
      "Email ou senha incorretos. Verifique os dados ou recupere a sua senha."
    );
  } else {
    setMessage(`Não foi possível entrar: ${error.message}`);
  }

  return;
}

        if (data.session) {
          router.push("/editor");
          router.refresh();
          return;
        }

        setMessage(
          "Conta criada! Verifique a sua caixa de email e confirme o endereço antes de entrar."
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
  console.error("[MEEMU signup]", {
    message: error.message,
    status: error.status,
    code: error.code,
  });

  setMessage(
    `Erro no cadastro: ${error.message}`
  );

  return;
}

      router.push("/editor");
      router.refresh();
    } catch {
      setMessage(
        "Ocorreu um problema de ligação. Tente novamente dentro de instantes."
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

        <div className="home-nav-right">
          <span className="home-nav-caption">
            Seu espaço, suas regras.
          </span>
          <button
            className="home-nav-login"
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
              document
                .getElementById("acessar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Entrar <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-copy">
          <div className="home-eyebrow">
            <Sparkles size={15} />
            SUA IDENTIDADE DIGITAL, DO SEU JEITO
          </div>

          <h1>
            A internet tem
            <br />
            seu espaço.
            <br />
            <span>Deixe sua marca.</span>
          </h1>

          <p className="home-description">
            Crie uma página que tenha a sua cara. Misture fotos, música,
            widgets, frases e tudo aquilo que faz você ser você.
          </p>

          <div className="home-benefits">
            <div>
              <Check size={16} /> Personalização de verdade
            </div>
            <div>
              <Check size={16} /> Seu universo em uma página
            </div>
            <div>
              <Check size={16} /> Compartilhe com quem quiser
            </div>
          </div>

          <div className="home-social-proof">
            <div className="home-avatar-stack">
              <span>✦</span>
              <span>♡</span>
              <span>☾</span>
            </div>
            <span>
              Um espaço para ser <strong>100% você.</strong>
            </span>
          </div>
        </div>

        <div className="home-showcase">
          <div className="showcase-orbit orbit-one" />
          <div className="showcase-orbit orbit-two" />

          <div className="showcase-floating float-top">
            <Palette size={18} />
            <span>Seu estilo</span>
            <span className="float-dots">•••</span>
          </div>

          <div className="showcase-profile">
            <div className="showcase-cover">
              <span className="cover-star star-one">✦</span>
              <span className="cover-star star-two">✧</span>
              <span className="cover-label">MY LITTLE UNIVERSE</span>
            </div>

            <div className="showcase-avatar">☁️</div>

            <div className="showcase-profile-body">
              <div className="showcase-name-row">
                <div>
                  <h3>luna.exe</h3>
                  <span className="showcase-handle">@luna</span>
                </div>
                <span className="showcase-online">
                  <span /> online
                </span>
              </div>

              <p className="showcase-bio">
                vivendo entre pixels, música e sonhos ♡
              </p>

              <div className="showcase-tags">
                <span>✧ dreamy</span>
                <span>🎧 music lover</span>
                <span>☁️ daydreamer</span>
              </div>

              <div className="showcase-widget-grid">
                <div className="showcase-widget music-widget">
                  <div className="music-icon">♫</div>
                  <div>
                    <strong>my playlist</strong>
                    <span>minha vibe de hoje</span>
                  </div>
                  <span className="music-play">▶</span>
                </div>

                <div className="showcase-widget quote-widget">
                  <span>✦ UM PENSAMENTO</span>
                  <p>“floresça no seu tempo.”</p>
                </div>

                <div className="showcase-widget photo-widget">
                  <ImageIcon size={19} />
                  <span>meus momentos</span>
                  <Heart size={16} />
                </div>
              </div>

              <div className="showcase-footer">
                <span>
                  <Eye size={14} /> meu cantinho na internet
                </span>
                <span>feito com ♡</span>
              </div>
            </div>
          </div>

          <div className="showcase-floating float-bottom">
            <WandSparkles size={18} />
            <span>Feito por você</span>
            <span className="float-sparkle">✦</span>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-section-heading">
          <span>MAIS QUE UM LINK NA BIO</span>
          <h2>Seu mundo merece mais espaço.</h2>
          <p>
            Monte seu cantinho com os elementos que fazem sentido para você.
          </p>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-card">
            <span className="feature-icon purple">
              <Palette size={22} />
            </span>
            <h3>Do seu jeito</h3>
            <p>
              Personalize cores, wallpapers, imagens e a atmosfera inteira
              da sua página.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="feature-icon blue">
              <LayoutGrid size={22} />
            </span>
            <h3>Seu universo</h3>
            <p>
              Organize widgets, músicas, fotos, links e conteúdos em uma
              composição única.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="feature-icon pink">
              <Heart size={22} />
            </span>
            <h3>Sua identidade</h3>
            <p>
              Transforme sua personalidade em uma página que tenha a sua
              assinatura.
            </p>
          </article>
        </div>
      </section>

      <section className="home-signup-section" id="acessar">
        <div className="home-signup-copy">
          <span className="home-eyebrow">
            <Sparkles size={15} /> SEU PRÓXIMO CAPÍTULO
          </span>
          <h2>Vamos criar seu universo?</h2>
          <p>
            Comece a construir um espaço que seja verdadeiramente seu.
          </p>
        </div>

        <div className="home-auth-card">
          <div className="auth-tabs">
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              type="button"
              disabled={busy}
            >
              Criar conta
            </button>

            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              type="button"
              disabled={busy}
            >
              Entrar
            </button>
          </div>

          <div className="auth-heading">
            <h3>
              {mode === "signup"
                ? "Crie seu MEEMU ✨"
                : "Que bom ter você de volta!"}
            </h3>
            <p>
              {mode === "signup"
                ? "Seu espaço pessoal começa aqui."
                : "Entre para continuar de onde parou."}
            </p>
          </div>

          <form className="home-auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label>
                Como quer ser chamado?
                <span className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Seu nome ou apelido"
                    autoComplete="nickname"
                    required
                    disabled={busy}
                  />
                </span>
              </label>
            )}

            <label>
              E-mail
              <span className="auth-input-wrap">
                <span className="at-symbol">@</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </span>
            </label>

            <label>
              Senha
              <span className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  minLength={8}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  disabled={busy}
                />
              </span>
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={busy}
                style={{
                  display: "block",
                  width: "100%",
                  margin: "4px 0 12px",
                  padding: "8px 0",
                  border: "none",
                  background: "transparent",
                  color: "#7c6ee6",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "right",
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Aguarde..." : "Esqueci minha senha"}
              </button>
            )}
            <button
              className="auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Aguarde..."
                : mode === "signup"
                  ? "Criar meu espaço"
                  : "Entrar no MEEMU"}
              {!busy && <ArrowRight size={17} />}
            </button>

            {message && (
              <p className="auth-message" role="status" aria-live="polite">
                {message}
              </p>
            )}
          </form>

          <p className="auth-terms">
            Ao continuar, você concorda em usar o MEEMU com respeito e
            responsabilidade.
          </p>
        </div>
      </section>

      <footer className="home-footer">
        <a className="home-brand footer-brand" href="/">
          <span className="home-brand-icon">
            <Sparkles size={18} />
          </span>
          <span>
            mee<span className="home-brand-accent">mu</span>
          </span>
        </a>

        <span>Seu espaço. Sua identidade. Seu universo.</span>
        <span>© {new Date().getFullYear()} MEEMU</span>
      </footer>
    </main>
  );
}
