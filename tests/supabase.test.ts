import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
const user = { id: "synthetic-user", aud: "authenticated", role: "authenticated", email: "luna@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
function token() {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })}.synthetic-signature`;
}
async function loadClient() {
  const supabaseModule = await import("../lib/supabase");
  client = supabaseModule.supabase;
  return supabaseModule;
}
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "synthetic-public-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } })));
});
afterEach(async () => {
  await client?.auth.stopAutoRefresh();
  client = null;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Supabase SDK integration with mocked HTTP", () => {
  it("handles missing or malformed configuration without crashing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await loadClient()).supabase).toBeNull();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    expect((await loadClient()).supabase).toBeNull();
  });

  it("supports the public legacy anon key configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon-key");
    expect((await loadClient()).supabase).not.toBeNull();
    await client!.auth.getSession();
  });

  it("sends a recovery request through the real SDK with the exact redirect URL", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
    await loadClient();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await client!.auth.resetPasswordForEmail("luna@example.test", { redirectTo });
    expect(error).toBeNull();
    const [request, options] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(request));
    expect(url.pathname).toBe("/auth/v1/recover");
    expect(url.searchParams.get("redirect_to")).toBe(redirectTo);
    expect(JSON.parse(options!.body as string).email).toBe("luna@example.test");
  });

  it("captures a recovery URL before React mounts and consumes the context", async () => {
    const hash = new URLSearchParams({ access_token: token(), refresh_token: "synthetic-refresh", expires_in: "3600", token_type: "bearer", type: "recovery" });
    window.history.replaceState(null, "", `/reset-password#${hash}`);
    const supabaseModule = await loadClient();
    const { data } = await client!.auth.getSession();
    expect(data.session?.user.id).toBe(user.id);
    await waitFor(() => expect(supabaseModule.isPasswordRecoverySession(data.session)).toBe(true));
    expect(window.location.hash).toBe("");
    // This is the real SDK's local session persistence, with a synthetic token.
    expect(localStorage.getItem("sb-synthetic-auth-token")).toBeTruthy();
    supabaseModule.finishPasswordRecovery();
    expect(supabaseModule.isPasswordRecoverySession(data.session)).toBe(false);
  });

  it("persists login sessions without treating them as recovery", async () => {
    const jwt = token();
    localStorage.setItem("sb-synthetic-auth-token", JSON.stringify({ access_token: jwt, refresh_token: "synthetic-refresh", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
    const supabaseModule = await loadClient();
    const { data } = await client!.auth.getSession();
    expect(data.session?.user.id).toBe(user.id);
    expect(supabaseModule.isPasswordRecoverySession(data.session)).toBe(false);
  });

  it("does not accept an expired recovery redirect as recovery proof", async () => {
    window.history.replaceState(null, "", "/reset-password#error=access_denied&error_code=otp_expired&error_description=Link+expired");
    const supabaseModule = await loadClient();
    const { data } = await client!.auth.getSession();
    expect(supabaseModule.isPasswordRecoverySession(data.session)).toBe(false);
  });
});
