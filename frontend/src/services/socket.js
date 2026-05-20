import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://task-manager-uc41.onrender.com';
const socket = io(SOCKET_URL, {
  autoConnect: false
});

export default socket;
