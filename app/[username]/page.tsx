
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Music2,
  Share2,
  Images,
  Quote,
  ExternalLink,
  ArrowLeft,
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

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  wallpaper_url: string | null;
  wallpaper_mode: string | null;
  theme: {
    title?: string;
    background?: string;
    accent?: string;
    textColor?: string;
    radius?: number;
  } | null;
  widgets: WidgetItem[] | null;
  links: ProfileLink[] | null;
};

const defaultTheme = {
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
          setErrorMessage("Este perfil não existe ou ainda não foi publicado.");
          setProfile(null);
        } else {
          setProfile(data as ProfileData);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil público MEEMU:", error);

        if (!cancelled) {
          setErrorMessage("Não foi possível carregar este perfil. Tenta novamente.");
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
          <div className="profile-widget">
            <h1>Perfil indisponível</h1>
            <p>{errorMessage || "Não encontrámos este perfil."}</p>
            <a href="/">
              <ArrowLeft size={16} /> Voltar ao MEEMU
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

  const enabledWidgets = Array.isArray(profile.widgets)
    ? profile.widgets.filter((widget) => widget && widget.enabled)
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

  return (
    <main
      className={`site-shell ${fullWallpaper ? "wallpaper-full" : ""}`}
      style={
        {
          "--profile-background": theme.background,
          "--profile-accent": theme.accent,
          "--profile-text": theme.textColor,
          "--profile-radius": `${theme.radius}px`,
        } as React.CSSProperties
      }
    >
      <header className="topbar">
        <a className="brand" href="/" aria-label="MEEMU">
          <span className="brand-mark">m.</span>
          <span>meemu<span>.</span></span>
        </a>

        <div className="topbar-actions">
          <span className="profile-public-label">
            <span /> PERFIL PÚBLICO
          </span>
        </div>
      </header>

      <section className="workspace">
        <div
          className={`identity-panel ${fullWallpaper ? "wallpaper-full" : ""}`}
          style={{
            backgroundColor: theme.background,
            color: theme.textColor,
            borderRadius: theme.radius,
          }}
        >
          {profile.wallpaper_url && (
            <div
              className="wallpaper-art"
              style={{
                backgroundImage: `url("${profile.wallpaper_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          <div className="identity-overlay">
            <span className="identity-mark">静 · MEEMU</span>
            <span className="identity-number">01</span>
          </div>

          <div className="identity-content">
            <div
              className="identity-avatar"
              style={{ backgroundColor: theme.accent }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`Foto de ${profile.display_name || profile.username}`}
                />
              ) : (
                <span>
                  {(profile.display_name || profile.username || "m")
                    .charAt(0)
                    .toLowerCase()}
                </span>
              )}
            </div>

            <div className="identity-details">
              <h1>{profile.display_name || "Utilizador MEEMU"}</h1>

              <p className="identity-handle">
                @{profile.username}
              </p>

              <h2>{theme.title}</h2>

              {profile.bio && (
                <p className="identity-bio">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        <section className="widgets-area">
          <div className="widget-grid">
            {enabledWidgets.map((widget) => {
              const Icon = widgetIcons[widget.id] || Share2;

              return (
                <article
                  className={`profile-widget ${widget.id}-widget`}
                  key={widget.id}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.textColor,
                    borderRadius: theme.radius,
                  }}
                >
                  <div className="profile-widget-heading">
                    <span
                      className="profile-widget-icon"
                      style={{ color: theme.accent }}
                    >
                      <Icon size={19} />
                    </span>

                    <h3>{widget.name}</h3>
                  </div>

                  <p className="profile-widget-placeholder">
                    Este espaço faz parte do universo de {profile.display_name || profile.username}.
                  </p>
                </article>
              );
            })}

            {links.length > 0 && (
              <article
                className="profile-widget socials-widget"
                style={{
                  backgroundColor: theme.background,
                  color: theme.textColor,
                  borderRadius: theme.radius,
                }}
              >
                <div className="profile-widget-heading">
                  <Share2 size={19} style={{ color: theme.accent }} />
                  <h3>Encontra-me na internet</h3>
                </div>

                <div className="social-links">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      style={{ borderColor: `${theme.accent}40` }}
                    >
                      <span>{link.title}</span>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </article>
            )}
          </div>
        </section>

        <footer className="workspace-footer">
          <span>FEITO À TUA MANEIRA ✳</span>
          <span>MEEMU © 2026</span>
        </footer>
      </section>
    </main>
  );
}
