// components/common/Header.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes';
import { useAuth } from '../context/authContext';

function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#cfa756] opacity-20"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left: `${10 + i * 11}%`,
            top: `${20 + (i % 3) * 30}%`,
            animation: `floatParticle ${3 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [crownLeft, setCrownLeft] = useState(0);
  const navRef = useRef(null);
  const location = useLocation();

  // בנה רשימת לינקי ניווט כולל אדמין
  const navItems = useMemo(() => {
    const items = [...NAVIGATION_ITEMS];
    if (isAuthenticated && isAdmin()) items.push({ path: ROUTES.ADMIN, label: 'ניהול' });
    return items;
  }, [isAuthenticated, isAdmin]);

  // סגור מובייל מנו בניווט
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // הזזת underline לכפתור הפעיל
  const moveUnderline = useCallback((path) => {
    const btn = navRef.current?.querySelector(`[data-path="${path}"]`);
    if (btn) {
      const centerLeft = btn.offsetLeft + btn.offsetWidth / 2 - 7;
      setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 });
      setCrownLeft(centerLeft);
    }
  }, []);

  // מיקום ראשוני
  useEffect(() => {
    moveUnderline(location.pathname);
  }, [location.pathname, navItems]);

  // resize
  useEffect(() => {
    const handleResize = () => moveUnderline(location.pathname);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, moveUnderline]);

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  const AuthButtons = useMemo(() => {
    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#cfa756]/30 bg-[#cfa756]/5">
            <div className="w-2 h-2 rounded-full bg-[#cfa756] animate-pulse" />
            <span className="text-[16px] font-semibold text-[#f7f4e9]/90">
              {user?.name || 'משתמש'}
            </span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-full border border-[#a61b1b]/60 bg-[#a61b1b]/10 text-[#f7f4e9]/80 text-[16px] hover:bg-[#a61b1b] hover:text-white transition"
          >
            התנתק
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.LOGIN}
          className="px-4 py-1.5 rounded-full border border-[#cfa756]/50 text-[#cfa756] text-[16px] font-semibold hover:bg-[#cfa756]/10 transition"
        >
          התחבר
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#cfa756] to-[#b8860b] text-[#0d2340] text-[16px] font-bold hover:scale-105 transition"
        >
          הירשם
        </Link>
      </div>
    );
  }, [isAuthenticated, user?.name, logout]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

        .header-font {
          font-family: 'Assistant', sans-serif;
          font-weight: 600;
        }

        @keyframes floatParticle {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        @keyframes crownGlow {
          0%,100% { filter: drop-shadow(0 0 2px rgba(207,167,86,0.5)) drop-shadow(0 0 6px rgba(207,167,86,0.25)); }
          50%      { filter: drop-shadow(0 0 5px rgba(247,217,138,0.95)) drop-shadow(0 0 12px rgba(207,167,86,0.5)); }
        }

        .crown-icon {
          animation: crownGlow 2.2s ease-in-out infinite;
          display: block;
        }

        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes mobileLinkIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .glass-dark {
          background: rgba(13, 35, 64, 0.9);
          backdrop-filter: blur(20px);
        }

        .mobile-menu-enter {
          animation: mobileMenuIn 0.22s cubic-bezier(.4,0,.2,1) both;
        }

        .mobile-link-enter {
          animation: mobileLinkIn 0.2s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>

      <header
        className="header-font fixed top-0 left-0 right-0 z-50 glass-dark"
        style={{ direction: 'rtl' }}
      >
        <GoldParticles />

        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to={ROUTES.HOME}>
              <img src="/logo.png" className="h-12" alt="לוגו" />
            </Link>

            {/* Desktop Nav */}
            <nav
              ref={navRef}
              className="hidden lg:flex items-center justify-center flex-1 gap-10 relative"
            >
              {navItems.map(({ path, label }, i) => (
                <Link
                  key={path}
                  to={path}
                  data-path={path}
                  className={`relative text-[18px] tracking-widest uppercase font-bold transition-colors duration-200 pb-2 ${
                    location.pathname === path
                      ? 'text-[#cfa756]'
                      : 'text-[#f7f4e9]/80 hover:text-[#cfa756]'
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {label}
                </Link>
              ))}

              {/* underline נע */}
              <span
                className="absolute bottom-0 h-px bg-gradient-to-r from-[#cfa756] to-[#f7d98a] pointer-events-none"
                style={{
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                  opacity: underlineStyle.opacity,
                  transition: 'left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1), opacity 0.2s',
                }}
              />

              {/* כתר נע — אחד שנע מעל הלינק הפעיל */}
              <span
                className="absolute pointer-events-none"
                style={{
                  top: '-18px',
                  left: crownLeft,
                  opacity: underlineStyle.opacity,
                  transition: 'left 0.28s cubic-bezier(.4,0,.2,1), opacity 0.2s',
                }}
              >
                <svg className="crown-icon" width="14" height="11" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffe9a0">
                        <animate attributeName="stop-color" values="#ffe9a0;#f7d98a;#cfa756;#f7d98a;#ffe9a0" dur="2.2s" repeatCount="indefinite"/>
                      </stop>
                      <stop offset="100%" stopColor="#b8860b">
                        <animate attributeName="stop-color" values="#b8860b;#cfa756;#f7d98a;#cfa756;#b8860b" dur="2.2s" repeatCount="indefinite"/>
                      </stop>
                    </linearGradient>
                  </defs>
                  <polygon points="1,14 1,7 5,11 10,2 15,11 19,7 19,14" fill="url(#crownGrad)" stroke="#b8860b" strokeWidth="0.6" strokeLinejoin="round"/>
                  <rect x="1" y="13" width="18" height="2.5" rx="1" fill="url(#crownGrad)" stroke="#b8860b" strokeWidth="0.5"/>
                  <circle cx="10" cy="2.5" r="1.2" fill="#fff8e0"/>
                  <circle cx="1.2" cy="7.2" r="1" fill="#fff8e0"/>
                  <circle cx="18.8" cy="7.2" r="1" fill="#fff8e0"/>
                </svg>
              </span>
            </nav>

            {/* Auth */}
            <div className="hidden lg:flex items-center">
              {AuthButtons}
            </div>

            {/* Mobile burger */}
            <button
              onClick={toggleMenu}
              className="lg:hidden text-[#cfa756] text-2xl focus:outline-none"
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="mobile-menu-enter lg:hidden mt-4 pb-4 flex flex-col border-t border-[#cfa756]/20">
              {navItems.map(({ path, label }, i) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`mobile-link-enter px-2 py-3 text-[17px] font-bold tracking-wide border-b border-[#cfa756]/10 transition-colors ${
                    location.pathname === path
                      ? 'text-[#cfa756]'
                      : 'text-[#f7f4e9]/80 hover:text-[#cfa756]'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {location.pathname === path && (
                    <span className="inline-block ml-2 mb-0.5 align-middle">
                      <svg className="crown-icon" width="12" height="9" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="crownGradMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffe9a0">
                              <animate attributeName="stop-color" values="#ffe9a0;#f7d98a;#cfa756;#f7d98a;#ffe9a0" dur="2.2s" repeatCount="indefinite"/>
                            </stop>
                            <stop offset="100%" stopColor="#b8860b">
                              <animate attributeName="stop-color" values="#b8860b;#cfa756;#f7d98a;#cfa756;#b8860b" dur="2.2s" repeatCount="indefinite"/>
                            </stop>
                          </linearGradient>
                        </defs>
                        <polygon points="1,14 1,7 5,11 10,2 15,11 19,7 19,14" fill="url(#crownGradMobile)" stroke="#b8860b" strokeWidth="0.6" strokeLinejoin="round"/>
                        <rect x="1" y="13" width="18" height="2.5" rx="1" fill="url(#crownGradMobile)" stroke="#b8860b" strokeWidth="0.5"/>
                        <circle cx="10" cy="2.5" r="1.2" fill="#fff8e0"/>
                        <circle cx="1.2" cy="7.2" r="1" fill="#fff8e0"/>
                        <circle cx="18.8" cy="7.2" r="1" fill="#fff8e0"/>
                      </svg>
                    </span>
                  )}
                  {label}
                </Link>
              ))}

              {/* Auth במובייל */}
              <div
                className="mobile-link-enter mt-4 flex flex-col gap-2"
                style={{ animationDelay: `${navItems.length * 50}ms` }}
              >
                {AuthButtons}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="h-[72px]" />
    </>
  );
}

export default Header;