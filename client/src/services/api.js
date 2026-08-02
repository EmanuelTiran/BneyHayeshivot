import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export const AUTH_SESSION_UPDATED_EVENT =
  'bneyhayeshivot:auth-session-updated';

let refreshPromise = null;
let onSessionExpired = null;

function publishAuthSession({ token, user }) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);

  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_UPDATED_EVENT, {
      detail: { token, user },
    })
  );
}

export function clearStoredAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function handleSessionExpired() {
  clearStoredAuthSession();

  if (onSessionExpired) {
    onSessionExpired();
    return;
  }

  window.location.href =
    '/login?reason=session_expired';
}

function isAuthenticationRejection(error) {
  return [401, 403].includes(
    error.response?.status
  );
}

export function refreshAuthSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = API.post('/auth/refresh')
    .then(({ data }) => {
      if (!data?.token || !data?.user) {
        throw new Error(
          'Invalid refresh response'
        );
      }

      publishAuthSession(data);
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export const registerSessionExpiredHandler =
  (handler) => {
    onSessionExpired = handler;

    return () => {
      if (onSessionExpired === handler) {
        onSessionExpired = null;
      }
    };
  };

// ── Interceptor: צרף Access Token לכל בקשה ──────────────────────────────────
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isAuthLifecycleCall =
      /\/auth\/(login|google|register|refresh|logout)/
        .test(originalRequest?.url || '');

    if (
      is401 &&
      originalRequest &&
      !alreadyRetried &&
      !isAuthLifecycleCall
    ) {
      originalRequest._retry = true;

      try {
        const { token } = await refreshAuthSession();

        originalRequest.headers =
          originalRequest.headers || {};
        originalRequest.headers.Authorization =
          `Bearer ${token}`;

        return API(originalRequest);
      } catch (refreshError) {
        if (isAuthenticationRejection(refreshError)) {
          handleSessionExpired();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── ייצוא פונקציות API ────────────────────────────────────────────────────────

export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const logout = () => API.post('/auth/logout');

export const fetchAnnouncements = () => API.get('/announcements');
export const createAnnouncement = (data) => API.post('/announcements', data);
export const updateAnnouncement = (id, data) => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);

export const fetchPrayers = () => API.get('/prayers');
export const createPrayer = (data) => API.post('/prayers', data);
export const updatePrayers = (prayers, prayerSectionTitle) =>
  API.put('/prayers', { prayers, prayerSectionTitle });

export const sendContactMessage = (data) => API.post('/contact', data);
export const fetchContactMessages = (params) => API.get('/contact', { params });
export const updateContactMessageHandled = (id, handled) =>
  API.patch(`/contact/${id}/handled`, { handled });

export const fetchMyPayments = () => API.get('/payments/me');
export const addMyDebt = (data) => API.post('/payments/me/debts', data);
export const markMyDebtPaid = (debtId, isPaid) => API.patch(`/payments/me/debts/${debtId}`, { isPaid });
export const setMyStandingOrder = (data) => API.post('/payments/me/standing-order', data);
export const cancelMyStandingOrder = () => API.delete('/payments/me/standing-order');
export const addMyDonation = (data) => API.post('/payments/me/donations', data);

export const fetchAllPayments = () => API.get('/payments');
export const fetchUserPayments = (userId) => API.get(`/payments/${userId}`);
export const addUserDebt = (userId, data) => API.post(`/payments/${userId}/debts`, data);
export const markUserDebtPaid = (userId, debtId, isPaid) => API.patch(`/payments/${userId}/debts/${debtId}`, { isPaid });
export const deleteUserDebt = (userId, debtId) => API.delete(`/payments/${userId}/debts/${debtId}`);
export const setUserStandingOrder = (userId, data) => API.post(`/payments/${userId}/standing-order`, data);
export const cancelUserStandingOrder = (userId) => API.delete(`/payments/${userId}/standing-order`);
export const addUserDonation = (userId, data) => API.post(`/payments/${userId}/donations`, data);
export const deleteUserDonation = (userId, donationId) => API.delete(`/payments/${userId}/donations/${donationId}`);
export const updateUserNotes = (userId, notes) => API.patch(`/payments/${userId}/notes`, { notes });

export const fetchAllUsers = () => API.get('/users');
export const addMailingListUser = (data) => API.post('/users', data);

export const updateMailingListUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteMailingListUser = (id) => API.delete(`/users/${id}`);
export const toggleUserNewsletter = (id, receivesNewsletter) =>
  API.patch(`/users/${id}/newsletter`, { receivesNewsletter });

export const fetchCommemorations = () => API.get('/commemorations');
export const fetchCommemorationById = (id) => API.get(`/commemorations/${id}`);
export const createCommemoration = (data) => API.post('/commemorations', data);
export const updateCommemoration = (id, data) => API.put(`/commemorations/${id}`, data);
export const deleteCommemoration = (id) => API.delete(`/commemorations/${id}`);
export const updateCommemorationStatus = (id, status) =>
  API.patch(`/commemorations/${id}/status`, { commemorationStatus: status });

export const fetchGalleryImages = () => API.get('/gallery');
export const createGalleryImage = (data) => API.post('/gallery', data);
export const updateGalleryImage = (id, data) => API.put(`/gallery/${id}`, data);
export const deleteGalleryImage = (id) => API.delete(`/gallery/${id}`);

export default API;
