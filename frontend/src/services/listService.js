import api from './api';

export const getLists = (boardId) => api.get(`/lists/${boardId}`);
export const createList = (data) => api.post('/lists', data);
export const updateList = (id, data) => api.put(`/lists/${id}`, data);
export const deleteList = (id) => api.delete(`/lists/${id}`);
