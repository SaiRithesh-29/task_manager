import api from './api';

export const getActivities = (boardId) => api.get(`/activity/${boardId}`);
