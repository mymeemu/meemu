import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../app/page";
import ResetPasswordPage from "../app/reset-password/page";

const mocks = vi.hoisted(() => ({
  configured: true,
  recovery: false,
  listeners: new Set<(event: string, session: unknown) => void>(),
  auth: {
    getSession: vi.fn(), onAuthStateChange: vi.fn(), signUp: vi.fn(),
    signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(),
  },
  router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
  finishRecovery: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("../lib/supabase", () => ({
  get supabase() { return mocks.configured ? { auth: mocks.auth } : null; },
  isPasswordRecoverySession: (session: unknown) => !!session && mocks.recovery,
  finishPasswordRecovery: mocks.finishRecovery,
}));
const session = { user: { id: "synthetic-user" }, access_token: "synthetic-token" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured = true;
  mocks.recovery = false;
  mocks.listeners.clear();
  mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.onAuthStateChange.mockImplementation((callback) => {
    mocks.listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(callback) } } };
  });
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
  mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
});

async function fillSignup() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Como quer ser chamado?"), " Luna ");
  await user.type(screen.getByRole("textbox", { name: "E-mail" }), "luna@example.test");
  await user.type(screen.getByLabelText("Senha", { exact: true }), "synthetic-password");
  return user;
}
async function fillLogin(password = "secret") {
  const user = userEvent.setup();
  await user.click(screen.getAllByRole("button", { name: "Entrar" })[1]);
  await user.type(screen.getByRole("textbox", { name: "E-mail" }), "luna@example.test");
  await user.type(screen.getByLabelText("Senha", { exact: true }), password);
  await user.click(screen.getByRole("button", { name: "Entrar no MEEMU" }));
  return user;
}

describe("landing authentication", () => {
  it("renders the existing landing and submits signup metadata and confirmation redirect", async () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Deixe sua marca.");
    const user = await fillSignup();
    await user.click(screen.getByRole("button", { name: "Criar meu espaço" }));
    expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: "luna@example.test", password: "synthetic-password",
      options: { emailRedirectTo: `${window.location.origin}/editor`, data: { display_name: "Luna", username: "Luna" } },
    });
    expect(screen.getByRole("status").textContent).toContain("Verifique a sua caixa");
    expect(mocks.router.push).not.toHaveBeenCalled();
  });

  it("redirects signup with an immediate session to the editor", async () => {
    mocks.auth.signUp.mockResolvedValue({ data: { session }, error: null });
    render(<HomePage />);
    const user = await fillSignup();
    await user.click(screen.getByRole("button", { name: "Criar meu espaço" }));
    expect(mocks.router.push).toHaveBeenCalledWith("/editor");
  });

  it("shows signup errors and restores the form", async () => {
    mocks.auth.signUp.mockResolvedValue({ data: {}, error: { message: "Email rate limit exceeded", code: "over_email_send_rate_limit" } });
    render(<HomePage />);
    const user = await fillSignup();
    await user.click(screen.getByRole("button", { name: "Criar meu espaço" }));
    expect(screen.getByRole("status").textContent).toContain("Erro no cadastro");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Criar meu espaço" }).disabled).toBe(false);
  });

  it("allows login with an existing six-character password and redirects", async () => {
    render(<HomePage />);
    await fillLogin();
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: "luna@example.test", password: "secret" });
    expect(mocks.router.push).toHaveBeenCalledWith("/editor");
  });

  it.each([
    ["invalid_credentials", "Email ou senha incorretos"],
    ["email_not_confirmed", "Confirme o seu email"],
  ])("shows login feedback for %s", async (code, message) => {
    mocks.auth.signInWithPassword.mockResolvedValue({ error: { code, message: "Provider error" } });
    render(<HomePage />);
    await fillLogin();
    expect(screen.getByRole("status").textContent).toContain(message);
    expect(mocks.router.push).not.toHaveBeenCalled();
  });

  it("restores controls after a network error", async () => {
    mocks.auth.signInWithPassword.mockRejectedValue(new Error("synthetic offline"));
    render(<HomePage />);
    await fillLogin();
    expect(screen.getByRole("status").textContent).toContain("problema de ligação");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Entrar no MEEMU" }).disabled).toBe(false);
  });

  it("uses a persisted session and handles confirmation and recovery events", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    const { unmount } = render(<HomePage />);
    await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith("/editor"));
    mocks.listeners.forEach((listener) => listener("SIGNED_IN", session));
    mocks.listeners.forEach((listener) => listener("PASSWORD_RECOVERY", session));
    expect(mocks.router.replace).toHaveBeenCalledWith("/reset-password");
    unmount();
    expect(mocks.listeners.size).toBe(0);
  });

  it("shows invalid confirmation links without crashing", async () => {
    window.history.replaceState(null, "", "/#error=access_denied&error_code=otp_expired");
    render(<HomePage />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("inválido ou expirou"));
  });

  it("reports missing configuration to the user", async () => {
    mocks.configured = false;
    render(<HomePage />);
    const user = await fillSignup();
    await user.click(screen.getByRole("button", { name: "Criar meu espaço" }));
    expect(screen.getByRole("status").textContent).toContain("indisponível");
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });
});

