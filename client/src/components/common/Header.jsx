// components/common/Header.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // מחיקת הטוקן והמשתמש מה-localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">בית הכנסת</Link>
          
          {/* תפריט המבורגר למובייל */}
          <div className="lg:hidden">
            <button 
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
              </svg>
            </button>
          </div>
          
          {/* תפריט למחשב */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition-colors ml-6">דף הבית</Link>
            <Link to="/prayers" className="hover:text-blue-200 transition-colors ml-6">תפילות</Link>
            <Link to="/announcements" className="hover:text-blue-200 transition-colors ml-6">הודעות</Link>
            <Link to="/contact" className="hover:text-blue-200 transition-colors ml-6">צור קשר</Link>
            
            {isLoggedIn && user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-blue-200 transition-colors ml-6">ניהול</Link>
            )}
            
            {isLoggedIn ? (
              <div className="flex items-center">
                <span className="ml-2">שלום {user?.name}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                >
                  התנתק
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors ml-2"
                >
                  התחבר
                </Link>
                <Link 
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                >
                  הירשם
                </Link>
              </div>
            )}
          </nav>
        </div>
        
        {/* תפריט נייד */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4">
            <div className="flex flex-col space-y-3 text-right">
              <Link to="/" className="hover:text-blue-200 transition-colors py-2">דף הבית</Link>
              <Link to="/prayers" className="hover:text-blue-200 transition-colors py-2">תפילות</Link>
              <Link to="/announcements" className="hover:text-blue-200 transition-colors py-2">הודעות</Link>
              <Link to="/contact" className="hover:text-blue-200 transition-colors py-2">צור קשר</Link>
              
              {isLoggedIn && user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-blue-200 transition-colors py-2">ניהול</Link>
              )}
              
              {isLoggedIn ? (
                <div className="flex flex-col space-y-2">
                  <span>שלום {user?.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors text-right"
                  >
                    התנתק
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/login" 
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors text-right"
                  >
                    התחבר
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors text-right"
                  >
                    הירשם
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;