
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import {
  Music2,
  Share2,
  Images,
  Quote,
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";

type WidgetItem = {
  id: string;
  name: string;
  enabled: boolean;
};

type ProfileLink = {
  id: number;
  title: string;
  url: string;
};

type ProfileTheme = {
  title?: string;
  background?: string;
  accent?: string;
  textColor?: string;
  radius?: number;
};

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  wallpaper_url: string | null;
  wallpaper_mode: string | null;
  theme: ProfileTheme | null;
  widgets: WidgetItem[] | null;
  links: ProfileLink[] | null;
};

const defaultTheme: Required<ProfileTheme> = {
  title: "O teu mundo. As tuas regras.",
  background: "#F5F3FF",
  accent: "#7C3AED",
  textColor: "#29243B",
  radius: 22,
};

const widgetIcons: Record<string, typeof Music2> = {
  music: Music2,
  socials: Share2,
  gallery: Images,
  quote: Quote,
};

function validExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username || "");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPublicProfile() {
      if (!supabase || !username) {
        setErrorMessage("Não foi possível carregar este perfil.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, bio, avatar_url, wallpaper_url, wallpaper_mode, theme, widgets, links"
          )
          .eq("username", username)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (!data) {
          setProfile(null);
          setErrorMessage(
            "Este perfil não existe ou ainda não foi publicado."
          );
        } else {
          setProfile(data as ProfileData);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil público MEEMU:", error);

        if (!cancelled) {
          setErrorMessage(
            "Não foi possível carregar este perfil. Tenta novamente."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPublicProfile();

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <main className="site-shell">
        <div className="workspace">
          <p>A preparar este universo...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="site-shell">
        <div className="workspace">
          <div className="public-profile-message">
            <h1>Perfil indisponível</h1>
            <p>{errorMessage || "Não encontrámos este perfil."}</p>
            <a href="/">
              <ArrowLeft size={16} />
              Voltar ao MEEMU
            </a>
          </div>
        </div>
      </main>
    );
  }

  const theme = {
    ...defaultTheme,
    ...(profile.theme || {}),
  };

  const radius = Math.min(36, Math.max(8, Number(theme.radius) || 22));

  const enabledWidgets = Array.isArray(profile.widgets)
    ? profile.widgets.filter(
        (widget) =>
          widget &&
          typeof widget.id === "string" &&
          typeof widget.name === "string" &&
          widget.enabled
      )
    : [];

  const links = Array.isArray(profile.links)
    ? profile.links.filter(
        (link) =>
          link &&
          typeof link.title === "string" &&
          link.title.trim() &&
          typeof link.url === "string" &&
          validExternalUrl(link.url)
      )
    : [];

  const fullWallpaper = profile.wallpaper_mode === "full";

  const pageStyle = {
    "--accent": theme.accent,
    "--primary": theme.accent,
    "--foreground": theme.textColor,
    "--profile-radius": `${radius}px`,
  } as CSSProperties;

  const identityStyle = {
    borderRadius: `${radius}px`,
  };

  const avatarLetter = (
    profile.display_name || profile.username || "m"
  ).charAt(0).toLowerCase();

  return (
    <main
      className={`site-shell ${fullWallpaper ? "wallpaper-full" : ""}`}
      style={pageStyle}
    >
      <header className="topbar">
        <a className="brand" href="/" aria-label="MEEMU">
          <span className="brand-mark">m.</span>
          <span>
            meemu<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="topbar-center">
          <span className="live-dot" />
          PERFIL PÚBLICO
        </div>

        <a className="top-action" href="/">
          <ArrowLeft size={15} />
          MEEMU
        </a>
      </header>

      <section className="workspace">
        <aside className="identity-panel" style={identityStyle}>
          <div
            className="wallpaper-art"
            style={
              profile.wallpaper_url
                ? {
                    backgroundImage: `url("${profile.wallpaper_url}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className="art-grain" />
            <span className="art-number">01 / MEEMU</span>
            <span className="art-vertical">YOUR LITTLE UNIVERSE</span>
            <div className="art-orbit" />
            <div className="art-silhouette">
              <div className="silhouette-head" />
              <div className="silhouette-body" />
            </div>
            <div className="art-caption">MY<br />WORLD.</div>
            <div className="art-bottom-line" />
          </div>

          <div className="identity-overlay">
            <div className="eyebrow">
              <span />
              <span className="eyebrow-line" />
              静 · MEEMU
            </div>

            <div className="identity-copy">
              <div className="public-avatar">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`Foto de ${profile.display_name || profile.username}`}
                  />
                ) : (
                  <span>{avatarLetter}</span>
                )}
              </div>

              <p className="handle">@{profile.username}</p>

              <h1>
                {profile.display_name || "Utilizador MEEMU"}
              </h1>

              <h2 className="public-profile-title">
                {theme.title}
              </h2>

              {profile.bio && (
                <p className="public-profile-bio">{profile.bio}</p>
              )}
            </div>

            <div className="identity-footer">
              <span>
                <span className="tiny-dot" />
                UM UNIVERSO SÓ TEU
              </span>
              <span>MEEMU ✳</span>
            </div>
          </div>
        </aside>

        <section className="widgets-area">
          <div className="profile-heading">
            <div>
              <div className="section-kicker">
                PROFILE <span>✳</span>
              </div>
              <h2>
                O meu <span>universo.</span>
              </h2>
              <p>Um espaço que representa quem sou.</p>
            </div>
          </div>

          <div className="widget-grid">
            {enabledWidgets.map((widget, index) => {
              const Icon = widgetIcons[widget.id] || Share2;

              return (
                <article
                  className={`widget ${widget.id}-widget`}
                  key={widget.id}
                  style={{ borderRadius: `${radius}px` }}
                >
                  <div className="widget-top">
                    <span className="widget-label">
                      <Icon size={15} />
                      {widget.name}
                    </span>
                    <span className="widget-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {widget.id === "music" && (
                    <div className="public-empty-widget">
                      <div className="album-art">
                        <Music2 size={30} />
                        <span>MEEMU<br />MUSIC</span>
                      </div>
                      <div className="track-info">
                        <h3>Nenhuma música adicionada</h3>
                        <p>O espaço musical deste perfil.</p>
                      </div>
                    </div>
                  )}

                  {widget.id === "socials" && (
                    links.length > 0 ? (
                      <div className="social-grid">
                        {links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Share2 size={15} />
                            <span>{link.title}</span>
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="public-widget-empty">
                        Ainda não foram adicionadas redes sociais.
                      </p>
                    )
                  )}

                  {widget.id === "gallery" && (
                    <div className="public-gallery-empty">
                      <ImageIcon size={27} />
                      <p>A galeria ainda não tem fotografias.</p>
                    </div>
                  )}

                  {widget.id === "quote" && (
                    <div className="public-quote-empty">
                      <Quote size={25} />
                      <p>Um espaço para uma frase que te represente.</p>
                    </div>
                  )}

                  {!["music", "socials", "gallery", "quote"].includes(
                    widget.id
                  ) && (
                    <p className="public-widget-empty">
                      Este widget ainda não tem conteúdo.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          <footer className="workspace-footer">
            <span>
              <span className="tiny-dot" />
              FEITO À TUA MANEIRA
            </span>
            <span>
              MEEMU <span className="footer-star">✳</span>
            </span>
            <span>© 2026</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
