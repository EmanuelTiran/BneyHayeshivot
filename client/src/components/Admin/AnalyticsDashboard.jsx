/* eslint-disable react/prop-types */

import {
    useEffect,
    useMemo,
    useState,
  } from 'react';
  
  import {
    Activity,
    BarChart3,
    CalendarDays,
    Clock,
    Eye,
    Globe2,
    MonitorSmartphone,
    RefreshCw,
    Users,
  } from 'lucide-react';
  
  import {
    fetchAnalyticsReport,
  } from '../../services/analyticsReportApi';
  
  const TIME_ZONE = 'Asia/Jerusalem';
  
  const PRESETS = [
    {
      id: 'today',
      label: 'היום',
    },
    {
      id: '7d',
      label: '7 ימים',
    },
    {
      id: '30d',
      label: '30 ימים',
    },
    {
      id: 'custom',
      label: 'טווח מותאם',
    },
  ];
  
  const DEVICE_LABELS = {
    mobile: 'טלפון',
    desktop: 'מחשב',
    tablet: 'טאבלט',
    unknown: 'לא ידוע',
  };
  
  const SOURCE_LABELS = {
    direct: 'כניסה ישירה',
    google: 'Google',
    social: 'רשת חברתית',
    referral: 'אתר אחר',
    internal: 'מעבר פנימי',
    unknown: 'לא ידוע',
  };
  
  const numberFormatter =
    new Intl.NumberFormat('he-IL');
  
  const dateTimeFormatter =
    new Intl.DateTimeFormat(
      'he-IL',
      {
        timeZone: TIME_ZONE,
        dateStyle: 'short',
        timeStyle: 'short',
      }
    );
  
  function formatDateInput(date) {
    const parts =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone: TIME_ZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }
      ).formatToParts(date);
  
    const values =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !== 'literal'
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ]
          )
      );
  
    return `${values.year}-${values.month}-${values.day}`;
  }
  
  function formatNumber(value) {
    return numberFormatter.format(
      Number(value) || 0
    );
  }
  
  function formatDuration(seconds) {
    const totalSeconds = Math.max(
      0,
      Math.round(
        Number(seconds) || 0
      )
    );
  
    if (totalSeconds < 60) {
      return `${totalSeconds} שנ׳`;
    }
  
    const hours = Math.floor(
      totalSeconds / 3600
    );
  
    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );
  
    const remainingSeconds =
      totalSeconds % 60;
  
    if (hours > 0) {
      return `${hours} שע׳ ${minutes} דק׳`;
    }
  
    return `${minutes} דק׳ ${remainingSeconds} שנ׳`;
  }
  
  function formatDateTime(value) {
    if (!value) return '—';
  
    const date = new Date(value);
  
    return Number.isNaN(
      date.getTime()
    )
      ? '—'
      : dateTimeFormatter.format(date);
  }
  
  function formatBucket(
    value,
    granularity
  ) {
    const date = new Date(value);
  
    if (
      Number.isNaN(date.getTime())
    ) {
      return '';
    }
  
    if (granularity === 'hour') {
      return new Intl.DateTimeFormat(
        'he-IL',
        {
          timeZone: TIME_ZONE,
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(date);
    }
  
    if (granularity === 'month') {
      return new Intl.DateTimeFormat(
        'he-IL',
        {
          timeZone: TIME_ZONE,
          month: 'short',
          year: 'numeric',
        }
      ).format(date);
    }
  
    return new Intl.DateTimeFormat(
      'he-IL',
      {
        timeZone: TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
      }
    ).format(date);
  }
  
  function getErrorMessage(error) {
    const status =
      error?.response?.status;
  
    if (status === 403) {
      return 'הדוח זמין למנהלים בלבד.';
    }
  
    if (status === 429) {
      return 'בוצעו יותר מדי בקשות. נסה שוב בעוד דקה.';
    }
  
    return (
      error?.response?.data?.message ||
      'לא ניתן לטעון את נתוני הסטטיסטיקה כרגע.'
    );
  }
  
  function SummaryCard({
    icon: Icon,
    title,
    value,
    description,
    accent,
  }) {
    return (
      <article
        className="relative overflow-hidden rounded-2xl border p-5 shadow-lg"
        style={{
          background:
            'linear-gradient(145deg, rgba(18,43,77,.99), rgba(10,25,47,.99))',
          borderColor: `${accent}66`,
          boxShadow:
            `0 14px 35px rgba(13,35,64,.18), inset 0 0 28px ${accent}0d`,
        }}
      >
        <div
          className="absolute -left-8 -top-8 h-28 w-28 rounded-full blur-2xl"
          style={{
            background:
              `${accent}22`,
          }}
          aria-hidden="true"
        />
  
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#f7f4e9]/65">
              {title}
            </p>
  
            <p className="mt-2 text-3xl font-extrabold text-[#f7d98a]">
              {formatNumber(value)}
            </p>
  
            <p className="mt-2 text-xs leading-5 text-[#f7f4e9]/55">
              {description}
            </p>
          </div>
  
          <div
            className="rounded-xl border p-3"
            style={{
              color: accent,
              borderColor:
                `${accent}55`,
              background:
                `${accent}14`,
            }}
          >
            <Icon
              size={23}
              aria-hidden="true"
            />
          </div>
        </div>
      </article>
    );
  }
  
  function TimelineChart({
    rows,
    granularity,
  }) {
    const width = 900;
    const height = 280;
  
    const padding = {
      top: 25,
      right: 25,
      bottom: 48,
      left: 55,
    };
  
    const chartWidth =
      width -
      padding.left -
      padding.right;
  
    const chartHeight =
      height -
      padding.top -
      padding.bottom;
  
    const maximum = Math.max(
      1,
      ...rows.flatMap(
        (row) => [
          row.pageViews || 0,
          row.sessions || 0,
        ]
      )
    );
  
    const getX = (index) =>
      rows.length <= 1
        ? padding.left +
          chartWidth / 2
        : padding.left +
          (
            index /
            (rows.length - 1)
          ) *
            chartWidth;
  
    const getY = (value) =>
      padding.top +
      chartHeight -
      (
        (Number(value) || 0) /
        maximum
      ) *
        chartHeight;
  
    const createPath = (field) =>
      rows
        .map(
          (row, index) => {
            const command =
              index === 0
                ? 'M'
                : 'L';
  
            return `${command} ${getX(index)} ${getY(row[field])}`;
          }
        )
        .join(' ');
  
    const labelStep = Math.max(
      1,
      Math.ceil(
        rows.length / 6
      )
    );
  
    return (
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] min-w-[650px] w-full"
          role="img"
          aria-label="גרף צפיות וביקורים לאורך זמן"
        >
          <defs>
            <linearGradient
              id="analyticsViewsFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#cfa756"
                stopOpacity="0.32"
              />
  
              <stop
                offset="100%"
                stopColor="#cfa756"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
  
          {[
            0,
            0.25,
            0.5,
            0.75,
            1,
          ].map(
            (ratio) => {
              const y =
                padding.top +
                chartHeight * ratio;
  
              const label =
                Math.round(
                  maximum *
                    (1 - ratio)
                );
  
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    x2={
                      width -
                      padding.right
                    }
                    y1={y}
                    y2={y}
                    stroke="rgba(247,244,233,.12)"
                  />
  
                  <text
                    x={
                      padding.left -
                      10
                    }
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="rgba(247,244,233,.55)"
                  >
                    {formatNumber(
                      label
                    )}
                  </text>
                </g>
              );
            }
          )}
  
          {rows.length > 1 && (
            <path
              d={`${createPath(
                'pageViews'
              )} L ${getX(
                rows.length - 1
              )} ${
                padding.top +
                chartHeight
              } L ${getX(0)} ${
                padding.top +
                chartHeight
              } Z`}
              fill="url(#analyticsViewsFill)"
            />
          )}
  
          <path
            d={createPath(
              'pageViews'
            )}
            fill="none"
            stroke="#f7d98a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
  
          <path
            d={createPath(
              'sessions'
            )}
            fill="none"
            stroke="#78b7e8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
  
          {rows.map(
            (row, index) => (
              <g key={row.bucket}>
                <circle
                  cx={getX(index)}
                  cy={getY(
                    row.pageViews
                  )}
                  r="4"
                  fill="#f7d98a"
                >
                  <title>
                    {`${formatBucket(
                      row.bucket,
                      granularity
                    )} — ${formatNumber(
                      row.pageViews
                    )} צפיות`}
                  </title>
                </circle>
  
                <circle
                  cx={getX(index)}
                  cy={getY(
                    row.sessions
                  )}
                  r="4"
                  fill="#78b7e8"
                >
                  <title>
                    {`${formatBucket(
                      row.bucket,
                      granularity
                    )} — ${formatNumber(
                      row.sessions
                    )} ביקורים`}
                  </title>
                </circle>
  
                {(
                  index %
                    labelStep ===
                    0 ||
                  index ===
                    rows.length - 1
                ) && (
                  <text
                    x={getX(index)}
                    y={height - 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgba(247,244,233,.62)"
                  >
                    {formatBucket(
                      row.bucket,
                      granularity
                    )}
                  </text>
                )}
              </g>
            )
          )}
        </svg>
      </div>
    );
  }
  
  function BreakdownCard({
    title,
    icon: Icon,
    rows,
    labels = {},
  }) {
    const total = rows.reduce(
      (sum, row) =>
        sum +
        (
          Number(row.count) ||
          0
        ),
      0
    );
  
    return (
      <section className="rounded-2xl border border-[#cfa756]/25 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-[#0d2340]">
          <Icon
            size={20}
            className="text-[#b8860b]"
            aria-hidden="true"
          />
  
          <h3 className="font-bold">
            {title}
          </h3>
        </div>
  
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            אין נתונים בטווח זה
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map(
              (row) => {
                const percentage =
                  total > 0
                    ? Math.round(
                        (
                          row.count /
                          total
                        ) *
                          100
                      )
                    : 0;
  
                return (
                  <div
                    key={row.name}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-[#0d2340]">
                        {
                          labels[
                            row.name
                          ] ||
                          row.name ||
                          'לא ידוע'
                        }
                      </span>
  
                      <span className="text-gray-500">
                        {formatNumber(
                          row.count
                        )}{' '}
                        · {percentage}%
                      </span>
                    </div>
  
                    <div className="h-2 overflow-hidden rounded-full bg-[#0d2340]/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-[#b8860b] to-[#f7d98a]"
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    );
  }
  
  function AnalyticsDashboard() {
    const today = useMemo(
      () =>
        formatDateInput(
          new Date()
        ),
      []
    );
  
    const initialFrom =
      useMemo(
        () =>
          formatDateInput(
            new Date(
              Date.now() -
                6 * 86400000
            )
          ),
        []
      );
  
    const [
      query,
      setQuery,
    ] = useState({
      preset: '30d',
    });
  
    const [
      selectedPreset,
      setSelectedPreset,
    ] = useState('30d');
  
    const [
      customRange,
      setCustomRange,
    ] = useState({
      from: initialFrom,
      to: today,
    });
  
    const [
      customError,
      setCustomError,
    ] = useState('');
  
    const [
      report,
      setReport,
    ] = useState(null);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState('');
  
    const [
      refreshKey,
      setRefreshKey,
    ] = useState(0);
  
    useEffect(() => {
      const controller =
        new AbortController();
  
      const loadReport =
        async () => {
          setLoading(true);
          setError('');
  
          try {
            const data =
              await fetchAnalyticsReport(
                query,
                {
                  signal:
                    controller.signal,
                }
              );
  
            setReport(data);
          } catch (
            requestError
          ) {
            if (
              requestError?.code !==
              'ERR_CANCELED'
            ) {
              setError(
                getErrorMessage(
                  requestError
                )
              );
            }
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setLoading(false);
            }
          }
        };
  
      loadReport();
  
      return () =>
        controller.abort();
    }, [
      query,
      refreshKey,
    ]);
  
    const handlePreset = (
      preset
    ) => {
      setSelectedPreset(preset);
      setCustomError('');
  
      if (
        preset !== 'custom'
      ) {
        setQuery({
          preset,
        });
      }
    };
  
    const applyCustomRange =
      () => {
        setCustomError('');
  
        if (
          !customRange.from ||
          !customRange.to
        ) {
          setCustomError(
            'יש לבחור תאריך התחלה ותאריך סיום.'
          );
  
          return;
        }
  
        if (
          customRange.from >
          customRange.to
        ) {
          setCustomError(
            'תאריך הסיום אינו יכול להיות מוקדם מתאריך ההתחלה.'
          );
  
          return;
        }
  
        setQuery({
          preset: 'custom',
          from:
            customRange.from,
          to:
            customRange.to,
        });
      };
  
    const summary =
      report?.summary || {};
  
    const timeline =
      Array.isArray(
        report?.timeline
      )
        ? report.timeline
        : [];
  
    const topPages =
      Array.isArray(
        report?.topPages
      )
        ? report.topPages
        : [];
  
    const recentSessions =
      Array.isArray(
        report?.recentSessions
      )
        ? report.recentSessions
        : [];
  
    const hasRangeData =
      (
        summary.pageViews ||
        0
      ) >
        0 ||
      (
        summary.sessions ||
        0
      ) >
        0;
  
    const visitorRows = [
      {
        name: 'new',
        count:
          summary.newVisitors ||
          0,
      },
      {
        name: 'returning',
        count:
          summary.returningVisitors ||
          0,
      },
    ].filter(
      (row) =>
        row.count > 0
    );
  
    return (
      <section
        dir="rtl"
        className="mx-auto max-w-7xl pb-8"
      >
        <header
          className="relative mb-6 overflow-hidden rounded-2xl border border-[#cfa756]/35 px-5 py-7 text-center"
          style={{
            background:
              'linear-gradient(135deg, #0a192f 0%, #0d2340 52%, #122b4d 100%)',
            boxShadow:
              '0 12px 30px rgba(13,35,64,.22)',
          }}
        >
          <BarChart3
            className="mx-auto mb-3 text-[#f7d98a]"
            size={31}
            aria-hidden="true"
          />
  
          <h2 className="text-2xl font-extrabold text-[#f7d98a] sm:text-3xl">
            סטטיסטיקות אתר
          </h2>
  
          <p className="mt-2 text-sm text-[#f7f4e9]/70">
            תמונת מצב מצמצמת פרטיות
            {' · '}
            אזור זמן
            {' '}
            Asia/Jerusalem
          </p>
        </header>
  
        <section className="mb-6 rounded-2xl border border-[#cfa756]/25 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-[#0d2340]">
                בחירת טווח
              </p>
  
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(
                  (preset) => (
                    <button
                      key={
                        preset.id
                      }
                      type="button"
                      onClick={() =>
                        handlePreset(
                          preset.id
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedPreset ===
                        preset.id
                          ? 'border-[#0d2340] bg-[#0d2340] text-[#f7d98a]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[#cfa756] hover:text-[#0d2340]'
                      }`}
                    >
                      {
                        preset.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>
  
            {selectedPreset ===
              'custom' && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="text-xs font-semibold text-gray-600">
                  מתאריך
  
                  <input
                    type="date"
                    value={
                      customRange.from
                    }
                    max={today}
                    onChange={(
                      event
                    ) =>
                      setCustomRange(
                        (
                          current
                        ) => ({
                          ...current,
                          from:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#cfa756] focus:ring-2 focus:ring-[#cfa756]/20"
                  />
                </label>
  
                <label className="text-xs font-semibold text-gray-600">
                  עד תאריך
  
                  <input
                    type="date"
                    value={
                      customRange.to
                    }
                    max={today}
                    onChange={(
                      event
                    ) =>
                      setCustomRange(
                        (
                          current
                        ) => ({
                          ...current,
                          to:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#cfa756] focus:ring-2 focus:ring-[#cfa756]/20"
                  />
                </label>
  
                <button
                  type="button"
                  onClick={
                    applyCustomRange
                  }
                  className="rounded-lg bg-[#cfa756] px-4 py-2 text-sm font-bold text-[#0d2340] hover:bg-[#b8860b]"
                >
                  הצג טווח
                </button>
              </div>
            )}
  
            <button
              type="button"
              onClick={() =>
                setRefreshKey(
                  (value) =>
                    value + 1
                )
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0d2340]/20 bg-[#0d2340] px-4 py-2 text-sm font-bold text-[#f7d98a] transition hover:bg-[#1a365d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
                aria-hidden="true"
              />
  
              רענון
            </button>
          </div>
  
          {customError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {customError}
            </p>
          )}
  
          {report?.range && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays
                  size={14}
                  aria-hidden="true"
                />
  
                {
                  report.range
                    .fromDate
                }
                {' '}
                עד
                {' '}
                {
                  report.range
                    .toDate
                }
              </span>
  
              <span>
                שמירת נתונים: עד
                {' '}
                {formatNumber(
                  report.range
                    .retentionDays
                )}
                {' '}
                ימים
              </span>
  
              <span>
                עודכן:
                {' '}
                {formatDateTime(
                  report.generatedAt
                )}
              </span>
            </div>
          )}
        </section>
  
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-bold text-red-700">
              טעינת הסטטיסטיקות נכשלה
            </p>
  
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
  
            <button
              type="button"
              onClick={() =>
                setRefreshKey(
                  (value) =>
                    value + 1
                )
              }
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              נסה שוב
            </button>
          </div>
        )}
  
        {loading &&
          !report && (
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="טוען סטטיסטיקות"
          >
            {[
              0,
              1,
              2,
              3,
            ].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl bg-[#0d2340]/15"
                />
              )
            )}
          </div>
        )}
  
        {report &&
          !error && (
          <>
            <div
              className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${
                loading
                  ? 'opacity-60'
                  : ''
              }`}
            >
              <SummaryCard
                icon={Eye}
                title="צפיות בעמודים"
                value={
                  summary.pageViews
                }
                description="כל צפייה או מעבר לעמוד בטווח הנבחר"
                accent="#f7d98a"
              />
  
              <SummaryCard
                icon={Activity}
                title="ביקורים"
                value={
                  summary.sessions
                }
                description="Sessions שהתחילו בטווח הנבחר"
                accent="#78b7e8"
              />
  
              <SummaryCard
                icon={Users}
                title="מבקרים ייחודיים"
                value={
                  summary.uniqueVisitors
                }
                description="אומדן לפי מזהה דפדפן אקראי"
                accent="#8dd7b5"
              />
  
              <SummaryCard
                icon={Activity}
                title="פעילים כעת"
                value={
                  summary.activeVisitors
                }
                description="מבקרים ייחודיים שנראו ב־90 השניות האחרונות"
                accent="#ff9f7f"
              />
            </div>
  
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-xs font-semibold text-gray-500">
                  משך ביקור ממוצע
                </p>
  
                <p className="mt-1 text-xl font-bold text-[#0d2340]">
                  {formatDuration(
                    summary.averageSessionDurationSeconds
                  )}
                </p>
              </div>
  
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-xs font-semibold text-gray-500">
                  מבקרים חדשים
                </p>
  
                <p className="mt-1 text-xl font-bold text-[#0d2340]">
                  {formatNumber(
                    summary.newVisitors
                  )}
                </p>
              </div>
  
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-xs font-semibold text-gray-500">
                  מבקרים חוזרים
                </p>
  
                <p className="mt-1 text-xl font-bold text-[#0d2340]">
                  {formatNumber(
                    summary.returningVisitors
                  )}
                </p>
              </div>
            </div>
  
            {!hasRangeData && (
              <div className="mt-6 rounded-2xl border border-dashed border-[#cfa756]/60 bg-[#fffaf0] px-5 py-10 text-center">
                <BarChart3
                  className="mx-auto text-[#b8860b]"
                  size={34}
                  aria-hidden="true"
                />
  
                <h3 className="mt-3 font-bold text-[#0d2340]">
                  אין נתונים בטווח שנבחר
                </h3>
  
                <p className="mt-1 text-sm text-gray-500">
                  נסה לבחור טווח אחר או ודא שמעקב Production פעיל.
                </p>
              </div>
            )}
  
            {hasRangeData && (
              <>
                <section className="mt-6 rounded-2xl border border-[#cfa756]/25 bg-[#0d2340] p-4 shadow-lg sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[#f7d98a]">
                        כניסות לאורך זמן
                      </h3>
  
                      <p className="mt-1 text-xs text-[#f7f4e9]/55">
                        צפיות לעומת ביקורים
                        {' · '}
                        Asia/Jerusalem
                      </p>
                    </div>
  
                    <div className="flex gap-4 text-xs text-[#f7f4e9]/70">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f7d98a]" />
                        צפיות
                      </span>
  
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#78b7e8]" />
                        ביקורים
                      </span>
                    </div>
                  </div>
  
                  <TimelineChart
                    rows={timeline}
                    granularity={
                      report.range
                        .granularity
                    }
                  />
                </section>
  
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <section className="overflow-hidden rounded-2xl border border-[#cfa756]/25 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                      <Eye
                        size={20}
                        className="text-[#b8860b]"
                        aria-hidden="true"
                      />
  
                      <h3 className="font-bold text-[#0d2340]">
                        העמודים הפופולריים ביותר
                      </h3>
                    </div>
  
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[430px] text-sm">
                        <thead className="bg-[#f7f4ee] text-right text-xs text-gray-500">
                          <tr>
                            <th className="px-5 py-3">
                              #
                            </th>
  
                            <th className="px-5 py-3">
                              עמוד
                            </th>
  
                            <th className="px-5 py-3 text-left">
                              צפיות
                            </th>
                          </tr>
                        </thead>
  
                        <tbody>
                          {topPages.map(
                            (
                              page,
                              index
                            ) => (
                              <tr
                                key={
                                  page.path
                                }
                                className="border-t border-gray-100"
                              >
                                <td className="px-5 py-3 text-gray-400">
                                  {index +
                                    1}
                                </td>
  
                                <td
                                  className="px-5 py-3 font-medium text-[#0d2340]"
                                  dir="ltr"
                                >
                                  {
                                    page.path
                                  }
                                </td>
  
                                <td className="px-5 py-3 text-left font-bold text-[#b8860b]">
                                  {formatNumber(
                                    page.count
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
  
                  <BreakdownCard
                    title="חדשים לעומת חוזרים"
                    icon={Users}
                    rows={visitorRows}
                    labels={{
                      new:
                        'מבקרים חדשים',
                      returning:
                        'מבקרים חוזרים',
                    }}
                  />
                </div>
  
                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <BreakdownCard
                    title="סוגי מכשירים"
                    icon={
                      MonitorSmartphone
                    }
                    rows={
                      report.devices ||
                      []
                    }
                    labels={
                      DEVICE_LABELS
                    }
                  />
  
                  <BreakdownCard
                    title="מקורות הגעה"
                    icon={Globe2}
                    rows={
                      report.sources ||
                      []
                    }
                    labels={
                      SOURCE_LABELS
                    }
                  />
  
                  <BreakdownCard
                    title="דפדפנים"
                    icon={BarChart3}
                    rows={
                      report.browsers ||
                      []
                    }
                  />
  
                  <BreakdownCard
                    title="מערכות הפעלה"
                    icon={
                      MonitorSmartphone
                    }
                    rows={
                      report.operatingSystems ||
                      []
                    }
                  />
                </div>
  
                <section className="mt-6 overflow-hidden rounded-2xl border border-[#cfa756]/25 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={20}
                        className="text-[#b8860b]"
                        aria-hidden="true"
                      />
  
                      <h3 className="font-bold text-[#0d2340]">
                        ביקורים אחרונים בטווח
                      </h3>
                    </div>
  
                    <span className="text-xs text-gray-400">
                      עד 25 ביקורים אחרונים
                    </span>
                  </div>
  
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-sm">
                      <thead className="bg-[#f7f4ee] text-right text-xs text-gray-500">
                        <tr>
                          <th className="px-4 py-3">
                            זמן כניסה
                          </th>
  
                          <th className="px-4 py-3">
                            משך פעיל
                          </th>
  
                          <th className="px-4 py-3">
                            עמוד ראשון
                          </th>
  
                          <th className="px-4 py-3">
                            עמוד אחרון
                          </th>
  
                          <th className="px-4 py-3">
                            מקור
                          </th>
  
                          <th className="px-4 py-3">
                            מכשיר
                          </th>
  
                          <th className="px-4 py-3">
                            דפדפן / מערכת
                          </th>
  
                          <th className="px-4 py-3">
                            סוג
                          </th>
  
                          <th className="px-4 py-3">
                            מצב
                          </th>
                        </tr>
                      </thead>
  
                      <tbody>
                        {recentSessions.map(
                          (
                            session,
                            index
                          ) => (
                            <tr
                              key={`${session.startedAt}-${index}`}
                              className="border-t border-gray-100 text-gray-600"
                            >
                              <td className="whitespace-nowrap px-4 py-3">
                                {formatDateTime(
                                  session.startedAt
                                )}
                              </td>
  
                              <td className="whitespace-nowrap px-4 py-3">
                                {formatDuration(
                                  session.activeDurationSeconds
                                )}
                              </td>
  
                              <td
                                className="max-w-[170px] truncate px-4 py-3"
                                dir="ltr"
                              >
                                {
                                  session.firstPage ||
                                  '—'
                                }
                              </td>
  
                              <td
                                className="max-w-[170px] truncate px-4 py-3"
                                dir="ltr"
                              >
                                {
                                  session.lastPage ||
                                  '—'
                                }
                              </td>
  
                              <td className="px-4 py-3">
                                {
                                  SOURCE_LABELS[
                                    session
                                      .source
                                  ] ||
                                  session.source ||
                                  'לא ידוע'
                                }
                              </td>
  
                              <td className="px-4 py-3">
                                {
                                  DEVICE_LABELS[
                                    session
                                      .device
                                  ] ||
                                  session.device ||
                                  'לא ידוע'
                                }
                              </td>
  
                              <td className="px-4 py-3">
                                {
                                  session.browser ||
                                  'Other'
                                }
                                {' / '}
                                {
                                  session.os ||
                                  'Other'
                                }
                              </td>
  
                              <td className="px-4 py-3">
                                {
                                  session.authenticated
                                    ? 'משתמש מחובר'
                                    : 'אנונימי'
                                }
                              </td>
  
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                                    session.active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {
                                    session.active
                                      ? 'פעיל'
                                      : 'הסתיים'
                                  }
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
  
            <p className="mt-6 rounded-xl border border-[#cfa756]/20 bg-[#fffaf0] px-4 py-3 text-xs leading-6 text-gray-600">
              הנתונים הם אומדן שימוש ולא זיהוי ודאי של בני אדם.
              מחיקת אחסון בדפדפן, מעבר בין מכשירים, חסימות פרטיות
              וסינון בוטים עשויים להשפיע על המספרים.
            </p>
          </>
        )}
      </section>
    );
  }
  
  export default AnalyticsDashboard;