import api from './api'; // axios instance קיים

export const fetchGalleryImages = ()           => api.get('/gallery');
export const createGalleryImage = (data)       => api.post('/gallery', data);
export const updateGalleryImage = (id, data)   => api.put(`/gallery/${id}`, data);
export const deleteGalleryImage = (id)         => api.delete(`/gallery/${id}`);