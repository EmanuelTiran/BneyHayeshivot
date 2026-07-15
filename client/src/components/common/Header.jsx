import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes';
import { useAuth } from '../context/authContext';
import { useAdminAlerts } from '../../hooks/useAdminAlerts';
import GoldParticles from './GoldParticles';

/* ─────────────────────────────────────────────
   באדג׳ ההתראות של הניהול
   ───────────────────────────────────────────── */

function NotificationBadge({ count, compact = false }) {
  if (!count) return null;

  return (
    <span
      style={{
        position: 'absolute',
        top: compact ? '-6px' : '-9px',
        right: compact ? '-7px' : 'auto',
        left: compact ? 'auto' : '-12px',
        zIndex: 40,
        minWidth: compact ? '16px' : '18px',
        height: compact ? '16px' : '18px',
        padding: compact ? '0 3px' : '0 4px',
        borderRadius: '999px',
        background: '#a61b1b',
        color: '#fff',
        fontSize: compact ? '9px' : '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow:
          '0 0 0 2px rgba(13,35,64,.95), 0 0 9px rgba(166,27,27,.6)',
        lineHeight: 1,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ─────────────────────────────────────────────
   כתר של החוצץ הפעיל
   ───────────────────────────────────────────── */

function CrownSVG({ id, size = 14 }) {
  return (
    <svg
      className="crown-icon"
      width={size}
      height={(size * 11) / 14}
      viewBox="0 0 20 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor="#ffe9a0"
          >
            <animate
              attributeName="stop-color"
              values="#ffe9a0;#f7d98a;#cfa756;#f7d98a;#ffe9a0"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </stop>

          <stop
            offset="100%"
            stopColor="#b8860b"
          >
            <animate
              attributeName="stop-color"
              values="#b8860b;#cfa756;#f7d98a;#cfa756;#b8860b"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <filter
          id={`glow-${id}`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur
            stdDeviation="0.8"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#glow-${id})`}>
        <polygon
          points="1,14 1,7 5,11 10,2 15,11 19,7 19,14"
          fill={`url(#${id})`}
          stroke="#b8860b"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />

        <rect
          x="1"
          y="13"
          width="18"
          height="2.5"
          rx="1"
          fill={`url(#${id})`}
          stroke="#b8860b"
          strokeWidth="0.5"
        />

        <circle
          cx="10"
          cy="2.5"
          r="1.2"
          fill="#fff8e0"
        >
          <animate
            attributeName="r"
            values="1.2;1.5;1.2"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx="1.2"
          cy="7.2"
          r="1"
          fill="#fff8e0"
        />

        <circle
          cx="18.8"
          cy="7.2"
          r="1"
          fill="#fff8e0"
        />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   אייקונים למובייל בלבד
   ───────────────────────────────────────────── */

function RoyalNavIcon({ type, size = 18 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const icons = {
    home: (
      <>
        <path d="m3.5 11 8.5-7 8.5 7" />
        <path d="M5.5 10v10h13V10M9.5 20v-6h5v6" />
      </>
    ),

    prayers: (
      <>
        <path d="M4 5.5c3.2-1.1 5.9-.5 8 1.3v13c-2.1-1.8-4.8-2.4-8-1.3z" />
        <path d="M20 5.5c-3.2-1.1-5.9-.5-8 1.3v13c2.1-1.8 4.8-2.4 8-1.3zM12 6.8v13" />
      </>
    ),

    announcements: (
      <>
        <path d="M4 13V9.5c0-.8.7-1.5 1.5-1.5H8l8-4v15l-8-4H5.5c-.8 0-1.5-.7-1.5-1.5Z" />
        <path d="M8 15.2 9.6 21h3.3l-1.5-4.4M19 8.5c1.3 1.8 1.3 5.2 0 7" />
      </>
    ),

    contact: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2.5"
        />

        <path d="m4.5 7 7.5 6 7.5-6" />
      </>
    ),

    payments: (
      <>
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="2.5"
        />

        <path d="M3 10h18M7 15h3" />
      </>
    ),

    commemorations: (
      <>
        <path d="M9 21h6M8 18h8l-1.1-8H9.1z" />
        <path d="M12 10c-2.4-1.5-2.5-3.6.2-7 2.6 2.3 3.4 4.9-.2 7Z" />
      </>
    ),

    dedications: (
      <>
        <rect
          x="4"
          y="8"
          width="16"
          height="12"
          rx="2"
        />

        <path d="M12 8v12M3 12h18M7.5 8C5.2 8 4.2 6.8 4.7 5.3 5.4 3.1 9 4 12 8M16.5 8c2.3 0 3.3-1.2 2.8-2.7C18.6 3.1 15 4 12 8" />
      </>
    ),

    gallery: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2.5"
        />

        <circle
          cx="8.5"
          cy="9"
          r="1.5"
        />

        <path d="m4.5 17 4.2-4 3.1 2.8 2.4-2.2 5.3 4.4" />
      </>
    ),

    admin: (
      <>
        <path d="M12 3 4.5 6v5.3c0 4.7 3 8 7.5 9.7 4.5-1.7 7.5-5 7.5-9.7V6z" />

        <circle
          cx="12"
          cy="11"
          r="2.2"
        />

        <path d="M8.7 16c.8-1.4 1.9-2.1 3.3-2.1s2.5.7 3.3 2.1" />
      </>
    ),

    login: (
      <>
        <circle
          cx="12"
          cy="8"
          r="3.3"
        />

        <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
      </>
    ),

    register: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3.5 20c.7-4 2.5-6 5.5-6 1.5 0 2.7.5 3.6 1.4M17 11v7M13.5 14.5h7" />
      </>
    ),

    logout: (
      <>
        <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),

    default: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8.5"
        />

        <path d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9z" />
      </>
    ),
  };

  return (
    <svg {...commonProps}>
      {icons[type] || icons.default}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   בדיקת חוצץ פעיל
   ───────────────────────────────────────────── */

function isNavigationItemActive(currentPath, itemPath) {
  if (!itemPath) {
    return false;
  }

  if (itemPath === ROUTES.HOME) {
    return currentPath === itemPath;
  }

  return (
    currentPath === itemPath ||
    currentPath.startsWith(`${itemPath}/`)
  );
}

/* ─────────────────────────────────────────────
   התאמת אייקון לחוצץ במובייל
   ───────────────────────────────────────────── */

function getMobileIconType(path, label) {
  const value =
    `${path || ''} ${label || ''}`.toLowerCase();

  if (
    path === ROUTES.HOME ||
    /home|דף הבית|ראשי/.test(value)
  ) {
    return 'home';
  }

  if (/prayer|תפיל|זמני היום/.test(value)) {
    return 'prayers';
  }

  if (
    /announcement|message|הודע|מודע|עדכונ/.test(
      value
    )
  ) {
    return 'announcements';
  }

  if (
    /contact|צור קשר|יצירת קשר/.test(value)
  ) {
    return 'contact';
  }

  if (
    /payment|תשלומ|תרומ|חוב/.test(value)
  ) {
    return 'payments';
  }

  if (
    /commemoration|memorial|הנצח|נפטר/.test(
      value
    )
  ) {
    return 'commemorations';
  }

  if (
    /dedication|portal|הקדש|פורטל/.test(
      value
    )
  ) {
    return 'dedications';
  }

  if (/gallery|גלר/.test(value)) {
    return 'gallery';
  }

  if (
    path === ROUTES.ADMIN ||
    /admin|ניהול/.test(value)
  ) {
    return 'admin';
  }

  return 'default';
}

/* ─────────────────────────────────────────────
   חוצץ במסך מחשב
   ───────────────────────────────────────────── */

function DesktopNavigationItem({
  item,
  currentPath,
  adminAlertCount,
  crownId,
}) {
  if (!item) {
    return null;
  }

  const { path, label } = item;

  const isActive =
    isNavigationItemActive(
      currentPath,
      path
    );

  return (
    <Link
      to={path}
      aria-current={
        isActive
          ? 'page'
          : undefined
      }
      className={`desktop-nav-link relative shrink-0 pb-2 text-[14px] xl:text-[17px] font-bold tracking-wide xl:tracking-widest transition-all duration-300 ${
        isActive
          ? 'text-[#f7d98a]'
          : 'text-[#f7f4e9]/80 hover:text-[#cfa756]'
      }`}
      style={{
        textShadow: isActive
          ? '0 0 14px rgba(247,217,138,.55), 0 0 28px rgba(207,167,86,.2)'
          : 'none',
      }}
    >
      {isActive && (
        <span className="absolute left-1/2 -top-4 -translate-x-1/2 pointer-events-none">
          <CrownSVG
            id={crownId}
            size={13}
          />
        </span>
      )}

      <span className="relative z-10 whitespace-nowrap">
        {label}
      </span>

      {path === ROUTES.ADMIN && (
        <NotificationBadge
          count={adminAlertCount}
        />
      )}

      <span
        className={`absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full transition-all duration-300 ${
          isActive
            ? 'opacity-100 scale-x-100'
            : 'opacity-0 scale-x-50'
        }`}
        style={{
          background:
            'linear-gradient(90deg, transparent, #cfa756 15%, #ffe9a0 50%, #cfa756 85%, transparent)',

          boxShadow:
            '0 0 10px rgba(247,217,138,.7), 0 0 20px rgba(207,167,86,.35)',
        }}
      />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   חוצץ במובייל
   ───────────────────────────────────────────── */

function MobileNavigationItem({
  item,
  currentPath,
  adminAlertCount,
  animationIndex = 0,
  admin = false,
}) {
  if (!item) {
    return null;
  }

  const { path, label } = item;

  const isActive =
    isNavigationItemActive(
      currentPath,
      path
    );

  const iconType =
    getMobileIconType(
      path,
      label
    );

  return (
    <Link
      to={path}
      aria-current={
        isActive
          ? 'page'
          : undefined
      }
      className={`mobile-nav-item relative min-w-0 h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold transition-colors duration-300 ${
        admin
          ? 'w-[30px] min-[360px]:w-[34px]'
          : 'flex-1'
      } ${
        isActive
          ? 'text-[#ffe9a0]'
          : 'text-[#f7f4e9]/70'
      }`}
      style={{
        animationDelay:
          `${animationIndex * 45}ms`,

        border:
          '1px solid rgba(207,167,86,.08)',

        background:
          'linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.008))',
      }}
    >
      <span
        className="mobile-nav-icon-shell relative w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          color: isActive
            ? '#ffe9a0'
            : 'rgba(247,244,233,.76)',

          background: isActive
            ? 'radial-gradient(circle, rgba(247,217,138,.14), rgba(207,167,86,.04))'
            : 'rgba(13,35,64,.28)',
        }}
      >
        <RoyalNavIcon
          type={iconType}
          size={16}
        />

        {path === ROUTES.ADMIN && (
          <NotificationBadge
            count={adminAlertCount}
            compact
          />
        )}
      </span>

      <span className="w-full px-px truncate text-center text-[8px] min-[390px]:text-[9px] leading-[10px] tracking-wide">
        {label}
      </span>

      {isActive && (
        <span
          className="absolute bottom-0.5 left-1.5 right-1.5 h-[2px] rounded-full"
          style={{
            background: '#ffe9a0',
          }}
        />
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────
   הלוגו הממורכז
   ───────────────────────────────────────────── */

function CenterLogo({ mobile = false }) {
  return (
    <Link
      to={ROUTES.HOME}
      className={`logo-link relative z-40 group flex items-center justify-center justify-self-center rounded-full ${
        mobile
          ? 'w-[58px] h-[58px] translate-y-2'
          : 'w-[124px] h-[124px] xl:w-[134px] xl:h-[134px] translate-y-4'
      }`}
      style={{
        filter:
          'drop-shadow(0 0 12px rgba(207,167,86,.42)) drop-shadow(0 10px 18px rgba(0,0,0,.32))',
      }}
      aria-label="לוגו – מעבר לדף הבית"
    >
      <span
        className="absolute inset-[5%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(247,217,138,.2), rgba(207,167,86,.06) 62%, transparent 72%)',

          border:
            '1px solid rgba(247,217,138,.25)',

          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.1), 0 0 22px rgba(207,167,86,.2)',
        }}
      />

      <img
        src="/logo.png"
        className={`relative z-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105 ${
          mobile
            ? 'h-[54px]'
            : 'h-[112px] xl:h-[120px]'
        }`}
        alt="לוגו"
      />

      <span className="logo-shine absolute inset-[8%] z-20 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Header
   ───────────────────────────────────────────── */

function Header() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();

  const location = useLocation();

  const adminEnabled = Boolean(
    isAuthenticated &&
    isAdmin()
  );

  const {
    total: adminAlertCount,
    refresh: refreshAdminAlerts,
  } = useAdminAlerts(adminEnabled);

  /* סנכרון הבאדג׳ של הניהול */

  useEffect(() => {
    if (!adminEnabled) {
      return undefined;
    }

    const handleAdminAlertsChanged = () => {
      refreshAdminAlerts();
    };

    window.addEventListener(
      'admin-alerts-changed',
      handleAdminAlertsChanged
    );

    return () => {
      window.removeEventListener(
        'admin-alerts-changed',
        handleAdminAlertsChanged
      );
    };
  }, [
    adminEnabled,
    refreshAdminAlerts,
  ]);

  /* בניית רשימת הניווט */

  const navItems = useMemo(() => {
    const items =
      NAVIGATION_ITEMS.filter(
        ({ path }) =>
          path !== ROUTES.ADMIN
      );

    if (adminEnabled) {
      items.push({
        path: ROUTES.ADMIN,
        label: 'ניהול',
      });
    }

    return items;
  }, [adminEnabled]);

  /*
   * מימין ללוגו:
   * דף הבית, הודעות, צור קשר.
   *
   * משמאל ללוגו:
   * הקדשות, הנצחות, תשלומים.
   *
   * ניהול נמצא בנפרד בקצה השמאלי.
   */

  const {
    rightItems,
    leftCoreItems,
    adminItem,
  } = useMemo(() => {
    const findItem = (...terms) => {
      return navItems.find(
        ({
          path = '',
          label = '',
        }) => {
          const value =
            `${path} ${label}`.toLowerCase();

          return terms.some(
            (term) =>
              value.includes(
                term.toLowerCase()
              )
          );
        }
      );
    };

    const fallback = (
      item,
      path,
      label
    ) => {
      return (
        item ||
        (
          path
            ? {
                path,
                label,
              }
            : null
        )
      );
    };

    const home = fallback(
      navItems.find(
        ({ path }) =>
          path === ROUTES.HOME
      ),
      ROUTES.HOME,
      'דף הבית'
    );

    const announcements = fallback(
      findItem(
        'הודעות',
        'הודעה',
        'מודעות',
        'עדכונים',
        'announcement',
        'message'
      ),
      ROUTES.ANNOUNCEMENTS,
      'הודעות'
    );

    const contact = fallback(
      findItem(
        'צור קשר',
        'יצירת קשר',
        'contact'
      ),
      ROUTES.CONTACT,
      'צור קשר'
    );

    const dedications = fallback(
      findItem(
        'הקדשות',
        'הקדשה',
        'dedication',
        'portal'
      ),
      ROUTES.DEDICATIONS ||
        ROUTES.PORTAL,
      'הקדשות'
    );

    const commemorations = fallback(
      findItem(
        'הנצחות',
        'הנצחה',
        'commemoration',
        'memorial'
      ),
      ROUTES.COMMEMORATIONS,
      'הנצחות'
    );

    const payments = fallback(
      findItem(
        'תשלומים',
        'תשלום',
        'payment'
      ),
      ROUTES.PAYMENTS,
      'תשלומים'
    );

    const admin =
      adminEnabled
        ? fallback(
            navItems.find(
              ({ path }) =>
                path === ROUTES.ADMIN
            ) ||
              findItem(
                'ניהול',
                'admin'
              ),
            ROUTES.ADMIN,
            'ניהול'
          )
        : null;

    return {
      rightItems: [
        home,
        announcements,
        contact,
      ].filter(Boolean),

      leftCoreItems: [
        dedications,
        commemorations,
        payments,
      ].filter(Boolean),

      adminItem: admin,
    };
  }, [
    navItems,
    adminEnabled,
  ]);

  /* ─────────────────────────────────────────────
     כפתורי משתמש במובייל
     ───────────────────────────────────────────── */

  const mobileAuthControls =
    isAuthenticated ? (
      <>
        <div
          className="h-7 max-w-[150px] px-2.5 rounded-full flex items-center gap-1.5"
          style={{
            color: '#f7f4e9',

            border:
              '1px solid rgba(207,167,86,.28)',

            background:
              'rgba(207,167,86,.05)',

            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,.05)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: '#cfa756',

              boxShadow:
                '0 0 8px rgba(247,217,138,.8)',
            }}
          />

          <span className="truncate text-[11px] font-semibold">
            {user?.name || 'משתמש'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="auth-action h-7 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all duration-300 active:scale-95"
          style={{
            color: '#f7d98a',

            border:
              '1px solid rgba(166,27,27,.45)',

            background:
              'linear-gradient(135deg, rgba(166,27,27,.15), rgba(166,27,27,.04))',
          }}
        >
          <RoyalNavIcon
            type="logout"
            size={14}
          />

          <span>התנתק</span>
        </button>
      </>
    ) : (
      <>
        <Link
          to={ROUTES.LOGIN}
          className="auth-action h-7 min-w-[78px] px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all duration-300 active:scale-95"
          style={{
            color: '#f7d98a',

            border:
              '1px solid rgba(207,167,86,.38)',

            background:
              'rgba(207,167,86,.05)',

            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,.05)',
          }}
        >
          <RoyalNavIcon
            type="login"
            size={14}
          />

          <span>התחבר</span>
        </Link>

        <Link
          to={ROUTES.REGISTER}
          className="auth-action h-7 min-w-[78px] px-2.5 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all duration-300 active:scale-95"
          style={{
            color: '#0d2340',

            border:
              '1px solid rgba(255,233,160,.55)',

            background:
              'linear-gradient(135deg, #f7d98a, #cfa756 60%, #a87913)',

            boxShadow:
              '0 0 12px rgba(207,167,86,.24), inset 0 1px 0 rgba(255,255,255,.32)',
          }}
        >
          <RoyalNavIcon
            type="register"
            size={14}
          />

          <span>הירשם</span>
        </Link>
      </>
    );

  /* ─────────────────────────────────────────────
     כפתורי משתמש במסך מחשב
     ───────────────────────────────────────────── */

  const desktopUserBadge =
    isAuthenticated ? (
      <div
        className="h-8 max-w-[160px] px-3 rounded-full flex items-center gap-2"
        style={{
          color: '#f7f4e9',

          border:
            '1px solid rgba(207,167,86,.28)',

          background:
            'rgba(207,167,86,.05)',

          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.05)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: '#cfa756',

            boxShadow:
              '0 0 8px rgba(247,217,138,.8)',
          }}
        />

        <span className="truncate text-[13px] font-semibold">
          {user?.name || 'משתמש'}
        </span>
      </div>
    ) : null;

  const desktopLogoutButton =
    isAuthenticated ? (
      <button
        type="button"
        onClick={logout}
        className="auth-action h-8 px-4 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 active:scale-95"
        style={{
          color: '#f7d98a',

          border:
            '1px solid rgba(166,27,27,.45)',

          background:
            'linear-gradient(135deg, rgba(166,27,27,.15), rgba(166,27,27,.04))',
        }}
      >
        התנתק
      </button>
    ) : null;

  const desktopLoginLink =
    !isAuthenticated ? (
      <Link
        to={ROUTES.LOGIN}
        className="auth-action h-8 min-w-[92px] px-4 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 active:scale-95"
        style={{
          color: '#f7d98a',

          border:
            '1px solid rgba(207,167,86,.38)',

          background:
            'rgba(207,167,86,.05)',

          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.05)',
        }}
      >
        התחבר
      </Link>
    ) : null;

  const desktopRegisterLink =
    !isAuthenticated ? (
      <Link
        to={ROUTES.REGISTER}
        className="auth-action h-8 min-w-[92px] px-4 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 active:scale-95"
        style={{
          color: '#0d2340',

          border:
            '1px solid rgba(255,233,160,.55)',

          background:
            'linear-gradient(135deg, #f7d98a, #cfa756 60%, #a87913)',

          boxShadow:
            '0 0 12px rgba(207,167,86,.24), inset 0 1px 0 rgba(255,255,255,.32)',
        }}
      >
        הירשם
      </Link>
    ) : null;

  const desktopRightControl =
    isAuthenticated
      ? desktopUserBadge
      : desktopLoginLink;

  const desktopLeftControl =
    isAuthenticated
      ? desktopLogoutButton
      : desktopRegisterLink;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

        .header-font {
          font-family: 'Assistant', sans-serif;
          font-weight: 600;
        }

        .glass-dark {
          background:
            linear-gradient(
              180deg,
              rgba(18,32,56,.985) 0%,
              rgba(13,35,64,.97) 100%
            );

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        @keyframes crownGlow {
          0%,
          100% {
            filter:
              drop-shadow(
                0 0 3px
                rgba(207,167,86,.6)
              )
              drop-shadow(
                0 0 8px
                rgba(207,167,86,.3)
              );
          }

          50% {
            filter:
              drop-shadow(
                0 0 7px
                rgba(247,217,138,1)
              )
              drop-shadow(
                0 0 16px
                rgba(207,167,86,.65)
              );
          }
        }

        .crown-icon {
          display: block;

          animation:
            crownGlow
            2.2s
            ease-in-out
            infinite;
        }

        @keyframes logoShine {
          0% {
            background-position:
              -200% center;
          }

          100% {
            background-position:
              200% center;
          }
        }

        .logo-link {
          transition:
            filter .4s ease,
            transform .4s ease;
        }

        .logo-link:hover {
          filter:
            drop-shadow(
              0 0 22px
              rgba(247,217,138,.7)
            )
            drop-shadow(
              0 10px 28px
              rgba(207,167,86,.42)
            ) !important;
        }

        .logo-shine {
          background:
            linear-gradient(
              105deg,
              transparent 35%,
              rgba(255,255,255,.22) 45%,
              rgba(255,255,255,.48) 50%,
              rgba(255,255,255,.22) 55%,
              transparent 65%
            );

          background-size:
            200% 100%;

          animation:
            logoShine
            1.5s
            ease-in-out
            infinite;
        }

        .desktop-nav-link:hover {
          text-shadow:
            0 0 14px
            rgba(207,167,86,.55),

            0 0 28px
            rgba(207,167,86,.2);
        }

        @keyframes mobileNavItemIn {
          from {
            opacity: 0;

            transform:
              translateY(7px)
              scale(.94);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        .mobile-nav-item {
          animation:
            mobileNavItemIn
            .32s
            cubic-bezier(.2,.8,.2,1)
            both;

          -webkit-tap-highlight-color:
            transparent;
        }

        .mobile-nav-item:active {
          transform: scale(.95);
        }

        .mobile-nav-icon-shell {
          transition:
            color .25s ease,
            background .25s ease;
        }

        .auth-action:hover {
          filter: brightness(1.12);

          box-shadow:
            0 0 18px
            rgba(207,167,86,.26)
            !important;
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .crown-icon,
          .logo-shine,
          .mobile-nav-item {
            animation: none !important;
          }
        }
      `}</style>

      <header
        className="header-font fixed top-0 left-0 right-0 z-50"
        style={{
          direction: 'rtl',
        }}
      >
        {/* אזור הניווט הראשי */}

        <div className="glass-dark relative h-[62px] lg:h-20 overflow-visible">
          {/* חלקיקי הזהב */}

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <GoldParticles />
          </div>

          <div className="container mx-auto h-full px-2 sm:px-3 lg:px-6 relative z-20">
            {/* ─────────── מובייל ─────────── */}

            <div
              className="lg:hidden relative h-full"
              dir="ltr"
            >
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 grid items-center"
                style={{
                  width:
                    'calc(100% - 68px)',

                  gridTemplateColumns:
                    'minmax(0,1fr) 58px minmax(0,1fr)',
                }}
              >
                {/* משמאל ללוגו */}

                <nav
                  className="min-w-0 flex items-center gap-0.5"
                  dir="rtl"
                  aria-label="ניווט שמאלי במובייל"
                >
                  {leftCoreItems.map(
                    (
                      item,
                      index
                    ) => (
                      <MobileNavigationItem
                        key={item.path}
                        item={item}
                        currentPath={
                          location.pathname
                        }
                        adminAlertCount={
                          adminAlertCount
                        }
                        animationIndex={
                          index +
                          rightItems.length
                        }
                      />
                    )
                  )}
                </nav>

                {/* הלוגו נמצא בדיוק באמצע */}

                <CenterLogo mobile />

                {/* מימין ללוגו */}

                <nav
                  className="min-w-0 flex items-center gap-0.5"
                  dir="rtl"
                  aria-label="ניווט ימני במובייל"
                >
                  {rightItems.map(
                    (
                      item,
                      index
                    ) => (
                      <MobileNavigationItem
                        key={item.path}
                        item={item}
                        currentPath={
                          location.pathname
                        }
                        adminAlertCount={
                          adminAlertCount
                        }
                        animationIndex={
                          index
                        }
                      />
                    )
                  )}
                </nav>
              </div>

              {/* ניהול נפרד ואינו מזיז את הלוגו */}

              {adminItem && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  dir="rtl"
                >
                  <MobileNavigationItem
                    item={adminItem}
                    currentPath={
                      location.pathname
                    }
                    adminAlertCount={
                      adminAlertCount
                    }
                    animationIndex={
                      rightItems.length +
                      leftCoreItems.length
                    }
                    admin
                  />
                </div>
              )}
            </div>

            {/* ─────────── מסך מחשב ─────────── */}

            <div
              className="hidden lg:block relative h-full"
              dir="ltr"
            >
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 grid items-center"
                style={{
                  width:
                    'calc(100% - 150px)',

                  maxWidth:
                    '1080px',

                  gridTemplateColumns:
                    'minmax(0,1fr) 132px minmax(0,1fr)',
                }}
              >
                {/* משמאל ללוגו */}

                <nav
                  className="flex items-center justify-start gap-4 xl:gap-7 min-w-0"
                  dir="rtl"
                  aria-label="ניווט שמאלי"
                >
                  {leftCoreItems.map(
                    (
                      item,
                      index
                    ) => (
                      <DesktopNavigationItem
                        key={item.path}
                        item={item}
                        currentPath={
                          location.pathname
                        }
                        adminAlertCount={
                          adminAlertCount
                        }
                        crownId={
                          `desktop-left-crown-${index}`
                        }
                      />
                    )
                  )}
                </nav>

                {/* הלוגו נשאר ממורכז */}

                <CenterLogo />

                {/* מימין ללוגו */}

                <nav
                  className="flex items-center justify-end gap-4 xl:gap-7 min-w-0"
                  dir="rtl"
                  aria-label="ניווט ימני"
                >
                  {rightItems.map(
                    (
                      item,
                      index
                    ) => (
                      <DesktopNavigationItem
                        key={item.path}
                        item={item}
                        currentPath={
                          location.pathname
                        }
                        adminAlertCount={
                          adminAlertCount
                        }
                        crownId={
                          `desktop-right-crown-${index}`
                        }
                      />
                    )
                  )}
                </nav>
              </div>

              {/* ניהול וכפתור משתמש בקצה השמאלי */}

              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3"
                dir="rtl"
              >
                {adminItem && (
                  <DesktopNavigationItem
                    item={adminItem}
                    currentPath={
                      location.pathname
                    }
                    adminAlertCount={
                      adminAlertCount
                    }
                    crownId="desktop-admin-crown"
                  />
                )}

                {desktopLeftControl}
              </div>

              {/* כפתור משתמש בקצה הימני */}

              <div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                dir="rtl"
              >
                {desktopRightControl}
              </div>
            </div>
          </div>
        </div>

        {/* שורת התחברות נפרדת במובייל */}

        <div
          className="glass-dark relative z-20 pt-2.5 pb-2 flex items-center justify-center gap-2 lg:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(13,35,64,.95), rgba(10,25,47,.985))',
          }}
        >
          {mobileAuthControls}
        </div>
      </header>

      {/*
        המרווח מחושב לפי תחתית הלוגו.

        בדסקטופ נשאר מרווח קטן בין קצה
        הלוגו לבין תחילת תוכן העמוד.

        במובייל נשמר מקום גם לשורת
        כפתורי ההתחברות.
      */}

<div
  className="h-[108px] lg:h-20"
  aria-hidden="true"
/>
    </>
  );
}

export default Header;