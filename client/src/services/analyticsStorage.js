const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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
  window.dispatchEvent(
    new Event(ANALYTICS_STATE_EVENT)
  );
}

function createUuid() {
  const webCrypto = window.crypto;

  if (!webCrypto?.getRandomValues) {
    return null;
  }

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
    readLocalStorage(
      ANALYTICS_STORAGE_KEYS.disabled
    ) === 'true'
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
  removeLocalStorage(
    ANALYTICS_STORAGE_KEYS.disabled
  );

  notifyAnalyticsStateChanged();
}

export function canCollectAnalytics() {
  return (
    isAnalyticsEnvironmentEnabled() &&
    !isAnalyticsDisabledInBrowser()
  );
}

export function getOrCreateVisitorId() {
  if (!canCollectAnalytics()) {
    return null;
  }

  const existing = readLocalStorage(
    ANALYTICS_STORAGE_KEYS.visitorId
  );

  if (isUuid(existing)) {
    return existing;
  }

  const visitorId = createUuid();

  if (!visitorId) {
    return null;
  }

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

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw);

    if (
      !isUuid(session?.id) ||
      !Number.isFinite(session?.lastActivityAt)
    ) {
      return null;
    }

    return session;
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

export function getOrCreateSessionId(
  now = Date.now()
) {
  if (!canCollectAnalytics()) {
    return null;
  }

  const existing = readStoredSession();

  if (
    existing &&
    now - existing.lastActivityAt >= 0 &&
    now - existing.lastActivityAt <
      SESSION_TIMEOUT_MS
  ) {
    const refreshed = {
      id: existing.id,
      lastActivityAt: now,
    };

    return saveSession(refreshed)
      ? existing.id
      : null;
  }

  const sessionId = createUuid();

  if (!sessionId) {
    return null;
  }

  const nextSession = {
    id: sessionId,
    lastActivityAt: now,
  };

  return saveSession(nextSession)
    ? sessionId
    : null;
}

export function touchAnalyticsSession(
  now = Date.now()
) {
  if (!canCollectAnalytics()) {
    return null;
  }

  const existing = readStoredSession();

  if (
    !existing ||
    now - existing.lastActivityAt < 0 ||
    now - existing.lastActivityAt >=
      SESSION_TIMEOUT_MS
  ) {
    return getOrCreateSessionId(now);
  }

  const refreshed = {
    id: existing.id,
    lastActivityAt: now,
  };

  return saveSession(refreshed)
    ? existing.id
    : null;
}

export function createAnalyticsEventId() {
  if (!canCollectAnalytics()) {
    return null;
  }

  return createUuid();
}

export const ANALYTICS_SESSION_TIMEOUT_MS =
  SESSION_TIMEOUT_MS;