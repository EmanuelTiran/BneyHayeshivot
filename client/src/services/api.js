import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchAnnouncements = () => API.get('/announcements');
export const createAnnouncement = (data) => API.post('/announcements', data);

export const fetchPrayers = () => API.get('/prayers');
export const createPrayer = (data) => API.post('/prayers', data);

export const sendContactMessage = (data) => API.post('/contact', data);

