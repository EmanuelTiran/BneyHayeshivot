const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ANONYMOUS_IDENTITY_KEY = 'anonymous';
const AUTHENTICATED_IDENTITY_KEY = 'authenticated';
const USER_IDENTITY_PATTERN = /^user:[0-9a-f]{24}$/i;

export const ANALYTICS_STORAGE_KEYS = Object.freeze({
  visitorId: 'bneyhayeshivot.analytics.visitor_id',
  session: 'bneyhayeshivot.analytics.session',
  disabled: 'bneyhayeshivot.analytics.disabled',
});

export const ANALYTICS_STATE_EVENT =
  'bneyhayeshivot:analytics-state-change';

function readLocalStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeLocalStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Analytics must fail silently when browser storage is unavailable.
  }
}

function notifyAnalyticsStateChanged() {
  window.dispatchEvent(new Event(ANALYTICS_STATE_EVENT));
}

function createUuid() {
  const webCrypto = window.crypto;

  if (!webCrypto?.getRandomValues) return null;

  if (typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) =>
    byte.toString(16).padStart(2, '0')
  );

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function normalizeIdentityKey(value) {
  if (value === ANONYMOUS_IDENTITY_KEY) {
    return ANONYMOUS_IDENTITY_KEY;
  }

  if (value === AUTHENTICATED_IDENTITY_KEY) {
    return AUTHENTICATED_IDENTITY_KEY;
  }

  if (
    typeof value === 'string' &&
    USER_IDENTITY_PATTERN.test(value)
  ) {
    return value.toLowerCase();
  }

  return ANONYMOUS_IDENTITY_KEY;
}

function readStoredIdentityKey(value) {
  if (
    value === ANONYMOUS_IDENTITY_KEY ||
    value === AUTHENTICATED_IDENTITY_KEY ||
    (
      typeof value === 'string' &&
      USER_IDENTITY_PATTERN.test(value)
    )
  ) {
    return value.toLowerCase();
  }

  return null;
}

export function isAnalyticsEnvironmentEnabled() {
  const override = String(
    import.meta.env.VITE_ANALYTICS_ENABLED || ''
  ).toLowerCase();

  if (override === 'true') return true;
  if (override === 'false') return false;

  return import.meta.env.PROD;
}

export function isAnalyticsDisabledInBrowser() {
  return (
    readLocalStorage(ANALYTICS_STORAGE_KEYS.disabled) === 'true'
  );
}

export function disableAnalyticsInBrowser() {
  const saved = writeLocalStorage(
    ANALYTICS_STORAGE_KEYS.disabled,
    'true'
  );

  notifyAnalyticsStateChanged();
  return saved;
}

export function enableAnalyticsInBrowser() {
  removeLocalStorage(ANALYTICS_STORAGE_KEYS.disabled);
  notifyAnalyticsStateChanged();
}

export function canCollectAnalytics() {
  return (
    isAnalyticsEnvironmentEnabled() &&
    !isAnalyticsDisabledInBrowser()
  );
}

export function getOrCreateVisitorId() {
  if (!canCollectAnalytics()) return null;

  const existing = readLocalStorage(
    ANALYTICS_STORAGE_KEYS.visitorId
  );

  if (isUuid(existing)) return existing;

  const visitorId = createUuid();

  if (!visitorId) return null;

  return writeLocalStorage(
    ANALYTICS_STORAGE_KEYS.visitorId,
    visitorId
  )
    ? visitorId
    : null;
}

function readStoredSession() {
  const raw = readLocalStorage(
    ANALYTICS_STORAGE_KEYS.session
  );

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    if (
      !isUuid(session?.id) ||
      !Number.isFinite(session?.lastActivityAt)
    ) {
      return null;
    }

    return {
      id: session.id,
      identityKey: readStoredIdentityKey(
        session.identityKey
      ),
      lastActivityAt: session.lastActivityAt,
    };
  } catch {
    return null;
  }
}

function saveSession(session) {
  return writeLocalStorage(
    ANALYTICS_STORAGE_KEYS.session,
    JSON.stringify(session)
  );
}

export function startNewAnalyticsSession(
  identityKey = ANONYMOUS_IDENTITY_KEY,
  now = Date.now()
) {
  if (!canCollectAnalytics()) return null;

  const sessionId = createUuid();

  if (!sessionId) return null;

  const nextSession = {
    id: sessionId,
    identityKey: normalizeIdentityKey(identityKey),
    lastActivityAt: now,
  };

  return saveSession(nextSession) ? sessionId : null;
}

export function getOrCreateSessionId(
  identityKey = ANONYMOUS_IDENTITY_KEY,
  now = Date.now()
) {
  if (!canCollectAnalytics()) return null;

  const normalizedIdentityKey =
    normalizeIdentityKey(identityKey);
  const existing = readStoredSession();

  if (
    existing &&
    existing.identityKey === normalizedIdentityKey &&
    now - existing.lastActivityAt >= 0 &&
    now - existing.lastActivityAt < SESSION_TIMEOUT_MS
  ) {
    const refreshed = {
      id: existing.id,
      identityKey: normalizedIdentityKey,
      lastActivityAt: now,
    };

    return saveSession(refreshed)
      ? existing.id
      : null;
  }

  return startNewAnalyticsSession(
    normalizedIdentityKey,
    now
  );
}

export function touchAnalyticsSession(
  identityKey = ANONYMOUS_IDENTITY_KEY,
  now = Date.now()
) {
  if (!canCollectAnalytics()) return null;

  const normalizedIdentityKey =
    normalizeIdentityKey(identityKey);
  const existing = readStoredSession();

  if (
    !existing ||
    existing.identityKey !== normalizedIdentityKey ||
    now - existing.lastActivityAt < 0 ||
    now - existing.lastActivityAt >= SESSION_TIMEOUT_MS
  ) {
    return startNewAnalyticsSession(
      normalizedIdentityKey,
      now
    );
  }

  const refreshed = {
    id: existing.id,
    identityKey: normalizedIdentityKey,
    lastActivityAt: now,
  };

  return saveSession(refreshed)
    ? existing.id
    : null;
}

export function createAnalyticsEventId() {
  if (!canCollectAnalytics()) return null;

  return createUuid();
}

export const ANALYTICS_SESSION_TIMEOUT_MS =
  SESSION_TIMEOUT_MS;

export const ANALYTICS_ANONYMOUS_IDENTITY_KEY =
  ANONYMOUS_IDENTITY_KEY;