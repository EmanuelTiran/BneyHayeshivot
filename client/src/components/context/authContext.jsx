import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { registerSessionExpiredHandler } from '../../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // הודעת פקיעת session — מוצגת בדף הלוגין
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');

  const navigate = useNavigate();

  // ── טעינה ראשונית ────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ── רישום handler לפקיעת session (נקרא מ-api.js) ────────────────────────────
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
      setSessionExpiredMsg('פג תוקף החיבור שלך. אנא התחבר מחדש.');
      navigate('/login?reason=session_expired');
    });
  }, [navigate]);

  // ── login ─────────────────────────────────────────────────────────────────────
  const login = useCallback((userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setSessionExpiredMsg('');
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // ── googleLogin ───────────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (credential) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include', // ← חובה!
      body:        JSON.stringify({ credential }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'התחברות עם גוגל נכשלה');

    login(data.user, data.token);
    return data;
  }, [login]);

  // ── logout ─────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // מחיקת ה-refresh token בשרת
      await fetch(`${API_URL}/api/auth/logout`, {
        method:      'POST',
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
    } catch { /* silent fail */ }

    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [token, navigate]);

  const isAuthenticated = !!user;
  const isAdmin  = () => isAuthenticated && user?.role?.toLowerCase() === 'admin';
  const isGabbai = () => isAuthenticated && user?.role?.toLowerCase() === 'gabbai';

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, googleLogin,
      isAdmin, isGabbai, isAuthenticated,
      sessionExpiredMsg, // ← העבר לדף הלוגין
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;