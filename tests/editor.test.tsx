import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorPage from "../app/editor/page";
import { initialWidgets, parseProfileDraft, profileLinkUrl } from "../lib/profile";

const mocks = vi.hoisted(() => ({
  session: { user: { id: "synthetic-a" } } as { user: { id: string } } | null,
  recovery: false,
  listeners: new Set<(event: string, session: unknown) => void>(),
  signOut: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("../lib/supabase", () => ({
  isPasswordRecoverySession: () => mocks.recovery,
  supabase: { auth: {
    getSession: () => Promise.resolve({ data: { session: mocks.session }, error: null }),
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      mocks.listeners.add(callback);
      return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(callback) } } };
    },
    signOut: mocks.signOut,
  } },
}));
const draft = {
  name: "Luna", username: "luna", title: "Meu universo", bio: "Minha bio", avatar: "",
  wallpaper: "full", background: "#F5F3FF", accent: "#7C3AED", textColor: "#29243B",
  radius: 22, widgets: initialWidgets, links: [{ id: 1, title: "Site", url: "https://example.test" }],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session = { user: { id: "synthetic-a" } };
  mocks.recovery = false;
  mocks.listeners.clear();
  mocks.signOut.mockResolvedValue({ error: null });
});

async function editorReady() {
  render(<EditorPage />);
  return screen.findByLabelText<HTMLInputElement>("Nome de exibição");
}

describe("editor access and persistence", () => {
  it("redirects unauthenticated access without exposing the editor", async () => {
    mocks.session = null;
    render(<EditorPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/#acessar"));
    expect(screen.queryByLabelText("Nome de exibição")).toBeNull();
  });

  it("routes recovery callbacks to password replacement", async () => {
    mocks.recovery = true;
    render(<EditorPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/reset-password"));
    expect(screen.queryByLabelText("Nome de exibição")).toBeNull();
  });

  it("saves and restores the account draft after remount", async () => {
    const first = render(<EditorPage />);
    const input = await screen.findByLabelText("Nome de exibição");
    fireEvent.change(input, { target: { value: "Luna" } });
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const saved = JSON.parse(localStorage.getItem("meemu-profile-draft:synthetic-a")!);
    expect(saved.name).toBe("Luna");
    expect(screen.getByRole("status").textContent).toContain("neste navegador");
    first.unmount();
    render(<EditorPage />);
    expect((await screen.findByLabelText<HTMLInputElement>("Nome de exibição")).value).toBe("Luna");
  });

  it("keeps drafts separate across accounts", async () => {
    localStorage.setItem("meemu-profile-draft:synthetic-a", JSON.stringify(draft));
    mocks.session = { user: { id: "synthetic-b" } };
    expect((await editorReady()).value).toBe("Teu nome");
  });

  it("keeps unsaved edits on token refresh and restores the new account on account changes", async () => {
    localStorage.setItem("meemu-profile-draft:synthetic-b", JSON.stringify({ ...draft, name: "Outra conta" }));
    await editorReady();
    fireEvent.change(screen.getByLabelText("Nome de exibição"), { target: { value: "Edição pendente" } });
    act(() => { mocks.listeners.forEach((callback) => callback("TOKEN_REFRESHED", mocks.session)); });
    expect(screen.getByLabelText<HTMLInputElement>("Nome de exibição").value).toBe("Edição pendente");
    act(() => { mocks.listeners.forEach((callback) => callback("SIGNED_IN", { user: { id: "synthetic-b" } })); });
    expect(screen.getByLabelText<HTMLInputElement>("Nome de exibição").value).toBe("Outra conta");
    expect(localStorage.getItem("meemu-profile-draft:synthetic-b")).toBeTruthy();
  });

  it("preserves a legacy draft and imports it only on request", async () => {
    localStorage.setItem("meemu-profile-draft", JSON.stringify(draft));
    expect((await editorReady()).value).toBe("Teu nome");
    await userEvent.click(screen.getByRole("button", { name: "Importar rascunho anterior deste navegador" }));
    expect(screen.getByLabelText<HTMLInputElement>("Nome de exibição").value).toBe("Luna");
    expect(localStorage.getItem("meemu-profile-draft")).toBe(JSON.stringify(draft));
  });

  it("handles corrupt drafts without crashing", async () => {
    localStorage.setItem("meemu-profile-draft:synthetic-a", "{broken");
    expect((await editorReady()).value).toBe("Teu nome");
    expect(screen.getByRole("status").textContent).toContain("Não foi possível abrir");
  });

  it("reports storage failures instead of claiming success", async () => {
    await editorReady();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("status").textContent).toContain("Não foi possível guardar");
    expect(screen.queryByText("Guardado")).toBeNull();
  });

  it("marks removing an avatar as unsaved", async () => {
    localStorage.setItem("meemu-profile-draft:synthetic-a", JSON.stringify({ ...draft, avatar: "data:image/png;base64,AA==" }));
    await editorReady();
    expect(screen.getByRole("button", { name: "Guardado" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Remover foto" }));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeTruthy();
  });

  it("preserves customization, widget toggles/order and safe preview links", async () => {
    await editorReady();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Aparência/ }));
    await user.click(screen.getByRole("button", { name: "Oceano" }));
    await user.click(screen.getByRole("button", { name: /Widgets/ }));
    await user.click(screen.getByRole("button", { name: "Mover Música para baixo" }));
    await user.click(screen.getByRole("button", { name: "Ocultar Galeria de fotos" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const saved = JSON.parse(localStorage.getItem("meemu-profile-draft:synthetic-a")!);
    expect(saved.accent).toBe("#2563EB");
    expect(saved.widgets[0].id).toBe("socials");
    expect(saved.widgets.find((item: { id: string }) => item.id === "gallery").enabled).toBe(false);
    expect(screen.getByRole("link", { name: "Ver perfil" }).getAttribute("href")).toBe("#perfil-preview");
    expect(screen.getByRole("link", { name: "Instagram" }).getAttribute("href")).toBe("https://instagram.com/");
  });

  it("clears access on logout and handles logout errors", async () => {
    await editorReady();
    mocks.signOut.mockResolvedValue({ error: { message: "offline" } });
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(screen.getByRole("status").textContent).toContain("Não foi possível sair");
    act(() => { mocks.listeners.forEach((callback) => callback("SIGNED_OUT", null)); });
    expect(mocks.replace).toHaveBeenCalledWith("/#acessar");
    expect(screen.queryByLabelText("Nome de exibição")).toBeNull();
  });
});

describe("untrusted draft validation", () => {
  it("accepts current drafts, rejects malformed and duplicate widget data", () => {
    expect(parseProfileDraft(JSON.stringify(draft))).toEqual(draft);
    for (const value of [null, [], {}, { ...draft, radius: "22" }, { ...draft, name: 12 },
      { ...draft, widgets: Array(4).fill(initialWidgets[0]) }, { ...draft, accent: "url(https://example.test)" }]) {
      expect(parseProfileDraft(JSON.stringify(value))).toBeNull();
    }
  });
  it.each(["javascript:alert(1)", "data:text/html,hello", "https://", "//example.test", "not-a-url"])("blocks unsafe or malformed links: %s", (url) => {
    expect(profileLinkUrl(url)).toBeUndefined();
  });
});
