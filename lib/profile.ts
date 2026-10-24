export type ProfileLink = {
  id: number;
  title: string;
  url: string;
};

export type WidgetItem = {
  id: string;
  name: string;
  enabled: boolean;
};

export type ProfileDraft = {
  name: string;
  username: string;
  title: string;
  bio: string;
  avatar: string;
  wallpaper: "left" | "full";
  background: string;
  accent: string;
  textColor: string;
  radius: number;
  widgets: WidgetItem[];
  links: ProfileLink[];
};

export const initialWidgets: WidgetItem[] = [
  { id: "music", name: "Música", enabled: true },
  { id: "socials", name: "Redes sociais", enabled: true },
  { id: "gallery", name: "Galeria de fotos", enabled: true },
  { id: "quote", name: "Citação", enabled: true },
];

export function parseProfileDraft(raw: string): ProfileDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Record<string, unknown>;
    for (const key of ["name", "username", "title", "bio", "avatar"]) {
      if (typeof draft[key] !== "string") return null;
    }
    for (const key of ["background", "accent", "textColor"]) {
      if (typeof draft[key] !== "string" || !/^#[\da-f]{6}$/i.test(draft[key])) return null;
    }
    if (draft.wallpaper !== "left" && draft.wallpaper !== "full") return null;
    if (typeof draft.radius !== "number" || !Number.isFinite(draft.radius) || draft.radius < 8 || draft.radius > 36) return null;
    if (!Array.isArray(draft.widgets) || draft.widgets.length !== initialWidgets.length) return null;
    const ids = new Set<string>();
    for (const widget of draft.widgets) {
      if (!widget || typeof widget !== "object" ||
        !initialWidgets.some((item) => item.id === widget.id && item.name === widget.name) ||
        typeof widget.enabled !== "boolean" || ids.has(widget.id)) return null;
      ids.add(widget.id);
    }
    if (!Array.isArray(draft.links) || draft.links.some((link) => !link ||
      typeof link !== "object" || typeof link.id !== "number" || !Number.isFinite(link.id) ||
      typeof link.title !== "string" || typeof link.url !== "string")) return null;
    if (new Set(draft.links.map((link) => link.id)).size !== draft.links.length) return null;
    return draft as ProfileDraft;
  } catch {
    return null;
  }
}

export function profileLinkUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
