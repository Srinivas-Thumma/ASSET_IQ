import React, { createContext, useContext } from 'react';
import { toast, Toaster } from 'sonner';

const ToastContext = createContext({
  toast,
  success: (msg, opts) => toast.success(msg, opts),
  error: (msg, opts) => toast.error(msg, opts),
  info: (msg, opts) => toast.info(msg, opts),
  warning: (msg, opts) => toast.warning(msg, opts)
});

export const ToastProvider = ({ children }) => {
  const toastMethods = {
    toast,
    success: (msg, opts) => toast.success(msg, opts),
    error: (msg, opts) => toast.error(msg, opts),
    info: (msg, opts) => toast.info(msg, opts),
    warning: (msg, opts) => toast.warning(msg, opts)
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
