import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const uploadImages = async (files, userId) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  formData.append('userId', userId);
  
  const response = await api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getImageStatus = async (imageId) => {
  const response = await api.get(`/images/${imageId}/status`);
  return response.data;
};

export const getImageFile = async (imageId) => {
  const response = await api.get(`/images/${imageId}/file`);
  return response.data;
};

export const getUserImages = async (userId) => {
  const response = await api.get(`/images/user/${userId}`);
  return response.data;
};