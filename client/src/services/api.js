import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL:         `${API_URL}/api`,
  withCredentials: true, // ← חובה! שולח את cookie עם כל בקשה
});

// ── משתנה פנימי למנוע קריאות refresh מקביליות ───────────────────────────────
let isRefreshing     = false;
let failedQueue      = [];  // תור בקשות שנכשלו בזמן הרענון

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

// ── Interceptor: צרף Access Token לכל בקשה ──────────────────────────────────
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Interceptor: טיפול ב-401 / רענון אוטומטי ────────────────────────────────
API.interceptors.response.use(
  (response) => response, // הצלחה — העבר הלאה

  async (error) => {
    const originalRequest = error.config;

    const is401          = error.response?.status === 401;
    const alreadyRetried = originalRequest._retry;
    const isRefreshCall  = originalRequest.url?.includes('/auth/refresh');
    const isLoginCall    = originalRequest.url?.includes('/auth/login');

    // אם זו שגיאת 401 על בקשה שעוד לא ניסינו לרענן
    if (is401 && !alreadyRetried && !isRefreshCall && !isLoginCall) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // הרענון כבר בתהליך — הוסף לתור והמתן
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // נסה לרענן — ה-refresh token מגיע מה-cookie אוטומטית
        const { data } = await API.post('/auth/refresh');
        const newToken = data.token;

        localStorage.setItem('token', newToken);
        API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization     = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return API(originalRequest); // חזור על הבקשה המקורית

      } catch (refreshError) {
        // הרענון נכשל — הפעל logout גלובלי
        processQueue(refreshError, null);
        handleSessionExpired();
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── פונקציה גלובלית לטיפול בפקיעת session ────────────────────────────────────
// authContext רושם את עצמו כאן כדי ש-api.js לא ייבא ממנו (circular import)
let _onSessionExpired = null;

export const registerSessionExpiredHandler = (handler) => {
  _onSessionExpired = handler;
};

const handleSessionExpired = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (_onSessionExpired) {
    _onSessionExpired();
  } else {
    // fallback אם ה-handler לא נרשם עדיין
    window.location.href = '/login?reason=session_expired';
  }
};

// ── ייצוא פונקציות API ────────────────────────────────────────────────────────

export const login    = (credentials) => API.post('/auth/login',    credentials);
export const register = (userData)    => API.post('/auth/register', userData);
export const logout   = ()            => API.post('/auth/logout');

export const fetchAnnouncements = ()           => API.get('/announcements');
export const createAnnouncement = (data)       => API.post('/announcements', data);
export const updateAnnouncement = (id, data)   => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id)         => API.delete(`/announcements/${id}`);

export const fetchPrayers  = ()        => API.get('/prayers');
export const createPrayer  = (data)    => API.post('/prayers', data);
export const updatePrayers = (prayers, prayerSectionTitle) =>
  API.put('/prayers', { prayers, prayerSectionTitle });

export const sendContactMessage          = (data)            => API.post('/contact', data);
export const fetchContactMessages        = ()                => API.get('/contact');
export const updateContactMessageHandled = (id, handled) =>
  API.patch(`/contact/${id}/handled`, { handled });

export const fetchMyPayments       = ()               => API.get('/payments/me');
export const addMyDebt             = (data)           => API.post('/payments/me/debts', data);
export const markMyDebtPaid        = (debtId, isPaid) => API.patch(`/payments/me/debts/${debtId}`, { isPaid });
export const setMyStandingOrder    = (data)           => API.post('/payments/me/standing-order', data);
export const cancelMyStandingOrder = ()               => API.delete('/payments/me/standing-order');
export const addMyDonation         = (data)           => API.post('/payments/me/donations', data);

export const fetchAllPayments        = ()                       => API.get('/payments');
export const fetchUserPayments       = (userId)                 => API.get(`/payments/${userId}`);
export const addUserDebt             = (userId, data)           => API.post(`/payments/${userId}/debts`, data);
export const markUserDebtPaid        = (userId, debtId, isPaid) => API.patch(`/payments/${userId}/debts/${debtId}`, { isPaid });
export const deleteUserDebt          = (userId, debtId)         => API.delete(`/payments/${userId}/debts/${debtId}`);
export const setUserStandingOrder    = (userId, data)           => API.post(`/payments/${userId}/standing-order`, data);
export const cancelUserStandingOrder = (userId)                 => API.delete(`/payments/${userId}/standing-order`);
export const addUserDonation         = (userId, data)           => API.post(`/payments/${userId}/donations`, data);
export const deleteUserDonation      = (userId, donationId)     => API.delete(`/payments/${userId}/donations/${donationId}`);
export const updateUserNotes         = (userId, notes)          => API.patch(`/payments/${userId}/notes`, { notes });

export const fetchAllUsers            = () => API.get('/users');
export const fetchCommemorations      = () => API.get('/commemorations');
export const fetchCommemorationById   = (id)        => API.get(`/commemorations/${id}`);
export const createCommemoration      = (data)      => API.post('/commemorations', data);
export const updateCommemoration      = (id, data)  => API.put(`/commemorations/${id}`, data);
export const deleteCommemoration      = (id)        => API.delete(`/commemorations/${id}`);
export const updateCommemorationStatus = (id, status) =>
  API.patch(`/commemorations/${id}/status`, { commemorationStatus: status });

export const fetchGalleryImages = ()         => API.get('/gallery');
export const createGalleryImage = (data)     => API.post('/gallery', data);
export const updateGalleryImage = (id, data) => API.put(`/gallery/${id}`, data);
export const deleteGalleryImage = (id)       => API.delete(`/gallery/${id}`);

export default API;