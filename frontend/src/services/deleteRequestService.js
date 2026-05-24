import api from './api';

export const getDeleteRequests = (boardId) => api.get(`/delete-requests/${boardId}`);
export const createDeleteRequest = (data) => api.post('/delete-requests', data);
export const approveDeleteRequest = (id) => api.patch(`/delete-requests/${id}/approve`);
export const denyDeleteRequest = (id) => api.patch(`/delete-requests/${id}/deny`);
