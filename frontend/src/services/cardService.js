import api from './api';

export const getCards = (listId) => api.get(`/cards/${listId}`);
export const createCard = (data) => api.post('/cards', data);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data);
export const deleteCard = (id) => api.delete(`/cards/${id}`);

export const updateLabels = (id, labels) => api.put(`/cards/${id}/labels`, { labels });
export const addSubtask = (id, title) => api.post(`/cards/${id}/subtasks`, { title });
export const toggleSubtask = (id, subtaskId) => api.patch(`/cards/${id}/subtasks/${subtaskId}/toggle`);
export const removeSubtask = (id, subtaskId) => api.delete(`/cards/${id}/subtasks/${subtaskId}`);
export const addComment = (id, text, name) => api.post(`/cards/${id}/comments`, { text, name });
export const deleteComment = (id, commentId) => api.delete(`/cards/${id}/comments/${commentId}`);
export const updateAssignees = (id, assignees) => api.put(`/cards/${id}/assignees`, { assignees });
export const archiveCard = (id, archived) => api.patch(`/cards/${id}/archive`, { archived });
export const deleteAttachment = (id, attachmentIdx) => api.delete(`/cards/${id}/attachments/${attachmentIdx}`);
