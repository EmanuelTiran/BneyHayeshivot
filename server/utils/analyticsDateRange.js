const { getRetentionDays } = require('./analyticsUtils');

const ANALYTICS_TIME_ZONE = 'Asia/Jerusalem';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

class AnalyticsDateRangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AnalyticsDateRangeError';
    this.statusCode = 400;
  }
}

function getZonedParts(date, timeZone = ANALYTICS_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const values = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }

  return values;
}

function getTimeZoneOffset(date, timeZone = ANALYTICS_TIME_ZONE) {
  const parts = getZonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return representedAsUtc - date.getTime();
}

function zonedDateTimeToUtc(
  { year, month, day, hour = 0, minute = 0, second = 0 },
  timeZone = ANALYTICS_TIME_ZONE
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstOffset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  let result = new Date(utcGuess - firstOffset);
  const secondOffset = getTimeZoneOffset(result, timeZone);

  if (secondOffset !== firstOffset) {
    result = new Date(utcGuess - secondOffset);
  }

  return result;
}

function parseCalendarDate(value, fieldName) {
  const match = DATE_PATTERN.exec(String(value || ''));

  if (!match) {
    throw new AnalyticsDateRangeError(
      `${fieldName} must use the YYYY-MM-DD format.`
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const verification = new Date(Date.UTC(year, month - 1, day));

  if (
    verification.getUTCFullYear() !== year ||
    verification.getUTCMonth() + 1 !== month ||
    verification.getUTCDate() !== day
  ) {
    throw new AnalyticsDateRangeError(`${fieldName} is not a valid date.`);
  }

  return { year, month, day };
}

function addCalendarDays(parts, amount) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function formatCalendarDate(parts) {
  return [
    String(parts.year).padStart(4, '0'),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

function chooseGranularity(dayCount, preset) {
  if (preset === 'today' || dayCount <= 2) return 'hour';
  if (dayCount <= 90) return 'day';
  if (dayCount <= 365) return 'week';
  return 'month';
}

function resolveAnalyticsDateRange(query = {}, now = new Date()) {
  const preset = String(query.preset || '30d').toLowerCase();
  const current = getZonedParts(now);
  const today = {
    year: current.year,
    month: current.month,
    day: current.day,
  };

  let startParts;
  let endExclusive;
  let endDateLabel;
  let dayCount;

  if (preset === 'today') {
    startParts = today;
    endExclusive = now;
    endDateLabel = formatCalendarDate(today);
    dayCount = 1;
  } else if (preset === '7d' || preset === '30d') {
    dayCount = preset === '7d' ? 7 : 30;
    startParts = addCalendarDays(today, -(dayCount - 1));
    endExclusive = now;
    endDateLabel = formatCalendarDate(today);
  } else if (preset === 'custom') {
    startParts = parseCalendarDate(query.from, 'from');
    const inclusiveEndParts = parseCalendarDate(query.to, 'to');
    const startOrdinal = Date.UTC(
      startParts.year,
      startParts.month - 1,
      startParts.day
    );
    const endOrdinal = Date.UTC(
      inclusiveEndParts.year,
      inclusiveEndParts.month - 1,
      inclusiveEndParts.day
    );

    if (endOrdinal < startOrdinal) {
      throw new AnalyticsDateRangeError('to must not be earlier than from.');
    }

    dayCount = Math.floor((endOrdinal - startOrdinal) / 86400000) + 1;

    if (dayCount > getRetentionDays()) {
      throw new AnalyticsDateRangeError(
        `The selected range cannot exceed ${getRetentionDays()} days.`
      );
    }

    endExclusive = zonedDateTimeToUtc(addCalendarDays(inclusiveEndParts, 1));
    endDateLabel = formatCalendarDate(inclusiveEndParts);
  } else {
    throw new AnalyticsDateRangeError('Unsupported analytics preset.');
  }

  const from = zonedDateTimeToUtc(startParts);

  if (!(endExclusive instanceof Date) || Number.isNaN(endExclusive.getTime())) {
    throw new AnalyticsDateRangeError('Could not calculate the end of the range.');
  }

  return {
    preset,
    from,
    to: endExclusive,
    fromDate: formatCalendarDate(startParts),
    toDate: endDateLabel,
    dayCount,
    granularity: chooseGranularity(dayCount, preset),
    timeZone: ANALYTICS_TIME_ZONE,
  };
}

module.exports = {
  ANALYTICS_TIME_ZONE,
  AnalyticsDateRangeError,
  addCalendarDays,
  getZonedParts,
  resolveAnalyticsDateRange,
  zonedDateTimeToUtc,
};