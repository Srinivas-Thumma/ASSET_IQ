import React, { useEffect } from 'react';
import AppRouter from './router/AppRouter.jsx';
import { useAuthStore } from './stores/auth.store.js';
import { useNotificationSocket } from './hooks/useNotificationSocket.js';
import ToastProvider from './components/ui/ToastProvider.jsx';

export const App = () => {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global socket listener for live alerts & notifications
  useNotificationSocket();

  // If session is initializing, render AppRouter directly so page LottieLoader buffers smoothly
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
};

export default App;
