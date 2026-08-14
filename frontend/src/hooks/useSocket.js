import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store.js';

let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      return;
    }

    if (!globalSocket || !globalSocket.connected) {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        'http://localhost:5000/api';
      const socketServerUrl = apiBase.replace(/\/api\/?$/, '');

      globalSocket = io(socketServerUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      globalSocket.on('connect', () => {
        console.log('[Socket.IO] Connected to server successfully');
      });

      globalSocket.on('connect_error', (err) => {
        console.warn('[Socket.IO] Connection warning:', err.message);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('[Socket.IO] Disconnected:', reason);
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Keep persistent across route transitions while authenticated
    };
  }, [isAuthenticated, user]);

  return socketRef;
};

export default useSocket;
