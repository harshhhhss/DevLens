import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devlens_token');
      localStorage.removeItem('devlens_user');
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const fetchMe = () => api.get('/auth/me');

export const submitReview = (data) => api.post('/review', data);
export const fetchReviewHistory = (page = 1, limit = 10) =>
  api.get(`/review/history?page=${page}&limit=${limit}`);
export const fetchReviewById = (id) => api.get(`/review/${id}`);
export const deleteReviewById = (id) => api.delete(`/review/${id}`);

export default api;
