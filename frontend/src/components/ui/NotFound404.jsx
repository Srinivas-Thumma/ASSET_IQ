import React from 'react';
import { useNavigate } from 'react-router-dom';
import LottieLoader from './LottieLoader.jsx';
import Button from './Button.jsx';

export const NotFound404 = ({
  title = '404 — Page Not Found',
  message = 'The page, resource, or entity you are looking for does not exist or has been removed.',
  showBackButton = true,
  backPath = '/'
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto space-y-3">
      <LottieLoader
        src="/404 Error Lottie animation.lottie"
        className="w-64 h-64"
        message=""
      />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {message}
      </p>
      {showBackButton && (
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => (typeof backPath === 'number' ? navigate(backPath) : navigate(backPath))}
          >
            Return to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotFound404;
