
"use client";

import "./editor.css";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isPasswordRecoverySession, supabase } from "../../lib/supabase";
import { initialWidgets, parseProfileDraft, profileLinkUrl, type ProfileDraft, type ProfileLink } from "../../lib/profile";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  UserRound,
  Eye,
  Trash2,
  Upload,
  GripVertical,
} from "lucide-react";

type Section = "perfil" | "aparencia" | "wallpaper" | "widgets" | "links";

export default function EditorPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const restoredUserId = useRef<string | null>(null);
  const [status, setStatus] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [legacyDraft, setLegacyDraft] = useState<ProfileDraft | null>(null);
  const [section, setSection] = useState<Section>("perfil");
  const [name, setName] = useState("Teu nome");
  const [username, setUsername] = useState("teuusername");
  const [title, setTitle] = useState("O teu mundo. As tuas regras.");
  const [bio, setBio] = useState("Coleciono momentos, mundos fictícios e boas histórias.");
  const [avatar, setAvatar] = useState("");
  const [wallpaper, setWallpaper] = useState<"left" | "full">("left");
  const [background, setBackground] = useState("#F5F3FF");
  const [accent, setAccent] = useState("#7C3AED");
  const [textColor, setTextColor] = useState("#29243B");
  const [radius, setRadius] = useState(22);
  const [widgets, setWidgets] = useState(initialWidgets);
  const [links, setLinks] = useState<ProfileLink[]>([
    { id: 1, title: "Instagram", url: "https://instagram.com/" },
    { id: 2, title: "O meu site", url: "https://" },
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!supabase) {
      router.replace("/#acessar");
      return;
    }
    let active = true;

    function restoreSession(session: Parameters<typeof isPasswordRecoverySession>[0], recoveryEvent = false) {
      if (!active) return;
      if (!session || recoveryEvent || isPasswordRecoverySession(session)) {
        restoredUserId.current = null;
        setUserId(null);
        router.replace(session ? "/reset-password" : "/#acessar");
        return;
      }

      // Restore on account changes, never on token refreshes or repeated events.
      if (restoredUserId.current !== session.user.id) {
        restoredUserId.current = session.user.id;
        resetProfile();
        setLegacyDraft(null);
        try {
          const raw = localStorage.getItem(`meemu-profile-draft:${session.user.id}`);
          if (raw) {
            const draft = parseProfileDraft(raw);
            if (draft) {
              loadDraft(draft);
              setSaved(true);
            } else {
              setStatus("Não foi possível abrir o rascunho guardado neste navegador.");
            }
          } else {
            const legacy = localStorage.getItem("meemu-profile-draft");
            if (legacy) setLegacyDraft(parseProfileDraft(legacy));
          }
        } catch {
          setStatus("O armazenamento deste navegador está indisponível.");
        }
      }
      setUserId(session.user.id);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      restoreSession(event === "SIGNED_OUT" ? null : session, event === "PASSWORD_RECOVERY");
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      restoreSession(error ? null : data.session);
    }).catch(() => restoreSession(null));
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  function loadDraft(draft: ProfileDraft) {
    setName(draft.name);
    setUsername(draft.username);
    setTitle(draft.title);
    setBio(draft.bio);
    setAvatar(draft.avatar);
    setWallpaper(draft.wallpaper);
    setBackground(draft.background);
    setAccent(draft.accent);
    setTextColor(draft.textColor);
    setRadius(draft.radius);
    setWidgets(draft.widgets);
    setLinks(draft.links);
  }

  async function signOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setStatus("Não foi possível sair. Tente novamente.");
    } catch {
      setStatus("Não foi possível sair. Tente novamente.");
    } finally {
      setSigningOut(false);
    }
  }

  function updateWidget(id: string, enabled: boolean) {
    setWidgets((current) =>
      current.map((widget) =>
        widget.id === id ? { ...widget, enabled } : widget
      )
    );
    setSaved(false);
  }

  function moveWidget(index: number, direction: -1 | 1) {
    setWidgets((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function addLink() {
    setLinks((current) => [
      ...current,
      { id: Date.now(), title: "Novo link", url: "https://" },
    ]);
    setSaved(false);
  }

  function updateLink(id: number, field: "title" | "url", value: string) {
    setLinks((current) =>
      current.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );
    setSaved(false);
  }

  function removeLink(id: number) {
    setLinks((current) => current.filter((link) => link.id !== id));
    setSaved(false);
  }

  function saveProfile() {
    if (!userId) return;
    const data = {
      name,
      username,
      title,
      bio,
      avatar,
      wallpaper,
      background,
      accent,
      textColor,
      radius,
      widgets,
      links,
    };

    try {
      localStorage.setItem(`meemu-profile-draft:${userId}`, JSON.stringify(data));
      setSaved(true);
      setStatus("Rascunho guardado neste navegador.");
    } catch {
      setSaved(false);
      setStatus("Não foi possível guardar o rascunho. O armazenamento pode estar cheio ou indisponível.");
    }
  }

  function resetProfile() {
    setStatus("");
    setName("Teu nome");
    setUsername("teuusername");
    setTitle("O teu mundo. As tuas regras.");
    setBio("Coleciono momentos, mundos fictícios e boas histórias.");
    setAvatar("");
    setWallpaper("left");
    setBackground("#F5F3FF");
    setAccent("#7C3AED");
    setTextColor("#29243B");
    setRadius(22);
    setWidgets(initialWidgets);
    setLinks([
      { id: 1, title: "Instagram", url: "https://instagram.com/" },
      { id: 2, title: "O meu site", url: "https://" },
    ]);
    setSaved(false);
  }

  function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Escolhe um ficheiro de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        setSaved(false);
      }
    };
    reader.onerror = () => setStatus("Não foi possível ler a imagem. Tente novamente.");
    reader.readAsDataURL(file);
  }

  const sections: {
    id: Section;
    label: string;
    description: string;
    icon: typeof UserRound;
  }[] = [
    { id: "perfil", label: "Meu perfil", description: "Nome, foto e bio", icon: UserRound },
    { id: "aparencia", label: "Aparência", description: "Cores e estilo", icon: Palette },
    { id: "wallpaper", label: "Wallpaper", description: "Fundo do perfil", icon: ImageIcon },
    { id: "widgets", label: "Widgets", description: "Organiza o teu espaço", icon: LayoutGrid },
    { id: "links", label: "Links", description: "As tuas redes e páginas", icon: Link2 },
  ];

  if (!userId) {
    return <main className="me-editor"><p role="status">A validar a tua sessão...</p></main>;
  }

  return (
    <main className="me-editor">
      <header className="me-editor-topbar">
        <Link className="me-editor-brand" href="/" aria-label="Voltar ao MEEMU">
          <span className="me-editor-logo">m.</span>
          <span>meemu<span className="me-editor-brand-dot">.</span></span>
        </Link>

        <div className="me-editor-top-label">
          <span className="me-editor-live-dot" />
          EDITOR DO TEU UNIVERSO
        </div>

        <div className="me-editor-top-actions">
          <a className="me-editor-view" href="#perfil-preview">
            <Eye size={16} /> Ver perfil
          </a>
          <button className="me-editor-save" onClick={saveProfile}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Guardado" : "Guardar"}
          </button>
          <button className="me-editor-view" onClick={signOut} disabled={signingOut}>
            {signingOut ? "A sair..." : "Sair"}
          </button>
        </div>
      </header>

      <div className="me-editor-heading">
        <div>
          <Link href="#perfil-preview" className="me-editor-back">
            <ArrowLeft size={14} /> Voltar ao espaço
          </Link>
          <p className="me-editor-eyebrow">PERSONALIZAÇÃO MEEMU</p>
          <h1>O teu espaço<span>.</span></h1>
          <p className="me-editor-subtitle">
            Cada detalhe conta uma parte da tua história.
          </p>
        </div>
        <div className="me-editor-heading-mark">✳</div>
      </div>

      <div className="me-editor-layout">
        <aside className="me-editor-sidebar">
          <div className="me-editor-sidebar-title">PERSONALIZAR</div>

          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`me-editor-nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <span className="me-editor-nav-icon"><Icon size={18} /></span>
                <span className="me-editor-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ChevronRight size={15} className="me-editor-nav-chevron" />
              </button>
            );
          })}

          <div className="me-editor-sidebar-bottom">
            <div className="me-editor-tip-icon"><Settings2 size={16} /></div>
            <strong>O teu espaço, as tuas regras.</strong>
            <p>Experimenta. Muda. Encontra o teu estilo.</p>
          </div>
        </aside>

        <section className="me-editor-controls">
          {status && <p className="me-editor-helper" role="status" aria-live="polite">{status}</p>}
          {legacyDraft && <button className="me-editor-reset" onClick={() => {
            loadDraft(legacyDraft);
            setSaved(false);
            setLegacyDraft(null);
            setStatus("Rascunho anterior importado. Guarda as alterações para associá-lo a esta conta.");
          }}>Importar rascunho anterior deste navegador</button>}
          {section === "perfil" && (
            <div className="me-editor-section">
              <div className="me-editor-section-heading">
                <div>
                  <span className="me-editor-kicker">IDENTIDADE · 01</span>
                  <h2>Quem és tu?</h2>
                  <p>Mostra ao mundo um pouco de quem és.</p>
                </div>
                <UserRound size={23} />
              </div>

              <div className="me-editor-field">
                <label>Foto de perfil</label>
                <div className="me-editor-avatar-row">
                  <div className="me-editor-avatar" style={{ background: accent }}>
                    {avatar ? (
                      // Local FileReader data URLs do not need image optimization.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="Pré-visualização do avatar" />
                    ) : (
                      <span>{name.trim().charAt(0).toLowerCase() || "m"}</span>
                    )}
                  </div>
                  <div className="me-editor-upload-copy">
                    <strong>A tua imagem, a tua identidade.</strong>
                    <p>Escolhe uma imagem do teu dispositivo.</p>
                    <label className="me-editor-upload-button">
                      <Upload size={14} /> Escolher imagem
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => uploadAvatar(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {avatar && (
                    <button className="me-editor-icon-button" onClick={() => { setAvatar(""); setSaved(false); }} aria-label="Remover foto">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="me-editor-field">
                <label htmlFor="me-name">Nome de exibição</label>
                <input id="me-name" value={name} maxLength={50} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Como te chamam?" />
              </div>

              <div className="me-editor-field">
                <label htmlFor="me-username">Nome de usuário</label>
                <div className="me-editor-input-prefix">
                  <span>@</span>
                  <input id="me-username" value={username} maxLength={30} onChange={(e) => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "")); setSaved(false); }} placeholder="teuusername" />
                </div>
                <small>Usa letras, números, pontos ou sublinhados.</small>
              </div>

              <div className="me-editor-field">
                <label htmlFor="me-title">Título principal</label>
                <input id="me-title" value={title} maxLength={90} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} placeholder="Uma frase que te representa" />
              </div>

              <div className="me-editor-field">
                <label htmlFor="me-bio">Biografia</label>
                <textarea id="me-bio" value={bio} maxLength={240} rows={4} onChange={(e) => { setBio(e.target.value); setSaved(false); }} placeholder="Conta um pouco sobre ti..." />
                <small>{bio.length}/240 caracteres</small>
              </div>
            </div>
          )}

          {section === "aparencia" && (
            <div className="me-editor-section">
              <div className="me-editor-section-heading">
                <div>
                  <span className="me-editor-kicker">ESTILO · 02</span>
                  <h2>Escolhe as tuas cores</h2>
                  <p>Cria uma combinação que tenha a tua cara.</p>
                </div>
                <Palette size={23} />
              </div>

              <div className="me-editor-color-card">
                <div>
                  <strong>Cor de destaque</strong>
                  <p>Botões, ícones e detalhes.</p>
                </div>
                <label className="me-editor-color-control">
                  <span style={{ background: accent }} />
                  <input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setSaved(false); }} aria-label="Cor de destaque" />
                  <code>{accent.toUpperCase()}</code>
                </label>
              </div>

              <div className="me-editor-color-card">
                <div>
                  <strong>Cor de fundo</strong>
                  <p>O fundo principal dos widgets.</p>
                </div>
                <label className="me-editor-color-control">
                  <span style={{ background: background }} />
                  <input type="color" value={background} onChange={(e) => { setBackground(e.target.value); setSaved(false); }} aria-label="Cor de fundo" />
                  <code>{background.toUpperCase()}</code>
                </label>
              </div>

              <div className="me-editor-color-card">
                <div>
                  <strong>Cor do texto</strong>
                  <p>Títulos e informações do perfil.</p>
                </div>
                <label className="me-editor-color-control">
                  <span style={{ background: textColor }} />
                  <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); setSaved(false); }} aria-label="Cor do texto" />
                  <code>{textColor.toUpperCase()}</code>
                </label>
              </div>

              <div className="me-editor-field me-editor-radius-field">
                <label htmlFor="me-radius">Arredondamento dos widgets</label>
                <div className="me-editor-range-row">
                  <span>Suave</span>
                  <input id="me-radius" type="range" min="8" max="36" value={radius} onChange={(e) => { setRadius(Number(e.target.value)); setSaved(false); }} />
                  <span>Redondo</span>
                </div>
                <small>{radius}px de arredondamento</small>
              </div>

              <div className="me-editor-presets">
                <span className="me-editor-label">COMBINAÇÕES RÁPIDAS</span>
                <div className="me-editor-preset-list">
                  <button onClick={() => { setAccent("#7C3AED"); setBackground("#F5F3FF"); setTextColor("#29243B"); setSaved(false); }}>
                    <i style={{ background: "#7C3AED" }} /> Lavanda
                  </button>
                  <button onClick={() => { setAccent("#2563EB"); setBackground("#EFF6FF"); setTextColor("#172554"); setSaved(false); }}>
                    <i style={{ background: "#2563EB" }} /> Oceano
                  </button>
                  <button onClick={() => { setAccent("#DB2777"); setBackground("#FDF2F8"); setTextColor("#500724"); setSaved(false); }}>
                    <i style={{ background: "#DB2777" }} /> Sakura
                  </button>
                  <button onClick={() => { setAccent("#059669"); setBackground("#ECFDF5"); setTextColor("#064E3B"); setSaved(false); }}>
                    <i style={{ background: "#059669" }} /> Natureza
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === "wallpaper" && (
            <div className="me-editor-section">
              <div className="me-editor-section-heading">
                <div>
                  <span className="me-editor-kicker">CENÁRIO · 03</span>
                  <h2>Entra no teu universo</h2>
                  <p>Escolhe como o wallpaper ocupa o teu espaço.</p>
                </div>
                <ImageIcon size={23} />
              </div>

              <div className="me-editor-wallpaper-options">
                <button className={`me-editor-wallpaper-option ${wallpaper === "left" ? "selected" : ""}`} onClick={() => { setWallpaper("left"); setSaved(false); }}>
                  <div className="me-editor-wallpaper-demo left-demo">
                    <div /><span /><span />
                  </div>
                  <strong>Coluna esquerda</strong>
                  <small>Wallpaper lateral</small>
                  {wallpaper === "left" && <Check size={16} />}
                </button>
                <button className={`me-editor-wallpaper-option ${wallpaper === "full" ? "selected" : ""}`} onClick={() => { setWallpaper("full"); setSaved(false); }}>
                  <div className="me-editor-wallpaper-demo full-demo">
                    <div /><span /><span />
                  </div>
                  <strong>Ecrã completo</strong>
                  <small>Fundo envolvente</small>
                  {wallpaper === "full" && <Check size={16} />}
                </button>
              </div>

              <div className="me-editor-wallpaper-note">
                <ImageIcon size={18} />
                <div>
                  <strong>Wallpaper personalizado</strong>
                  <p>O posicionamento já pode ser configurado. O envio de uma imagem de fundo será adicionado numa próxima etapa.</p>
                </div>
              </div>
            </div>
          )}

          {section === "widgets" && (
            <div className="me-editor-section">
              <div className="me-editor-section-heading">
                <div>
                  <span className="me-editor-kicker">COMPOSIÇÃO · 04</span>
                  <h2>Organiza o teu espaço</h2>
                  <p>Ativa, desativa e muda a ordem dos widgets.</p>
                </div>
                <LayoutGrid size={23} />
              </div>

              <div className="me-editor-widget-list">
                {widgets.map((widget, index) => (
                  <div className={`me-editor-widget-row ${widget.enabled ? "" : "disabled"}`} key={widget.id}>
                    <GripVertical size={17} className="me-editor-grip" />
                    <div className="me-editor-widget-number">{String(index + 1).padStart(2, "0")}</div>
                    <div className="me-editor-widget-name">
                      <strong>{widget.name}</strong>
                      <small>{widget.enabled ? "Visível no perfil" : "Oculto no perfil"}</small>
                    </div>
                    <div className="me-editor-widget-order">
                      <button disabled={index === 0} onClick={() => moveWidget(index, -1)} aria-label={`Mover ${widget.name} para cima`}>↑</button>
                      <button disabled={index === widgets.length - 1} onClick={() => moveWidget(index, 1)} aria-label={`Mover ${widget.name} para baixo`}>↓</button>
                    </div>
                    <button className={`me-editor-switch ${widget.enabled ? "on" : ""}`} onClick={() => updateWidget(widget.id, !widget.enabled)} aria-label={`${widget.enabled ? "Ocultar" : "Mostrar"} ${widget.name}`}>
                      <span />
                    </button>
                  </div>
                ))}
              </div>

              <p className="me-editor-helper">
                Usa as setas para mudar a ordem. A função de arrastar diretamente será adicionada numa próxima etapa.
              </p>
            </div>
          )}

          {section === "links" && (
            <div className="me-editor-section">
              <div className="me-editor-section-heading">
                <div>
                  <span className="me-editor-kicker">CONEXÕES · 05</span>
                  <h2>Os teus cantos da internet</h2>
                  <p>Adiciona as páginas onde as pessoas te encontram.</p>
                </div>
                <Link2 size={23} />
              </div>

              <div className="me-editor-links-list">
                {links.map((link, index) => (
                  <div className="me-editor-link-card" key={link.id}>
                    <div className="me-editor-link-card-top">
                      <span className="me-editor-link-number">{String(index + 1).padStart(2, "0")}</span>
                      <strong>Link personalizado</strong>
                      <button onClick={() => removeLink(link.id)} aria-label="Remover link">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="me-editor-field">
                      <label>Título</label>
                      <input value={link.title} onChange={(e) => updateLink(link.id, "title", e.target.value)} placeholder="Ex.: Instagram" />
                    </div>
                    <div className="me-editor-field">
                      <label>URL</label>
                      <input type="url" value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                ))}
              </div>

              <button className="me-editor-add-link" onClick={addLink}>
                <Plus size={17} /> Adicionar link
              </button>
            </div>
          )}

          <div className="me-editor-bottom-actions">
            <button className="me-editor-reset" onClick={resetProfile}>
              <RotateCcw size={15} /> Restaurar exemplo
            </button>
            <button className="me-editor-save-large" onClick={saveProfile}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "Alterações guardadas" : "Guardar alterações"}
            </button>
          </div>
        </section>

        <aside className="me-editor-preview" id="perfil-preview">
          <div className="me-editor-preview-heading">
            <div>
              <span className="me-editor-kicker">LIVE PREVIEW</span>
              <h2>O teu perfil</h2>
            </div>
            <span className="me-editor-preview-status"><i /> AO VIVO</span>
          </div>

          <div
            className={`me-editor-preview-card ${wallpaper === "full" ? "full-wallpaper" : ""}`}
            style={{
              backgroundColor: background,
              color: textColor,
              borderRadius: radius,
              "--me-accent": accent,
            } as React.CSSProperties}
          >
            <div className="me-editor-preview-art">
              <span className="me-editor-preview-art-mark">静 · MEEMU</span>
              <span className="me-editor-preview-art-number">01</span>
              <div className="me-editor-preview-orbit" />
              <div className="me-editor-preview-art-title">STAY<br />UNCOMMON.</div>
            </div>

            <div className="me-editor-preview-content">
              <div className="me-editor-preview-avatar" style={{ background: accent }}>
                {avatar ? (
                  // Local FileReader data URL, also used in the upload preview.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" />
                ) : <span>{name.trim().charAt(0).toLowerCase() || "m"}</span>}
              </div>
              <h3>{name || "Teu nome"}</h3>
              <p className="me-editor-preview-handle">@{username || "teuusername"}</p>
              <div className="me-editor-preview-title">{title || "O teu título"}</div>
              <p className="me-editor-preview-bio">{bio || "A tua bio aparecerá aqui."}</p>

              <div className="me-editor-preview-tags">
                <span style={{ background: `${accent}18`, color: accent }}>✳ dreamer</span>
                <span style={{ background: `${accent}18`, color: accent }}>✦ online</span>
              </div>

              {widgets.filter((widget) => widget.enabled).map((widget) => (
                <div className="me-editor-preview-widget" key={widget.id}>
                  <span>{widget.name}</span>
                  <span style={{ color: accent }}>✳</span>
                </div>
              ))}

              {links.filter((link) => link.title.trim()).map((link) => (
                <a className="me-editor-preview-link" key={link.id} style={{ borderColor: `${accent}40` }} href={profileLinkUrl(link.url)} target="_blank" rel="noopener noreferrer">
                  <Link2 size={13} style={{ color: accent }} />
                  <span>{link.title}</span>
                  <ChevronRight size={13} />
                </a>
              ))}
            </div>
          </div>

          <div className="me-editor-preview-footnote">
            <span><span /> Pré-visualização instantânea</span>
            <span>MEEMU ✳</span>
          </div>
        </aside>
      </div>

      <footer className="me-editor-footer">
        <Link href="#perfil-preview"><ArrowLeft size={14} /> Voltar ao perfil</Link>
        <span>FEITO À TUA MANEIRA <span>✳</span></span>
        <span>MEEMU © 2026</span>
      </footer>
    </main>
  );
}
