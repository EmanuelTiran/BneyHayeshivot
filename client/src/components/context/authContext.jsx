import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../../config';
import {
  AUTH_SESSION_UPDATED_EVENT,
  clearStoredAuthSession,
  refreshAuthSession,
  registerSessionExpiredHandler,
} from '../../services/api';

const AuthContext = createContext();
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

function readStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    return null;
  }
}

function isAuthenticationRejection(error) {
  return [401, 403].includes(
    error.response?.status
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] =
    useState('');

  const navigate = useNavigate();

  const applySession = useCallback(
    (userData, userToken, persist = true) => {
      setUser(userData);
      setToken(userToken);
      setSessionExpiredMsg('');

      if (persist) {
        localStorage.setItem(
          'user',
          JSON.stringify(userData)
        );
        localStorage.setItem('token', userToken);
      }
    },
    []
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredAuthSession();
  }, []);

  const handleSessionExpired = useCallback(() => {
    clearSession();
    setSessionExpiredMsg(
      'פג תוקף החיבור שלך. אנא התחבר מחדש.'
    );
    navigate('/login?reason=session_expired');
  }, [clearSession, navigate]);

  // Restore the HttpOnly browser session before protected routes render.
  useEffect(() => {
    let active = true;
    const cachedUser = readStoredUser();
    const cachedToken = localStorage.getItem('token');

    const restoreSession = async () => {
      try {
        const data = await refreshAuthSession();

        if (active) {
          applySession(data.user, data.token, false);
        }
      } catch (error) {
        if (!active) return;

        if (isAuthenticationRejection(error)) {
          clearSession();
        } else if (cachedUser && cachedToken) {
          // A temporary network failure must not erase a browser login.
          applySession(
            cachedUser,
            cachedToken,
            false
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, [applySession, clearSession]);

  // Axios refreshes also update React state immediately.
  useEffect(() => {
    const handleSessionUpdated = (event) => {
      const nextUser = event.detail?.user;
      const nextToken = event.detail?.token;

      if (nextUser && nextToken) {
        applySession(nextUser, nextToken, false);
      }
    };

    window.addEventListener(
      AUTH_SESSION_UPDATED_EVENT,
      handleSessionUpdated
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_UPDATED_EVENT,
        handleSessionUpdated
      );
    };
  }, [applySession]);

  useEffect(() => {
    return registerSessionExpiredHandler(
      handleSessionExpired
    );
  }, [handleSessionExpired]);

  // Keep the short-lived access token fresh while the browser session lives.
  useEffect(() => {
    if (!user) return undefined;

    const refresh = async () => {
      try {
        const data = await refreshAuthSession();
        applySession(data.user, data.token, false);
      } catch (error) {
        if (isAuthenticationRejection(error)) {
          handleSessionExpired();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    const intervalId = window.setInterval(
      () => void refresh(),
      REFRESH_INTERVAL_MS
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [applySession, handleSessionExpired, user]);

  const login = useCallback(
    (userData, userToken) => {
      applySession(userData, userToken);
    },
    [applySession]
  );

  const googleLogin = useCallback(
    async (credential) => {
      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ credential }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'התחברות עם גוגל נכשלה'
        );
      }

      login(data.user, data.token);
      return data;
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Local logout must still complete if the server is unavailable.
    } finally {
      clearSession();
      setSessionExpiredMsg('');
      navigate('/login');
    }
  }, [clearSession, navigate]);

  const isAuthenticated = Boolean(user);
  const isAdmin = () =>
    isAuthenticated &&
    user?.role?.toLowerCase() === 'admin';
  const isGabbai = () =>
    isAuthenticated &&
    user?.role?.toLowerCase() === 'gabbai';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        googleLogin,
        isAdmin,
        isGabbai,
        isAuthenticated,
        sessionExpiredMsg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
