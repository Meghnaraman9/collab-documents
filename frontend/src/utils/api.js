import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export const getAllDocuments = () => API.get('/documents');
export const getDocument = (id) => API.get(`/documents/${id}`);
export const createDocument = (data) => API.post('/documents', data);
export const updateDocument = (id, data) => API.put(`/documents/${id}`, data);
export const deleteDocument = (id) => API.delete(`/documents/${id}`);
