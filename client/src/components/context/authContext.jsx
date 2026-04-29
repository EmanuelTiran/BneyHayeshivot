import { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ← חדש: התחברות דרך גוגל - שולח את ה-credential לשרת שלנו
  const googleLogin = async (credential) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'התחברות עם גוגל נכשלה');
    }

    login(data.user, data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user;
  const isAdmin  = () => isAuthenticated && user?.role?.toLowerCase() === 'admin';
  const isGabbai = () => isAuthenticated && user?.role?.toLowerCase() === 'gabbai';

  return (
    <AuthContext.Provider value={{ 
      user, token, login, logout, googleLogin,
      isAdmin, isGabbai, isAuthenticated, loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;