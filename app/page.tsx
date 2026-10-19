"use client";

import { useState } from "react";
import {
  AudioLines,
  Camera,
  ChevronDown,
  CircleHelp,
  Disc3,
  ExternalLink,
  Heart,
  Instagram,
  LayoutGrid,
  Link2,
  Music2,
  Plus,
  Settings2,
  Sparkles,
  Twitch,
  Youtube
} from "lucide-react";

type WallpaperMode = "left" | "full";

export default function Home() {
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>("left");
  const [showEditor, setShowEditor] = useState(false);
  const [wideMusic, setWideMusic] = useState(true);
  const [showGallery, setShowGallery] = useState(true);

  return (
    <main className={`site-shell ${wallpaperMode === "full" ? "wallpaper-full" : ""}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#" aria-label="MEEMU início">
          <span className="brand-mark">m</span>
          <span>meemu<span className="brand-dot">.</span></span>
        </a>

        <div className="topbar-center">
          <span className="live-dot" />
          <span>UM ESPAÇO SÓ TEU</span>
        </div>

        <button className="top-action" onClick={() => setShowEditor(!showEditor)}>
          <Settings2 size={16} />
          <span>{showEditor ? "Fechar editor" : "Personalizar"}</span>
        </button>
      </header>

      <section className="workspace">
        <aside className="identity-panel">
          <div className="wallpaper-art" aria-hidden="true">
            <div className="art-grain" />
            <div className="art-vertical">静 · 孤独 · 強さ</div>
            <div className="art-number">01</div>
            <div className="art-orbit" />

            <div className="art-silhouette">
              <div className="silhouette-head" />
              <div className="silhouette-body" />
            </div>

            <div className="art-caption">STAY<br />UNCOMMON.</div>
            <div className="art-bottom-line" />
          </div>

          <div className="identity-overlay">
            <div className="eyebrow">
              <span />
              PERFIL PESSOAL
              <span className="eyebrow-line" />
            </div>

            <div className="identity-copy">
              <div className="handle">@teuusername</div>
              <h1>O teu mundo.<br /><em>As tuas regras.</em></h1>
              <p>“Nem tudo o que é real precisa de ser explicado.”</p>
            </div>

            <div className="identity-footer">
              <span><span className="tiny-dot" /> DISPONÍVEL NO MEU MUNDO</span>
              <span>MMXXVI</span>
            </div>
          </div>
        </aside>

        <section className="widgets-area" aria-label="Widgets do perfil">
          <div className="profile-heading">
            <div>
              <div className="section-kicker">O MEU ESPAÇO <span>✳</span></div>
              <h2>Hey, visitante<span>.</span></h2>
              <p>Um pequeno universo, em constante mudança.</p>
            </div>

            <button className="icon-button" aria-label="Ajuda">
              <CircleHelp size={17} />
            </button>
          </div>

          {showEditor && (
            <div className="editor-panel">
              <div className="editor-title">
                <Sparkles size={16} /> Personalizar visual
              </div>

              <div className="editor-row">
                <span>Wallpaper</span>
                <div className="segmented">
                  <button
                    className={wallpaperMode === "left" ? "selected" : ""}
                    onClick={() => setWallpaperMode("left")}
                  >
                    Coluna esquerda
                  </button>
                  <button
                    className={wallpaperMode === "full" ? "selected" : ""}
                    onClick={() => setWallpaperMode("full")}
                  >
                    Ecrã completo
                  </button>
                </div>
              </div>

              <div className="editor-row">
                <span>Widget de música</span>
                <button className="mini-toggle" onClick={() => setWideMusic(!wideMusic)}>
                  {wideMusic ? "Largo" : "Compacto"} <ChevronDown size={13} />
                </button>
              </div>

              <div className="editor-row">
                <span>Galeria de fotos</span>
                <button
                  className={`switch ${showGallery ? "on" : ""}`}
                  onClick={() => setShowGallery(!showGallery)}
                  aria-label="Alternar galeria"
                >
                  <span />
                </button>
              </div>

              <p className="editor-note">
                Pré-visualização inicial. A gravação dos perfis será integrada
                com o Supabase numa próxima fase.
              </p>
            </div>
          )}

          <div className="widget-grid">
            <article className="widget profile-widget">
              <div className="widget-top">
                <span className="widget-label">IDENTIDADE</span>
                <span className="widget-index">01 / 04</span>
              </div>

              <div className="avatar-wrap">
                <div className="avatar-placeholder"><span>m.</span></div>
                <span className="avatar-status" />
              </div>

              <h3>teu nome</h3>
              <p className="muted">@teuusername</p>
              <p className="bio">
                Coleciono momentos, mundos fictícios e boas histórias.
              </p>

              <div className="profile-tags">
                <span>✳ dreamer</span>
                <span>✦ online</span>
              </div>
            </article>

            <article className={`widget music-widget ${wideMusic ? "music-wide" : ""}`}>
              <div className="widget-top">
                <span className="widget-label"><AudioLines size={13} /> A TOCAR AGORA</span>
                <span className="music-pulse"><i /><i /><i /></span>
              </div>

              <div className="music-content">
                <div className="album-art">
                  <Disc3 size={31} strokeWidth={1.1} />
                  <span>MEEMU<br />RADIO</span>
                </div>

                <div className="track-info">
                  <h3>After Dark</h3>
                  <p>Mr.Kitty · Time</p>
                  <div className="track-progress"><span /></div>
                  <div className="track-time">
                    <span>1:24</span>
                    <span>4:17</span>
                  </div>
                </div>
              </div>

              <div className="music-controls">
                <span><Music2 size={15} /> SPOTIFY EMBED / PREVIEW</span>
                <button aria-label="Abrir música"><ExternalLink size={14} /></button>
              </div>
            </article>

            <article className="widget socials-widget">
              <div className="widget-top">
                <span className="widget-label">ENCONTRA-ME</span>
                <Link2 size={14} />
              </div>

              <div className="social-grid">
                <a href="#instagram" aria-label="Instagram">
                  <Instagram size={19} /><span>Instagram</span>
                </a>
                <a href="#youtube" aria-label="YouTube">
                  <Youtube size={19} /><span>YouTube</span>
                </a>
                <a href="#twitch" aria-label="Twitch">
                  <Twitch size={19} /><span>Twitch</span>
                </a>
                <a href="#mais" aria-label="Adicionar rede">
                  <Plus size={19} /><span>Adicionar</span>
                </a>
              </div>
            </article>

            {showGallery && (
              <article className="widget gallery-widget">
                <div className="widget-top">
                  <span className="widget-label"><Camera size={13} /> FRAGMENTOS</span>
                  <span className="widget-index">GALERIA</span>
                </div>

                <div className="photo-grid">
                  <div className="photo-placeholder photo-one"><span>FRAME 01</span></div>
                  <div className="photo-placeholder photo-two"><span>FRAME 02</span></div>
                  <div className="photo-placeholder photo-three"><span>FRAME 03</span></div>
                </div>

                <div className="gallery-footer">
                  <span>Pequenos pedaços de mim</span>
                  <Heart size={14} />
                </div>
              </article>
            )}

            <article className="widget quote-widget">
              <div className="quote-mark">“</div>
              <p>Become who you are.</p>
              <span>— FRIEDRICH NIETZSCHE</span>
              <div className="quote-decoration">言葉</div>
            </article>

            <button className="add-widget" onClick={() => setShowEditor(true)}>
              <span className="add-icon"><Plus size={18} /></span>
              <strong>O teu próximo widget</strong>
              <span>Adiciona música, fotos, links ou algo que te represente.</span>
              <span className="add-link">EXPLORAR WIDGETS <span>↗</span></span>
            </button>
          </div>

          <footer className="workspace-footer">
            <span><LayoutGrid size={13} /> FEITO À TUA MANEIRA</span>
            <span>MEEMU © 2026 <span className="footer-star">✳</span></span>
          </footer>
        </section>
      </section>
    </main>
  );
}
