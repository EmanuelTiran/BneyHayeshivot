// components/common/Header.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes';
import { useAuth } from '../context/authContext';

function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // סגירת תפריט נייד בעת שינוי route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // פונקציה לבדיקה אם הקישור הנוכחי פעיל
  const isActiveLink = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  // רכיב לקישורי ניווט
  const NavigationLink = ({ to, children, className = "", onClick = null }) => (
    <Link
      to={to}
      className={`hover:text-[#cfa756] transition-colors duration-300 ${
        isActiveLink(to) 
          ? 'text-[#cfa756] font-bold border-b-2 border-[#cfa756] pb-1' 
          : 'text-[#f7f4e9]'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );

  // רכיב לכפתורי התחברות/הרשמה
  const AuthButtons = useMemo(() => {
    if (isAuthenticated) {
      return (
        <div className="flex items-center">
          <span className="ml-4 text-lg font-medium text-[#f7f4e9]">
            שלום, {user?.name || 'משתמש'}!
          </span>
          <button
            onClick={logout}
            className="bg-[#a61b1b] hover:bg-[#801515] text-white px-5 py-2 rounded-md transition-colors ml-4 focus:outline-none focus:ring-2 focus:ring-[#cfa756] shadow-md"
            aria-label="התנתק מהמערכת"
          >
            התנתק
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <Link
          to={ROUTES.LOGIN}
          className="border-2 border-[#cfa756] text-[#cfa756] hover:bg-[#cfa756] hover:text-[#0d2340] px-5 py-2 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cfa756] font-medium"
        >
          התחבר
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="bg-[#cfa756] hover:bg-[#b8860b] text-[#0d2340] px-5 py-2 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cfa756] font-bold shadow-md"
        >
          הירשם
        </Link>
      </div>
    );
  }, [isAuthenticated, user?.name, logout]);

  // רכיב לתפריט נייד
  const MobileAuthButtons = useMemo(() => {
    if (isAuthenticated) {
      return (
        <div className="flex flex-col space-y-3 mt-4 border-t border-[#cfa756]/30 pt-4">
          <span className="text-lg font-medium text-[#cfa756]">
            שלום, {user?.name || 'משתמש'}!
          </span>
          <button
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            className="bg-[#a61b1b] hover:bg-[#801515] text-white px-4 py-2 rounded-md transition-colors text-right focus:outline-none shadow-sm"
            aria-label="התנתק מהמערכת"
          >
            התנתק
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-3 mt-4 border-t border-[#cfa756]/30 pt-4">
        <Link
          to={ROUTES.LOGIN}
          className="border border-[#cfa756] text-[#cfa756] hover:bg-[#cfa756] hover:text-[#0d2340] px-4 py-2 rounded-md transition-colors text-right"
          onClick={() => setIsMenuOpen(false)}
        >
          התחבר
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="bg-[#cfa756] hover:bg-[#b8860b] text-[#0d2340] font-bold px-4 py-2 rounded-md transition-colors text-right"
          onClick={() => setIsMenuOpen(false)}
        >
          הירשם
        </Link>
      </div>
    );
  }, [isAuthenticated, user?.name, logout]);

  return (
    <header className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] border-b-4 border-[#cfa756] shadow-lg relative z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* לוגו / שם האתר */}
         {/* לוגו - תמונה במקום טקסט */}
<Link 
  to={ROUTES.HOME}
  className="flex items-center"
  aria-label="דף הבית"
>
  <img 
    src="/logo.png" 
    alt="לוגו" 
    className="h-10 md:h-14 w-auto object-contain transition-transform duration-300 hover:scale-105"
  />
</Link>

          {/* תפריט המבורגר למובייל */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-[#cfa756] hover:text-[#f7f4e9] focus:outline-none p-2 rounded transition-colors"
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={isMenuOpen}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>

          {/* תפריט למחשב */}
          <nav className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse" role="navigation">
            {NAVIGATION_ITEMS.map(({ path, label }) => (
              <NavigationLink key={path} to={path}>
                {label}
              </NavigationLink>
            ))}

            {isAuthenticated && isAdmin() && (
              <NavigationLink to={ROUTES.ADMIN}>
                ניהול
              </NavigationLink>
            )}

            <div className="mr-6 border-r border-[#cfa756]/30 pr-6 h-8 flex items-center">
              {AuthButtons}
            </div>
          </nav>
        </div>

        {/* תפריט נייד */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4" role="navigation">
            <div className="flex flex-col space-y-4 text-right">
              {NAVIGATION_ITEMS.map(({ path, label }) => (
                <NavigationLink 
                  key={path} 
                  to={path} 
                  className="text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </NavigationLink>
              ))}

              {isAuthenticated && isAdmin() && (
                <NavigationLink 
                  to={ROUTES.ADMIN} 
                  className="text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ניהול
                </NavigationLink>
              )}

              {MobileAuthButtons}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;