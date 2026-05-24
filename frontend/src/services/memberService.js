import api from './api';

export const addMember = (boardId, email) => api.post(`/boards/${boardId}/members`, { email });
export const removeMember = (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`);
export const updateMemberPermissions = (boardId, userId, permissions) => api.patch(`/boards/${boardId}/members/${userId}/permissions`, permissions);
