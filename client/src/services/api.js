import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchAnnouncements = () => API.get('/announcements');
export const createAnnouncement = (data) => API.post('/announcements', data);

export const fetchPrayers = () => API.get('/prayers');
export const createPrayer = (data) => API.post('/prayers', data);

export const sendContactMessage = (data) => API.post('/contact', data);
export const fetchContactMessages = () => API.get('/contact');
export const updateContactMessageHandled = async (id, handled) => {
  const payload = { handled };

  try {
    return await API.patch(`/contact/${id}/handled`, payload);
  } catch (error) {
    const status = error?.response?.status;

    // Fallback for environments running older/different backend route shapes.
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

