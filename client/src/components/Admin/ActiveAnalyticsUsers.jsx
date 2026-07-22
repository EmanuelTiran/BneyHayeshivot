import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from 'react';
  
  import {
    Activity,
    Clock,
    MonitorSmartphone,
    RefreshCw,
    Users,
  } from 'lucide-react';
  
  import {
    fetchActiveAnalyticsUsers,
  } from '../../services/analyticsReportApi';
  
  const TIME_ZONE = 'Asia/Jerusalem';
  const REFRESH_INTERVAL_MS = 30 * 1000;
  
  const ROLE_LABELS = {
    member: 'חבר',
    gabbai: 'גבאי',
  };
  
  const DEVICE_LABELS = {
    mobile: 'טלפון',
    desktop: 'מחשב',
    tablet: 'טאבלט',
    unknown: 'לא ידוע',
  };
  
  const numberFormatter = new Intl.NumberFormat('he-IL');
  
  const dateTimeFormatter = new Intl.DateTimeFormat(
    'he-IL',
    {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  );
  
  function formatNumber(value) {
    return numberFormatter.format(Number(value) || 0);
  }
  
  function formatDateTime(value) {
    if (!value) return '—';
  
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
  
    return dateTimeFormatter.format(date);
  }
  
  function formatPath(value) {
    if (!value) return 'לא ידוע';
  
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  
  function getRoleLabel(role) {
    return ROLE_LABELS[role] || 'משתמש';
  }
  
  function getDeviceLabel(device) {
    return DEVICE_LABELS[device] || 'לא ידוע';
  }
  
  function getErrorMessage(error) {
    const status = error?.response?.status;
  
    if (status === 401) {
      return 'פג תוקף ההתחברות. יש להתחבר מחדש.';
    }
  
    if (status === 403) {
      return 'רשימת המשתמשים הפעילים זמינה למנהלים בלבד.';
    }
  
    if (status === 429) {
      return 'בוצעו יותר מדי בקשות. נסה שוב בעוד דקה.';
    }
  
    return (
      error?.response?.data?.message ||
      'לא ניתן לטעון כרגע את המשתמשים הפעילים.'
    );
  }
  
  function isCanceledRequest(error) {
    return (
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.name === 'AbortError'
    );
  }
  
  function LoadingState() {
    return (
      <div
        className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="טוען משתמשים פעילים"
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-[#cfa756]/20 bg-white/60 p-4"
          >
            <div className="h-4 w-28 rounded bg-[#0d2340]/10" />
            <div className="mt-3 h-3 w-44 rounded bg-[#0d2340]/10" />
            <div className="mt-5 h-12 rounded-xl bg-[#0d2340]/5" />
          </div>
        ))}
      </div>
    );
  }
  
  function ActiveUserCard({ user }) {
    return (
      <li className="rounded-2xl border border-[#cfa756]/25 bg-white p-4 shadow-sm transition hover:border-[#cfa756]/45 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]"
                aria-label="פעיל כעת"
              />
  
              <h3 className="break-words font-bold text-[#0d2340]">
                {user.name || 'משתמש ללא שם'}
              </h3>
            </div>
  
            <p
              dir="ltr"
              className="mt-1 break-all text-left text-sm text-[#0d2340]/60"
            >
              {user.email || '—'}
            </p>
          </div>
  
          <span className="rounded-full border border-[#cfa756]/35 bg-[#fff9e8] px-3 py-1 text-xs font-bold text-[#745817]">
            {getRoleLabel(user.role)}
          </span>
        </div>
  
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="rounded-xl bg-[#f7f4ee] p-3">
            <dt className="flex items-center gap-2 font-semibold text-[#0d2340]/65">
              <Clock size={15} aria-hidden="true" />
              פעילות אחרונה
            </dt>
  
            <dd className="mt-1 font-bold text-[#0d2340]">
              {formatDateTime(user.lastActiveAt)}
            </dd>
          </div>
  
          <div className="rounded-xl bg-[#f7f4ee] p-3">
            <dt className="font-semibold text-[#0d2340]/65">
              עמוד אחרון
            </dt>
  
            <dd
              dir="ltr"
              className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium text-[#0d2340]"
              title={formatPath(user.lastPage)}
            >
              {formatPath(user.lastPage)}
            </dd>
          </div>
  
          <div className="rounded-xl bg-[#f7f4ee] p-3">
            <dt className="flex items-center gap-2 font-semibold text-[#0d2340]/65">
              <MonitorSmartphone
                size={15}
                aria-hidden="true"
              />
              מכשיר
            </dt>
  
            <dd className="mt-1 text-[#0d2340]">
              {getDeviceLabel(user.device)}
              {' · '}
              {user.browser || 'לא ידוע'}
              {' · '}
              {user.os || 'לא ידוע'}
            </dd>
          </div>
        </dl>
  
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#0d2340]/10 pt-3 text-xs text-[#0d2340]/60">
          <span>
            Sessions פעילים:{' '}
            <strong className="text-[#0d2340]">
              {formatNumber(user.activeSessionCount)}
            </strong>
          </span>
  
          <span className="font-semibold text-emerald-700">
            מחובר ופעיל
          </span>
        </div>
      </li>
    );
  }
  
  function ActiveAnalyticsUsers() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
  
    const mountedRef = useRef(false);
    const requestControllerRef = useRef(null);
  
    const loadActiveUsers = useCallback(
      async ({ background = false } = {}) => {
        requestControllerRef.current?.abort();
  
        const controller = new AbortController();
        requestControllerRef.current = controller;
  
        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
  
        setError('');
  
        try {
          const nextReport =
            await fetchActiveAnalyticsUsers({
              signal: controller.signal,
            });
  
          if (!mountedRef.current) return;
  
          setReport(nextReport);
        } catch (requestError) {
          if (
            isCanceledRequest(requestError) ||
            !mountedRef.current
          ) {
            return;
          }
  
          setError(getErrorMessage(requestError));
        } finally {
          if (
            mountedRef.current &&
            requestControllerRef.current === controller
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      []
    );
  
    useEffect(() => {
      mountedRef.current = true;
  
      loadActiveUsers();
  
      const intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadActiveUsers({ background: true });
        }
      }, REFRESH_INTERVAL_MS);
  
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadActiveUsers({ background: true });
        }
      };
  
      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
  
      return () => {
        mountedRef.current = false;
        window.clearInterval(intervalId);
  
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
  
        requestControllerRef.current?.abort();
      };
    }, [loadActiveUsers]);
  
    const users = Array.isArray(report?.users)
      ? report.users
      : [];
  
    const activeWindowSeconds =
      Number(report?.activeWindowSeconds) || 90;
  
    return (
      <section
        className="overflow-hidden rounded-3xl border border-[#cfa756]/30 bg-[#fffdf8] shadow-[0_16px_45px_rgba(13,35,64,.12)]"
        aria-labelledby="active-analytics-users-title"
      >
        <header className="bg-gradient-to-l from-[#0d2340] to-[#091a30] px-5 py-5 text-[#f7f4e9] sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-[#cfa756]/35 bg-[#cfa756]/10 p-2.5 text-[#f7d98a]">
                  <Users size={23} aria-hidden="true" />
                </div>
  
                <div>
                  <h2
                    id="active-analytics-users-title"
                    className="text-xl font-extrabold text-[#f7d98a] sm:text-2xl"
                  >
                    משתמשים מחוברים ופעילים כעת
                  </h2>
  
                  <p className="mt-1 text-sm text-[#f7f4e9]/65">
                    משתמשים רשומים שזוהו באמצעות התחברות תקינה
                  </p>
                </div>
              </div>
            </div>
  
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2">
                <Activity
                  size={17}
                  className="text-emerald-300"
                  aria-hidden="true"
                />
  
                <span className="text-sm font-bold text-emerald-100">
                  {formatNumber(report?.total)} פעילים
                </span>
              </div>
  
              <button
                type="button"
                onClick={() =>
                  loadActiveUsers({
                    background: Boolean(report),
                  })
                }
                disabled={loading || refreshing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cfa756]/40 bg-[#cfa756] px-4 py-2 text-sm font-extrabold text-[#0d2340] transition hover:bg-[#f0cb73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading || refreshing
                      ? 'animate-spin'
                      : ''
                  }
                  aria-hidden="true"
                />
                רענון
              </button>
            </div>
          </div>
  
          <p className="mt-4 text-xs leading-5 text-[#f7f4e9]/55">
            משתמש נחשב פעיל אם התקבלה ממנו פעילות במהלך
            {' '}
            {formatNumber(activeWindowSeconds)}
            {' '}
            השניות האחרונות.
          </p>
        </header>
  
        <div aria-live="polite">
          {loading && !report && <LoadingState />}
  
          {!loading && error && !report && (
            <div className="p-6 text-center">
              <p className="font-bold text-red-700">
                {error}
              </p>
  
              <button
                type="button"
                onClick={() => loadActiveUsers()}
                className="mt-4 rounded-xl bg-[#0d2340] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#173b67]"
              >
                נסה שוב
              </button>
            </div>
          )}
  
          {!loading &&
            report &&
            users.length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0d2340]/5 text-[#0d2340]/45">
                  <Users size={27} aria-hidden="true" />
                </div>
  
                <h3 className="mt-4 font-extrabold text-[#0d2340]">
                  אין כרגע משתמשים רשומים פעילים
                </h3>
  
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#0d2340]/60">
                  ייתכן שיש באתר מבקרים אנונימיים. הם נספרים
                  בכרטיס המבקרים הפעילים, אך זהותם אינה מוצגת.
                </p>
              </div>
            )}
  
          {report && users.length > 0 && (
            <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
              {users.map((user) => (
                <ActiveUserCard
                  key={`${user.email}-${user.lastActiveAt}`}
                  user={user}
                />
              ))}
            </ul>
          )}
  
          {error && report && (
            <div className="mx-4 mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 sm:mx-6">
              הנתונים המוצגים הם מהרענון האחרון. {error}
            </div>
          )}
        </div>
  
        {report && (
          <footer className="border-t border-[#0d2340]/10 bg-[#f7f4ee]/70 px-5 py-4 text-xs leading-5 text-[#0d2340]/60 sm:px-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <p>
                רענון אחרון לפי שעון ישראל:{' '}
                <strong className="text-[#0d2340]">
                  {formatDateTime(report.generatedAt)}
                </strong>
              </p>
  
              {report.hasMore && (
                <p className="font-semibold text-[#745817]">
                  מוצגים {formatNumber(report.displayed)} מתוך{' '}
                  {formatNumber(report.total)} משתמשים.
                </p>
              )}
            </div>
  
            <p className="mt-2">
              הרשימה מתרעננת אוטומטית כל 30 שניות. משתמש
              שהתנתק עשוי להישאר מוצג עד לסיום חלון הפעילות.
            </p>
          </footer>
        )}
      </section>
    );
  }
  
  export default ActiveAnalyticsUsers;