describe("password recovery request", () => {
  it("rejects blank and invalid email without requiring signup fields", async () => {
    render(<HomePage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(screen.getByRole("status").textContent).toContain("Digite seu e-mail");
    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "invalid-email");
    await user.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(mocks.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("sends email to Supabase with the current origin reset URL", async () => {
    render(<HomePage />);
    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), { target: { value: " luna@example.test " } });
    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith("luna@example.test", { redirectTo: `${window.location.origin}/reset-password` });
    expect(screen.getByRole("status").textContent).toContain("Se esse e-mail estiver cadastrado");
  });

  it("disables controls while sending and recovers after provider failure", async () => {
    let complete!: (value: unknown) => void;
    mocks.auth.resetPasswordForEmail.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    render(<HomePage />);
    await userEvent.type(screen.getByRole("textbox", { name: "E-mail" }), "luna@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "E-mail" }).disabled).toBe(true);
    expect(screen.getAllByRole<HTMLButtonElement>("button", { name: "Entrar" }).every((button) => button.disabled)).toBe(true);
    complete({ error: { message: "Provider diagnostic" } });
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Não foi possível enviar"));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "E-mail" }).disabled).toBe(false);
    expect(screen.queryByText("Provider diagnostic")).toBeNull();
  });
});

describe("password replacement", () => {
  function renderRecovery() {
    mocks.recovery = true;
    mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    return render(<ResetPasswordPage />);
  }
  async function enterPasswords(confirm = "new-password") {
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>("Nova senha").disabled).toBe(false));
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nova senha"), "new-password");
    await user.type(screen.getByLabelText("Confirmar nova senha"), confirm);
    await user.click(screen.getByRole("button", { name: "Alterar minha senha" }));
  }

  it("rejects expired/invalid links even with an ordinary logged-in session", async () => {
    window.history.replaceState(null, "", "/reset-password#error=access_denied&error_code=otp_expired");
    mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    render(<ResetPasswordPage />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("inválido ou expirou"));
    expect(screen.getByLabelText<HTMLInputElement>("Nova senha").disabled).toBe(true);
  });

  it("rejects explicit link errors even when recovery context exists", async () => {
    window.history.replaceState(null, "", "/reset-password#error=access_denied&error_code=otp_expired");
    renderRecovery();
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("inválido ou expirou"));
    expect(screen.getByLabelText<HTMLInputElement>("Nova senha").disabled).toBe(true);
  });

  it("rechecks recovery context before saving", async () => {
    renderRecovery();
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>("Nova senha").disabled).toBe(false));
    mocks.recovery = false;
    await enterPasswords();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("não está válido");
  });

  it("validates password confirmation before any update", async () => {
    renderRecovery();
    await enterPasswords("different-password");
    expect(screen.getByRole("status").textContent).toContain("não coincidem");
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  it("enforces the minimum length independently of browser validation", async () => {
    renderRecovery();
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>("Nova senha").disabled).toBe(false));
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "short" } });
    fireEvent.submit(screen.getByRole("button", { name: "Alterar minha senha" }).closest("form")!);
    expect(screen.getByRole("status").textContent).toContain("pelo menos 8");
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  it("saves the new password, clears the fields and consumes recovery context", async () => {
    renderRecovery();
    await enterPasswords();
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(mocks.finishRecovery).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("Senha alterada com sucesso");
    act(() => { mocks.listeners.forEach((listener) => listener("SIGNED_OUT", null)); });
    expect(screen.getByRole("status").textContent).toContain("Senha alterada com sucesso");
    expect(screen.queryByLabelText("Nova senha")).toBeNull();
    expect(screen.getByRole("link", { name: "Voltar ao MEEMU" }).getAttribute("href")).toBe("/");
  });

  it("handles update errors and allows retry", async () => {
    mocks.auth.updateUser.mockResolvedValue({ error: { message: "Token expired" } });
    renderRecovery();
    await enterPasswords();
    expect(screen.getByRole("status").textContent).toContain("Não foi possível alterar");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Alterar minha senha" }).disabled).toBe(false);
  });

  it("handles rejected session initialization", async () => {
    mocks.auth.getSession.mockRejectedValue(new Error("synthetic offline"));
    render(<ResetPasswordPage />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Não foi possível validar"));
  });
});
