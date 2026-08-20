import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import LottieLoader from '../ui/LottieLoader.jsx';
import { ROLE_DEFAULT_ROUTES } from '../../utils/constants.js';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading && !isAuthenticated) {
    return (
      <LottieLoader
        src="/Loading 40 _ Paperplane.lottie"
        className="w-44 h-44"
        message="Loading AssetOwl..."
        fullPage
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    const redirectPath = ROLE_DEFAULT_ROUTES[user.role] || '/my-assets';
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
