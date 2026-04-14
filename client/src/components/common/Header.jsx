// components/common/Header.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // פונקציה לבדיקת סטטוס האימות
  const checkAuthStatus = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(parsedUser);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      // במקרה של שגיאה, נסיר את הנתונים הפגומים
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    // האזנה לשינויים ב-storage
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

  // סגירת תפריט נייד בעת שינוי route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
      setIsMenuOpen(false);
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [navigate]);

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
      className={`hover:text-blue-200 transition-colors ${isActiveLink(to) ? 'text-blue-200 font-semibold' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );

  // רכיב לכפתורי התחברות/הרשמה
  const AuthButtons = useMemo(() => {
    if (isLoggedIn) {
      return (
        <div className="flex items-center">
          <span className="ml-4 text-lg font-medium">
            שלום, {user?.name || 'משתמש'}!
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors ml-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="התנתק מהמערכת"
          >
            התנתק
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Link
          to={ROUTES.LOGIN}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors ml-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          התחבר
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          הירשם
        </Link>
      </div>
    );
  }, [isLoggedIn, user?.name, handleLogout]);

  // רכיב לתפריט נייד
  const MobileAuthButtons = useMemo(() => {
    if (isLoggedIn) {
      return (
        <div className="flex flex-col space-y-2">
          <span className="text-lg font-medium">
            שלום, {user?.name || 'משתמש'}!
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors text-right focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="התנתק מהמערכת"
          >
            התנתק
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-2">
        <Link
          to={ROUTES.LOGIN}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors text-right focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setIsMenuOpen(false)}
        >
          התחבר
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors text-right focus:outline-none focus:ring-2 focus:ring-green-300"
          onClick={() => setIsMenuOpen(false)}
        >
          הירשם
        </Link>
      </div>
    );
  }, [isLoggedIn, user?.name, handleLogout]);

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            to={ROUTES.HOME}
            className="text-2xl font-bold hover:text-blue-200 transition-colors"
            aria-label="דף הבית של בית הכנסת"
          >
            בית הכנסת
          </Link>

          {/* תפריט המבורגר למובייל */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none focus:ring-2 focus:ring-blue-300 p-2 rounded"
              aria-label={isMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={isMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>

          {/* תפריט למחשב */}
          <nav className="hidden lg:flex items-center space-x-6" role="navigation">
            {NAVIGATION_ITEMS.map(({ path, label }) => (
              <NavigationLink key={path} to={path} className="ml-6">
                {label}
              </NavigationLink>
            ))}

            {isLoggedIn && user?.role === 'admin' && (
              <NavigationLink to={ROUTES.ADMIN} className="ml-6">
                ניהול
              </NavigationLink>
            )}

            {AuthButtons}
          </nav>
        </div>

        {/* תפריט נייד */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4" role="navigation">
            <div className="flex flex-col space-y-3 text-right">
              {NAVIGATION_ITEMS.map(({ path, label }) => (
                <NavigationLink 
                  key={path} 
                  to={path} 
                  className="py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </NavigationLink>
              ))}

              {isLoggedIn && user?.role === 'admin' && (
                <NavigationLink 
                  to={ROUTES.ADMIN} 
                  className="py-2"
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