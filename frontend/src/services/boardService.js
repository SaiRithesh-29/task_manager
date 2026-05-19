import api from './api';

export const getBoards = () => api.get('/boards');
export const getSharedBoards = () => api.get('/boards/shared');
export const getBoard = (id) => api.get('/boards/' + id);
export const getBoardFull = (id) => api.get('/boards/' + id + '/full');
export const createBoard = (data) => api.post('/boards', data);
export const updateBoard = (id, data) => api.put('/boards/' + id, data);
export const deleteBoard = (id) => api.delete('/boards/' + id);
export const getOnlineMembers = (id) => api.get('/boards/' + id + '/online');