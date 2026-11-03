// Supabase auth + prayer wall for Templum Salutis.
// Fails soft: if the client or table is unavailable, the sanctuary still works
// as a pure 3D experience and the UI shows a gentle notice.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

let client = null;
try {
  if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ts-auth' }
    });
  }
} catch (err) {
  console.warn('[auth] Supabase client failed to init:', err);
  client = null;
}
export const backendEnabled = Boolean(client);

let session = null;
const authListeners = new Set();
/** Subscribe to auth changes; immediately receives current session (or null). */
export function onAuthChange(fn) { authListeners.add(fn); try { fn(session); } catch (e) { console.warn(e); } }
function emit() { authListeners.forEach(fn => { try { fn(session); } catch (e) { console.warn(e); } }); }

export async function initAuth() {
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    session = data?.session ?? null;
    client.auth.onAuthStateChange((_event, s) => { session = s ?? null; emit(); });
  } catch (err) {
    console.warn('[auth] session restore failed:', err);
  }
  return session;
}

export const currentUser = () => session?.user ?? null;
export const displayNameOf = u =>
  (u?.user_metadata?.display_name || (u?.email || 'pilgrim').split('@')[0] || 'pilgrim').trim();

const NOT_CONFIGURED = { data: null, error: { message: 'The sanctuary guestbook is offline.' } };

export async function signUp(email, password, displayName) {
  if (!client) return NOT_CONFIGURED;
  return client.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
}
export async function signIn(email, password) {
  if (!client) return NOT_CONFIGURED;
  return client.auth.signInWithPassword({ email, password });
}
export async function signOut() {
  if (!client) return;
  return client.auth.signOut();
}

/** Persist the chosen pilgrim in the user's auth metadata (cross-device). */
export async function setPilgrimPreference(kind) {
  if (!client || !session) return;
  try { return await client.auth.updateUser({ data: { pilgrim: kind } }); }
  catch (err) { console.warn('[auth] pilgrim sync failed:', err); }
}
export const getPilgrimPreference = () => session?.user?.user_metadata?.pilgrim ?? null;

/* ---------- prayer wall ---------- */
export async function fetchPrayers(limit = 30) {
  if (!client) return NOT_CONFIGURED;
  return client
    .from('prayers')
    .select('id, user_id, display_name, body, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
}
export async function addPrayer(body) {
  const user = currentUser();
  if (!client) return NOT_CONFIGURED;
  if (!user) return { data: null, error: { message: 'Sign in to leave a prayer.' } };
  const row = { user_id: user.id, display_name: displayNameOf(user), body: body.trim() };
  return client.from('prayers').insert(row).select().single();
}
export async function deletePrayer(id) {
  if (!client) return NOT_CONFIGURED;
  return client.from('prayers').delete().eq('id', id);
}
