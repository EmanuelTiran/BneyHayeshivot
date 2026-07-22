const crypto = require('crypto');

const MAX_PATH_LENGTH = 300;
const MAX_HOST_LENGTH = 253;
const MAX_UTM_SOURCE_LENGTH = 64;
const MAX_ACTIVE_MS = 45 * 1000;
const DEFAULT_RETENTION_DAYS = 400;
const MIN_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 730;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BOT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|monitoring|preview|curl|wget|python-requests|httpclient/i;

const SOCIAL_PATTERN =
  /(^|\.)(facebook\.com|fb\.com|instagram\.com|twitter\.com|x\.com|t\.co|linkedin\.com|youtube\.com|youtu\.be|tiktok\.com|whatsapp\.com|t\.me|telegram\.me)$/i;

class AnalyticsValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AnalyticsValidationError';
    this.statusCode = 400;
  }
}

function getAnalyticsEnvironment() {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

function getRetentionDays() {
  const parsed = Number.parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10);

  if (!Number.isInteger(parsed)) return DEFAULT_RETENTION_DAYS;

  return Math.min(
    MAX_RETENTION_DAYS,
    Math.max(MIN_RETENTION_DAYS, parsed)
  );
}

function createExpiryDate(from = new Date()) {
  return new Date(
    from.getTime() + getRetentionDays() * 24 * 60 * 60 * 1000
  );
}

function validateAnalyticsConfiguration() {
  const secret = process.env.ANALYTICS_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'ANALYTICS_HASH_SECRET must contain at least 32 characters.'
    );
  }
}

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function requireUuid(value, fieldName) {
  if (!isValidUuid(value)) {
    throw new AnalyticsValidationError(`${fieldName} must be a valid UUID.`);
  }

  return value.toLowerCase();
}

function hashIdentifier(type, value) {
  validateAnalyticsConfiguration();

  return crypto
    .createHmac('sha256', process.env.ANALYTICS_HASH_SECRET)
    .update(`${type}:${value}`, 'utf8')
    .digest('hex');
}

function sanitizePath(value) {
  if (typeof value !== 'string') {
    throw new AnalyticsValidationError('path must be a string.');
  }

  let path = value.trim();

  if (!path.startsWith('/')) {
    throw new AnalyticsValidationError('path must start with /.');
  }

  path = path.split(/[?#]/, 1)[0];
  path = path.replace(/[\u0000-\u001f\u007f]/g, '');

  if (!path) path = '/';

  if (path.length > MAX_PATH_LENGTH) {
    throw new AnalyticsValidationError(
      `path must not exceed ${MAX_PATH_LENGTH} characters.`
    );
  }

  return path;
}

function sanitizeHostname(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return '';

  const candidate = value.trim().toLowerCase();

  if (
    !candidate ||
    candidate.length > MAX_HOST_LENGTH + 8 ||
    /[\s/@?#]/.test(candidate)
  ) {
    return '';
  }

  try {
    const hostname = new URL(`https://${candidate}`).hostname.toLowerCase();

    if (!hostname || hostname.length > MAX_HOST_LENGTH) return '';
    return hostname;
  } catch {
    return '';
  }
}

function sanitizeUtmSource(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .slice(0, MAX_UTM_SOURCE_LENGTH);
}

function sanitizeActiveMs(value) {
  const activeMs = Number(value);

  if (!Number.isFinite(activeMs) || activeMs < 0) {
    throw new AnalyticsValidationError(
      'activeMs must be a non-negative number.'
    );
  }

  return Math.min(Math.round(activeMs), MAX_ACTIVE_MS);
}

function normalizeSiteHostname(value) {
  if (!value || typeof value !== 'string') return '';

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return sanitizeHostname(value);
  }
}

function isInternalHostname(referrerHost, siteHost) {
  if (!referrerHost || !siteHost) return false;

  return (
    referrerHost === siteHost ||
    referrerHost.endsWith(`.${siteHost}`) ||
    siteHost.endsWith(`.${referrerHost}`)
  );
}

function classifySource({ referrerHost, utmSource, siteHost }) {
  const referrer = sanitizeHostname(referrerHost);
  const source = sanitizeUtmSource(utmSource);
  const normalizedSiteHost = normalizeSiteHostname(siteHost);

  if (/google/i.test(source) || /(^|\.)google\./i.test(referrer)) {
    return 'google';
  }

  if (
    /facebook|instagram|twitter|linkedin|youtube|tiktok|whatsapp|telegram|social|x-com/.test(
      source
    ) ||
    SOCIAL_PATTERN.test(referrer)
  ) {
    return 'social';
  }

  if (isInternalHostname(referrer, normalizedSiteHost)) {
    return 'internal';
  }

  if (!referrer && !source) return 'direct';
  if (referrer || source) return 'referral';
  return 'unknown';
}

function isLikelyBot(userAgent) {
  if (typeof userAgent !== 'string' || userAgent.trim().length < 8) {
    return true;
  }

  return BOT_PATTERN.test(userAgent);
}

function parseUserAgent(userAgent = '') {
  const ua = String(userAgent);

  let deviceType = 'desktop';
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  } else if (!ua) {
    deviceType = 'unknown';
  }

  let browser = 'Other';
  if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/EdgA?\//i.test(ua) || /EdgiOS/i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/CriOS\//i.test(ua) || /Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/FxiOS\//i.test(ua) || /Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) browser = 'Safari';

  let os = 'Other';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os };
}

function shouldRespectPrivacySignal(req) {
  const dnt = String(req.get('dnt') || '').toLowerCase();
  const gpc = String(req.get('sec-gpc') || '').toLowerCase();

  return dnt === '1' || dnt === 'yes' || gpc === '1';
}

function getRequestSiteHost(req) {
  const origin = req.get('origin');

  if (origin) {
    const originHost = normalizeSiteHostname(origin);
    if (originHost) return originHost;
  }

  return normalizeSiteHostname(process.env.CLIENT_URL);
}

function shouldExcludeAdmin(user) {
  const excludeAdmins = process.env.ANALYTICS_EXCLUDE_ADMINS !== 'false';
  return excludeAdmins && user?.role === 'admin';
}

module.exports = {
  AnalyticsValidationError,
  MAX_ACTIVE_MS,
  classifySource,
  createExpiryDate,
  getAnalyticsEnvironment,
  getRequestSiteHost,
  getRetentionDays,
  hashIdentifier,
  isLikelyBot,
  isValidUuid,
  parseUserAgent,
  requireUuid,
  sanitizeActiveMs,
  sanitizeHostname,
  sanitizePath,
  sanitizeUtmSource,
  shouldExcludeAdmin,
  shouldRespectPrivacySignal,
  validateAnalyticsConfiguration,
};