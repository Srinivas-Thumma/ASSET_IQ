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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center">
          <img
            src="/logo.png"
            alt="AssetOwl Logo"
            className="w-16 h-16 rounded-2xl object-contain mx-auto shadow-lg shadow-purple-600/30 animate-pulse"
          />
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Initializing AssetOwl Security Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
};

export default App;
