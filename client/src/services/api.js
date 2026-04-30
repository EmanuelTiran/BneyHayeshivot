// api.js
import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ── אימות ────────────────────────────────────────────────────────────────────
export const login    = (credentials) => API.post('/auth/login', credentials);
export const register = (userData)    => API.post('/auth/register', userData);

// ── מודעות ────────────────────────────────────────────────────────────────────
export const fetchAnnouncements = ()           => API.get('/announcements');
export const createAnnouncement = (data)       => API.post('/announcements', data);
export const updateAnnouncement = (id, data)   => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);
// ── תפילות ────────────────────────────────────────────────────────────────────
export const fetchPrayers  = ()        => API.get('/prayers');
export const createPrayer  = (data)    => API.post('/prayers', data);
export const updatePrayers = (prayers) => API.put('/prayers', { prayers });

// ── יצירת קשר ────────────────────────────────────────────────────────────────
export const sendContactMessage           = (data)           => API.post('/contact', data);
export const fetchContactMessages         = ()               => API.get('/contact');
export const updateContactMessageHandled  = async (id, handled) => {
  const payload = { handled };
  try {
    return await API.patch(`/contact/${id}/handled`, payload);
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      try {
        return await API.patch(`/contact/${id}`, payload);
      } catch (secondError) {
        const secondStatus = secondError?.response?.status;
        if (secondStatus === 404 || secondStatus === 405) {
          return API.put(`/contact/${id}/handled`, payload);
        }
        throw secondError;
      }
    }
    throw error;
  }
};

// ── תשלומים ───────────────────────────────────────────────────────────────────

/** משתמש רגיל */
export const fetchMyPayments        = ()               => API.get('/payments/me');
export const addMyDebt              = (data)           => API.post('/payments/me/debts', data);
export const markMyDebtPaid         = (debtId, isPaid) => API.patch(`/payments/me/debts/${debtId}`, { isPaid });
export const setMyStandingOrder     = (data)           => API.post('/payments/me/standing-order', data);
export const cancelMyStandingOrder  = ()               => API.delete('/payments/me/standing-order');
export const addMyDonation          = (data)           => API.post('/payments/me/donations', data);

/** אדמין */
export const fetchAllPayments        = ()                    => API.get('/payments');
export const fetchUserPayments       = (userId)              => API.get(`/payments/${userId}`);
export const addUserDebt             = (userId, data)        => API.post(`/payments/${userId}/debts`, data);
export const markUserDebtPaid        = (userId, debtId, isPaid) => API.patch(`/payments/${userId}/debts/${debtId}`, { isPaid });
export const deleteUserDebt          = (userId, debtId)      => API.delete(`/payments/${userId}/debts/${debtId}`);
export const setUserStandingOrder    = (userId, data)        => API.post(`/payments/${userId}/standing-order`, data);
export const cancelUserStandingOrder = (userId)              => API.delete(`/payments/${userId}/standing-order`);
export const addUserDonation         = (userId, data)        => API.post(`/payments/${userId}/donations`, data);
export const deleteUserDonation      = (userId, donationId)  => API.delete(`/payments/${userId}/donations/${donationId}`);
export const updateUserNotes         = (userId, notes)       => API.patch(`/payments/${userId}/notes`, { notes });

// ── משתמשים ───────────────────────────────────────────────────────────────────
export const fetchAllUsers = () => API.get('/users');

// ── הנצחות ────────────────────────────────────────────────────────────────────
export const fetchCommemorations   = ()           => API.get('/commemorations');
export const fetchCommemorationById = (id)        => API.get(`/commemorations/${id}`);
export const createCommemoration   = (data)       => API.post('/commemorations', data);
export const updateCommemoration   = (id, data)   => API.put(`/commemorations/${id}`, data);
export const deleteCommemoration   = (id)         => API.delete(`/commemorations/${id}`);
export const updateCommemorationStatus = (id, status) =>  // ← חדש
  API.patch(`/commemorations/${id}/status`, { commemorationStatus: status });

  // ── גלריה ─────────────────────────────────────────────────────────────────────
export const fetchGalleryImages = ()         => API.get('/gallery');
export const createGalleryImage = (data)     => API.post('/gallery', data);
export const updateGalleryImage = (id, data) => API.put(`/gallery/${id}`, data);
export const deleteGalleryImage = (id)       => API.delete(`/gallery/${id}`);