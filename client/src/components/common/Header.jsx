// components/common/Header.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes';
import { useAuth } from '../context/authContext';
import GoldParticles from './GoldParticles';
import LightSweep from './LightSweep';
import { useAdminAlerts } from '../../hooks/useAdminAlerts';
/* ─────────────────────────────────────────────
   Header – משודרג
   ───────────────────────────────────────────── */

function NotificationBadge({ count }) {
  if (!count) return null;
  return (
    <span
      style={{
        position: 'absolute',
        top: '-6px',
        left: '-10px',
        minWidth: '18px',
        height: '18px',
        padding: '0 4px',
        borderRadius: '999px',
        background: '#a61b1b',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 2px rgba(13,35,64,0.9)',
        lineHeight: 1,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const adminEnabled = isAuthenticated && isAdmin();
  const { total: adminAlertCount, refresh: refreshAdminAlerts } = useAdminAlerts(adminEnabled);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [crownLeft, setCrownLeft] = useState(0);
  const navRef = useRef(null);
  const location = useLocation();

  const navItems = useMemo(() => {
    const items = [...NAVIGATION_ITEMS];
    if (isAuthenticated && isAdmin()) items.push({ path: ROUTES.ADMIN, label: 'ניהול' });
    return items;
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!adminEnabled) return undefined;

    const handleAdminAlertsChanged = () => {
      refreshAdminAlerts();
    };

    window.addEventListener('admin-alerts-changed', handleAdminAlertsChanged);

    return () => {
      window.removeEventListener('admin-alerts-changed', handleAdminAlertsChanged);
    };
  }, [adminEnabled, refreshAdminAlerts]);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const moveUnderline = useCallback((path) => {
    const btn = navRef.current?.querySelector(`[data-path="${path}"]`);
    if (btn) {
      const centerLeft = btn.offsetLeft + btn.offsetWidth / 2 - 7;
      setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 });
      setCrownLeft(centerLeft);
    }
  }, []);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    let cancelled = false;

    moveUnderline(location.pathname);

    const observer = new ResizeObserver(() => moveUnderline(location.pathname));
    observer.observe(navEl);
    navEl.querySelectorAll('[data-path]').forEach((el) => observer.observe(el));

    document.fonts?.ready?.then(() => {
      if (!cancelled) moveUnderline(location.pathname);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [location.pathname, navItems, moveUnderline]);

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  const AuthButtons = useMemo(() => {
    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-3">
          {/* משתמש מחובר – תגית יוקרתית */}
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#cfa756]/40"
            style={{
              background: 'linear-gradient(135deg, rgba(207,167,86,0.08) 0%, rgba(184,134,11,0.04) 100%)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 12px rgba(207,167,86,0.08)',
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ffe9a0 0%, #cfa756 70%)',
                boxShadow: '0 0 6px rgba(207,167,86,0.8), 0 0 14px rgba(247,217,138,0.5)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span
              className="text-[16px] font-semibold tracking-wide"
              style={{
                color: '#f7f4e9',
                textShadow: '0 0 8px rgba(207,167,86,0.35)',
              }}
            >
              {user?.name || 'משתמש'}
            </span>
          </div>
          {/* כפתור התנתקות */}
          <button
            onClick={logout}
            className="px-5 py-2 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-300"
            style={{
              border: '1px solid rgba(166,27,27,0.55)',
              background: 'linear-gradient(135deg, rgba(166,27,27,0.12) 0%, rgba(166,27,27,0.04) 100%)',
              color: '#f7f4e9',
              backdropFilter: 'blur(6px)',
              textShadow: '0 0 6px rgba(166,27,27,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #a61b1b 0%, #7a1010 100%)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(166,27,27,0.5), 0 0 40px rgba(166,27,27,0.2)';
              e.currentTarget.style.borderColor = '#c0392b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(166,27,27,0.12) 0%, rgba(166,27,27,0.04) 100%)';
              e.currentTarget.style.color = '#f7f4e9';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(166,27,27,0.55)';
            }}
          >
            התנתק
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        {/* התחבר */}
        <Link
          to={ROUTES.LOGIN}
          className="px-5 py-2 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-300"
          style={{
            border: '1px solid rgba(207,167,86,0.55)',
            color: '#cfa756',
            background: 'transparent',
            backdropFilter: 'blur(6px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(207,167,86,0.12)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(207,167,86,0.25), 0 0 36px rgba(207,167,86,0.1)';
            e.currentTarget.style.borderColor = '#f7d98a';
            e.currentTarget.style.color = '#f7d98a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(207,167,86,0.55)';
            e.currentTarget.style.color = '#cfa756';
          }}
        >
          התחבר
        </Link>
        {/* הירשם */}
        <Link
          to={ROUTES.REGISTER}
          className="px-6 py-2 rounded-full text-[15px] font-bold tracking-wide transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #cfa756 0%, #b8860b 50%, #8b6914 100%)',
            color: '#0d2340',
            boxShadow: '0 4px 20px rgba(207,167,86,0.35), 0 0 40px rgba(207,167,86,0.15)',
            border: '1px solid rgba(255,233,160,0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(247,217,138,0.55), 0 0 50px rgba(207,167,86,0.3)';
            e.currentTarget.style.borderColor = '#ffe9a0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(207,167,86,0.35), 0 0 40px rgba(207,167,86,0.15)';
            e.currentTarget.style.borderColor = 'rgba(255,233,160,0.4)';
          }}
        >
          הירשם
        </Link>
      </div>
    );
  }, [isAuthenticated, user?.name, logout]);

  /* ── SVG כתר (בשימוש חוזר) ── */
  const CrownSVG = ({ id, size = 14 }) => (
    <svg className="crown-icon" width={size} height={(size * 11) / 14} viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe9a0">
            <animate attributeName="stop-color" values="#ffe9a0;#f7d98a;#cfa756;#f7d98a;#ffe9a0" dur="2.2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#b8860b">
            <animate attributeName="stop-color" values="#b8860b;#cfa756;#f7d98a;#cfa756;#b8860b" dur="2.2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        {/* גלואו לכתר */}
        <filter id={`glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#glow-${id})`}>
        <polygon points="1,14 1,7 5,11 10,2 15,11 19,7 19,14" fill={`url(#${id})`} stroke="#b8860b" strokeWidth="0.6" strokeLinejoin="round" />
        <rect x="1" y="13" width="18" height="2.5" rx="1" fill={`url(#${id})`} stroke="#b8860b" strokeWidth="0.5" />
        <circle cx="10" cy="2.5" r="1.2" fill="#fff8e0">
          <animate attributeName="r" values="1.2;1.5;1.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="1.2" cy="7.2" r="1" fill="#fff8e0" />
        <circle cx="18.8" cy="7.2" r="1" fill="#fff8e0" />
      </g>
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

        .header-font {
          font-family: 'Assistant', sans-serif;
          font-weight: 600;
        }

        @keyframes crownGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(207,167,86,0.6)) drop-shadow(0 0 8px rgba(207,167,86,0.3)); }
          50%      { filter: drop-shadow(0 0 7px rgba(247,217,138,1)) drop-shadow(0 0 16px rgba(207,167,86,0.65)); }
        }

        .crown-icon {
          animation: crownGlow 2.2s ease-in-out infinite;
          display: block;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }

        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes mobileLinkIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes logoShine {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* ── Glass משודרג ── */
        .glass-dark {
          background: linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.96) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(207,167,86,.2);
          position: relative;
        }

        .mobile-menu-enter {
          animation: mobileMenuIn 0.25s cubic-bezier(.4,0,.2,1) both;
        }

        .mobile-link-enter {
          animation: mobileLinkIn 0.22s cubic-bezier(.4,0,.2,1) both;
        }

        /* hover-underline מורחב עם גלואו */
        .nav-link-hover:hover {
          text-shadow: 0 0 14px rgba(207,167,86,0.55), 0 0 28px rgba(207,167,86,0.2);
        }
      `}</style>

      <header
        className="header-font fixed top-0 left-0 right-0 z-50 glass-dark"
        style={{ direction: 'rtl' }}
      >
        {/* חלקיקי זהב */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <GoldParticles />
        </div>

        {/* קו תחתון עם קרן אור */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <LightSweep />
        </div>

        <div className="container mx-auto px-6 py-3 relative z-10">
          <div className="flex items-center justify-between">

            {/* ── Logo עם אפקט shine ── */}
            <Link
              to={ROUTES.HOME}
              className="relative group"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(207,167,86,0.35))',
                transition: 'filter 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 22px rgba(247,217,138,0.7)) drop-shadow(0 0 40px rgba(207,167,86,0.4))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(207,167,86,0.35))';
              }}
            >
              {/* shine overlay על הלוגו */}
              <div className="relative inline-block">
                <img src="/logo.png" className="h-16 relative z-10" alt="לוגו" />
                <div
                  className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 65%)',
                    backgroundSize: '200% 100%',
                    animation: 'logoShine 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav
              ref={navRef}
              className="notranslate hidden lg:flex items-center justify-center flex-1 gap-10 relative"
            >
              {navItems.map(({ path, label }, i) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    data-path={path}
                    className={`nav-link-hover relative text-[18px] tracking-widest uppercase font-bold transition-all duration-300 pb-2 ${isActive
                      ? 'text-[#cfa756]'
                      : 'text-[#f7f4e9]/80 hover:text-[#cfa756]'
                      }`}
                    style={{
                      animationDelay: `${i * 80}ms`,
                      textShadow: isActive
                        ? '0 0 16px rgba(207,167,86,0.55), 0 0 32px rgba(207,167,86,0.2)'
                        : 'none',
                      position: 'relative',
                    }}
                  >
                    {/* רקע hover עדין */}
                    <span
                      className="absolute inset-0 rounded-lg -mx-2 -my-1 opacity-0 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(207,167,86,0.08) 0%, transparent 70%)',
                      }}
                    />

                    <span className="relative z-10">{label}</span>

                    {path === ROUTES.ADMIN && (
                      <NotificationBadge count={adminAlertCount} />
                    )}
                  </Link>
                );
              })}

              {/* underline מוזהב נע */}
              <span
                className="absolute bottom-0 pointer-events-none z-20"
                style={{
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                  opacity: underlineStyle.opacity,
                  height: '2px',
                  background: 'linear-gradient(90deg, #cfa756, #f7d98a 40%, #ffe9a0 50%, #f7d98a 60%, #cfa756)',
                  borderRadius: '2px',
                  boxShadow: '0 0 10px rgba(247,217,138,0.7), 0 0 22px rgba(207,167,86,0.4)',
                  transition: 'left 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s',
                }}
              />

              {/* כתר נע */}
              <span
                className="absolute pointer-events-none z-20"
                style={{
                  top: '-18px',
                  left: crownLeft,
                  opacity: underlineStyle.opacity,
                  transition: 'left 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s',
                }}
              >
                <CrownSVG id="crownGrad" size={14} />
              </span>
            </nav>

            {/* ── Auth ── */}
            <div className="hidden lg:flex items-center">
              {AuthButtons}
            </div>

            {/* ── Mobile burger ── */}
            <button
              onClick={toggleMenu}
              className="lg:hidden text-[#cfa756] text-2xl focus:outline-none transition-transform duration-300 hover:scale-110"
              style={{
                textShadow: '0 0 10px rgba(207,167,86,0.5)',
              }}
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* ── Mobile menu ── */}
          {isMenuOpen && (
            <div
              className="mobile-menu-enter lg:hidden mt-4 pb-4 flex flex-col"
              style={{
                borderTop: '1px solid rgba(207,167,86,0.25)',
                background: 'linear-gradient(180deg, rgba(13,35,64,0.6) 0%, rgba(10,25,47,0.5) 100%)',
                backdropFilter: 'blur(16px)',
                borderRadius: '0 0 16px 16px',
              }}
            >
              {navItems.map(({ path, label }, i) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`mobile-link-enter px-4 py-3.5 text-[17px] font-bold tracking-wide transition-all duration-300 flex items-center gap-3 ${isActive
                      ? 'text-[#cfa756]'
                      : 'text-[#f7f4e9]/80 hover:text-[#cfa756]'
                      }`}
                    style={{
                      animationDelay: `${i * 55}ms`,
                      borderBottom: '1px solid rgba(207,167,86,0.08)',
                      textShadow: isActive
                        ? '0 0 10px rgba(207,167,86,0.4)'
                        : 'none',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(207,167,86,0.08) 0%, transparent 100%)'
                        : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {isActive && (
                      <span className="inline-block flex-shrink-0">
                        <CrownSVG id="crownGradMobile" size={12} />
                      </span>
                    )}

                    <span>{label}</span>

                    {path === ROUTES.ADMIN && (
                      <NotificationBadge count={adminAlertCount} />
                    )}
                  </Link>
                );
              })}

              <div
                className="mobile-link-enter mt-4 px-4 flex flex-col gap-3"
                style={{ animationDelay: `${navItems.length * 55}ms` }}
              >
                {AuthButtons}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* spacer */}
      {/* <div className="h-[72px]" /> */}
    </>
  );
}

export default Header;