
import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) return null;
  try {
    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    // A bad deployment URL must not crash rendering before feedback is shown.
    return null;
  }
}

export const supabase = createSupabaseClient();

// Capture recovery before React mounts: URL initialization can finish first.
// Keep this proof in memory; an ordinary persisted login is not a recovery link.
let recoveryAccessToken: string | null = null;
supabase?.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" || (event === "TOKEN_REFRESHED" && recoveryAccessToken)) {
    recoveryAccessToken = session?.access_token ?? null;
  } else if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && session?.access_token !== recoveryAccessToken)) {
    recoveryAccessToken = null;
  }
});

export function isPasswordRecoverySession(session: Session | null) {
  return !!session && session.access_token === recoveryAccessToken;
}

export function finishPasswordRecovery() {
  recoveryAccessToken = null;
}
