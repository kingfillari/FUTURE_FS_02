import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

// Leads API
export const fetchLeads = async (params = {}) => {
  const response = await api.get('/leads', { params });
  return response.data;
};

export const updateLeadStatus = async (leadId, status) => {
  const response = await api.put(`/leads/${leadId}/status`, { status });
  return response.data;
};

export const deleteLead = async (leadId) => {
  const response = await api.delete(`/leads/${leadId}`);
  return response.data;
};

// Notes API
export const fetchNotes = async (leadId) => {
  const response = await api.get(`/leads/${leadId}/notes`);
  return response.data;
};

export const addNote = async (leadId, noteText, followUpDate) => {
  const response = await api.post(`/leads/${leadId}/notes`, { noteText, followUpDate });
  return response.data;
};

export const deleteNote = async (noteId) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};

export default api;