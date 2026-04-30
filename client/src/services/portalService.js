import { API_URL } from '../config';
import axios from 'axios';

const API = axios.create({ baseURL: `${API_URL}/api` });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const fetchCategories      = ()           => API.get('/categories');
export const createCategory       = (data)       => API.post('/categories', data);
export const updateCategory       = (id, data)   => API.put(`/categories/${id}`, data);
export const deleteCategory       = (id)         => API.delete(`/categories/${id}`);

export const fetchItemsByCategory = (catId)      => API.get(`/portal-items/category/${catId}`);
export const fetchItemById        = (id)         => API.get(`/portal-items/${id}`);
export const createItem           = (data)       => API.post('/portal-items', data);
export const updateItem           = (id, data)   => API.put(`/portal-items/${id}`, data);
export const deleteItem           = (id)         => API.delete(`/portal-items/${id}`);

export const submitSponsorshipRequest = (data)   => API.post('/sponsorships', data);
export const fetchAllSponsorships     = ()       => API.get('/sponsorships');
export const updateSponsorshipStatus  = (id, status) => API.patch(`/sponsorships/${id}/status`, { status });
export const submitCommemorationRequest = (data) =>
    API.post('/sponsorships/from-commemoration', data);




