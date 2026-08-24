import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || '';
// Public first-party OAuth client ID; environment overrides remain available for local/staging clients.
const CLIENT_ID = (import.meta.env.VITE_POCKETBI_OAUTH_CLIENT_ID as string | undefined)?.trim() || '9bec3e2f-0984-47eb-8ea0-b3acf5d3b983';
const CALLBACK_PATH = '/auth/pocketbi/callback';
const PRODUCTION_REDIRECT_URI = 'https://bideide.com/auth/pocketbi/callback';
const TRANSACTION_KEY = 'bide.pocketbi.oauth.transaction.v1';
const SESSION_KEY = 'bide.pocketbi.oauth.session.v1';
const MAX_TRANSACTION_AGE_MS = 15 * 60 * 1000;
const REFRESH_SKEW_SECONDS = 120;
let refreshTimer: number | null = null;

type OAuthTransaction = {
  state: string;
  verifier: string;
  returnTo: string;
  redirectUri: string;
  createdAt: number;
};

type OAuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
};

type StoredOAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId: string;
};

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('PocketBI returned a malformed access token.');
  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
  return JSON.parse(atob(normalized)) as { client_id?: string; exp?: number; aud?: string | string[]; iss?: string };
}

function verifyOAuthAccessToken(token: string) {
  const payload = decodeJwtPayload(token);
  if (payload.client_id !== CLIENT_ID) throw new Error('PocketBI returned a token for a different OAuth client.');
  if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('PocketBI returned an expired OAuth token.');
  const expectedIssuer = `${SUPABASE_URL}/auth/v1`;
  if (payload.iss && payload.iss !== expectedIssuer) throw new Error('PocketBI returned a token from an unexpected issuer.');
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.aud && !audience.includes('authenticated')) throw new Error('PocketBI returned a token with an unexpected audience.');
}

function randomUrlSafe(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

async function sha256UrlSafe(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function safeReturnTo(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/ide';
  return value;
}

function configuredRedirectUri() {
  const explicit = (import.meta.env.VITE_POCKETBI_OAUTH_REDIRECT_URI as string | undefined)?.trim();
  return explicit || PRODUCTION_REDIRECT_URI;
}

function loadStoredSession(): StoredOAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOAuthSession;
    if (!parsed.accessToken || !parsed.refreshToken || parsed.clientId !== CLIENT_ID) return null;
    verifyOAuthAccessToken(parsed.accessToken);
    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveStoredSession(tokens: OAuthTokenResponse) {
  verifyOAuthAccessToken(tokens.access_token);
  const stored: StoredOAuthSession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + Math.max(60, Number(tokens.expires_in) || 3600),
    clientId: CLIENT_ID,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  return stored;
}

function cancelScheduledRefresh() {
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = null;
}

function scheduleRefresh(stored: StoredOAuthSession) {
  cancelScheduledRefresh();
  const now = Math.floor(Date.now() / 1000);
  const seconds = Math.max(15, stored.expiresAt - now - REFRESH_SKEW_SECONDS);
  refreshTimer = window.setTimeout(() => {
    void refreshPocketBIOAuthSession().catch(async (error) => {
      console.warn('[PocketBI OAuth] Scheduled refresh failed:', error);
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* local cleanup only */ }
      await clearPocketBIOAuthSession();
    });
  }, seconds * 1000);
}

async function tokenRequest(params: Record<string, string>) {
  if (!SUPABASE_URL || !CLIENT_ID) throw new Error('PocketBI ID connection is not configured for this bIDE deployment.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(params),
  });
  const payload = await response.json().catch(() => ({})) as Partial<OAuthTokenResponse> & { error?: string; error_description?: string };
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(payload.error_description || payload.error || 'PocketBI could not complete the secure connection.');
  }
  verifyOAuthAccessToken(payload.access_token);
  return payload as OAuthTokenResponse;
}

async function seedSupabaseSession(stored: StoredOAuthSession) {
  await supabase.auth.stopAutoRefresh();
  const { error } = await supabase.auth.setSession({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
  });
  await supabase.auth.stopAutoRefresh();
  if (error) throw error;
}

async function refreshPocketBIOAuthSession() {
  const stored = loadStoredSession();
  if (!stored) return false;
  const tokens = await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
    client_id: CLIENT_ID,
  });
  const refreshed = saveStoredSession(tokens);
  await seedSupabaseSession(refreshed);
  scheduleRefresh(refreshed);
  return true;
}

export function isPocketBIOAuthConfigured() {
  return Boolean(SUPABASE_URL && CLIENT_ID);
}

export function isPocketBIOAuthSession() {
  return Boolean(loadStoredSession());
}

export async function beginPocketBIOAuth(returnTo = '/ide') {
  if (!isPocketBIOAuthConfigured()) throw new Error('PocketBI ID connection is not configured for this bIDE deployment yet.');
  const verifier = randomUrlSafe(48);
  const state = randomUrlSafe(32);
  const redirectUri = configuredRedirectUri();
  const transaction: OAuthTransaction = {
    state,
    verifier,
    returnTo: safeReturnTo(returnTo),
    redirectUri,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction));
  const challenge = await sha256UrlSafe(verifier);
  const authorize = new URL(`${SUPABASE_URL}/auth/v1/oauth/authorize`);
  authorize.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'email',
  }).toString();
  window.location.assign(authorize.toString());
}

export async function completePocketBIOAuth(search = window.location.search) {
  if (!isPocketBIOAuthConfigured()) throw new Error('PocketBI ID connection is not configured for this bIDE deployment.');
  const params = new URLSearchParams(search);
  const oauthError = params.get('error');
  if (oauthError) throw new Error(params.get('error_description') || oauthError);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) throw new Error('PocketBI returned an incomplete authorization response.');

  const raw = sessionStorage.getItem(TRANSACTION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  if (!raw) throw new Error('This PocketBI connection request is no longer active. Start again from bIDE.');
  const transaction = JSON.parse(raw) as OAuthTransaction;
  if (transaction.state !== state) throw new Error('PocketBI rejected this connection because the security state did not match.');
  if (Date.now() - transaction.createdAt > MAX_TRANSACTION_AGE_MS) throw new Error('This PocketBI connection request expired. Start again from bIDE.');
  if (transaction.redirectUri !== configuredRedirectUri()) throw new Error('PocketBI callback address changed during authorization. Start again from bIDE.');

  const tokens = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: transaction.redirectUri,
    code_verifier: transaction.verifier,
  });
  const stored = saveStoredSession(tokens);
  await seedSupabaseSession(stored);
  scheduleRefresh(stored);
  history.replaceState(null, '', CALLBACK_PATH);
  return safeReturnTo(transaction.returnTo);
}

export async function ensurePocketBIOAuthSession() {
  if (!isPocketBIOAuthConfigured()) return false;
  const stored = loadStoredSession();
  if (!stored) return false;
  await supabase.auth.stopAutoRefresh();
  const now = Math.floor(Date.now() / 1000);
  if (stored.expiresAt <= now + REFRESH_SKEW_SECONDS) {
    return refreshPocketBIOAuthSession();
  }
  await seedSupabaseSession(stored);
  scheduleRefresh(stored);
  return true;
}

export async function clearPocketBIOAuthSession() {
  cancelScheduledRefresh();
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  await supabase.auth.startAutoRefresh();
}

export async function markDirectPocketBISession() {
  cancelScheduledRefresh();
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  await supabase.auth.startAutoRefresh();
}
