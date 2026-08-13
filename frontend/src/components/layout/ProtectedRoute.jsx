import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import Skeleton from '../ui/Skeleton.jsx';
import { ROLE_DEFAULT_ROUTES } from '../../utils/constants.js';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 space-y-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <Skeleton variant="text" className="h-6 w-1/3 mx-auto" />
          <Skeleton count={4} />
        </div>
      </div>
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
