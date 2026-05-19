import api from './api';

export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post('/auth/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
