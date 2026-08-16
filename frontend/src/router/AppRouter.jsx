import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import RoleLayout from '../components/layout/RoleLayout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';

// ─── LAZY LOADED ROUTE CHUNKS ───────────────────────────────────────────────

// Public Pages
const LandingPage = lazy(() => import('../pages/public/LandingPage.jsx'));
const Register = lazy(() => import('../pages/public/Register.jsx'));
const Login = lazy(() => import('../pages/shared/Login.jsx'));

// Shared Authenticated Pages
const AssetDetail = lazy(() => import('../pages/shared/AssetDetail.jsx'));
const Warranties = lazy(() => import('../pages/shared/Warranties.jsx'));
const TicketRouteDispatcher = lazy(() => import('../components/tickets/TicketRouteDispatcher.jsx'));

// Employee Pages
const MyAssets = lazy(() => import('../pages/employee/MyAssets.jsx'));
const MyTickets = lazy(() => import('../pages/employee/MyTickets.jsx'));

// Manager Pages
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard.jsx'));
const TicketQueue = lazy(() => import('../pages/manager/TicketQueue.jsx'));
const AssetInventory = lazy(() => import('../pages/manager/AssetInventory.jsx'));
const InspectionQueue = lazy(() => import('../pages/manager/InspectionQueue.jsx'));

// Admin Pages
const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const ExceptionQueue = lazy(() => import('../pages/admin/ExceptionQueue.jsx'));
const ProcurementApprovals = lazy(() => import('../pages/admin/ProcurementApprovals.jsx'));
const RetirementApprovals = lazy(() => import('../pages/admin/RetirementApprovals.jsx'));
const Locations = lazy(() => import('../pages/admin/Locations.jsx'));
const Departments = lazy(() => import('../pages/admin/Departments.jsx'));
const Categories = lazy(() => import('../pages/admin/Categories.jsx'));
const Vendors = lazy(() => import('../pages/admin/Vendors.jsx'));
const Employees = lazy(() => import('../pages/admin/Employees.jsx'));
const Reports = lazy(() => import('../pages/admin/Reports.jsx'));
const Settings = lazy(() => import('../pages/admin/Settings.jsx'));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/SuperAdminDashboard.jsx'));
const Organizations = lazy(() => import('../pages/superadmin/Organizations.jsx'));
const OrganizationDetail = lazy(() => import('../pages/superadmin/OrganizationDetail.jsx'));
const Plans = lazy(() => import('../pages/superadmin/Plans.jsx'));
const SuperAdminAnalytics = lazy(() => import('../pages/superadmin/SuperAdminAnalytics.jsx'));
const AdminSupportQueue = lazy(() => import('../pages/superadmin/AdminSupportQueue.jsx'));
const SuperAdminSettings = lazy(() => import('../pages/superadmin/SuperAdminSettings.jsx'));

import { useAuthStore } from '../stores/auth.store.js';
import { ROLE_DEFAULT_ROUTES, ROLES } from '../utils/constants.js';

/**
 * Elegant page loading indicator for Suspense chunk resolution
 */
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-medium text-slate-400 animate-pulse">Loading View...</p>
  </div>
);

export const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!user?.role) return '/login';
    return ROLE_DEFAULT_ROUTES[user.role] || '/login';
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. Public Landing / Auth */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* 2. Protected Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
          <Route element={<RoleLayout />}>
            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/admin/organizations" element={<Organizations />} />
            <Route path="/admin/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/admin/plans" element={<Plans />} />
            <Route path="/admin/analytics" element={<SuperAdminAnalytics />} />
            <Route path="/admin/support" element={<AdminSupportQueue />} />
            <Route path="/admin/settings" element={<SuperAdminSettings />} />
          </Route>
        </Route>

        {/* 3. Protected Standard Tenant Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleLayout />}>
            {/* Shared Detail Pages */}
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/warranties" element={<Warranties />} />
            <Route path="/ticket/:id" element={<TicketRouteDispatcher />} />
            <Route path="/tickets/:id" element={<TicketRouteDispatcher />} />

            {/* Employee */}
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/my-tickets" element={<MyTickets />} />

            {/* Manager & Admin Dashboard */}
            <Route
              path="/dashboard"
              element={user?.role === 'asset_manager' ? <ManagerDashboard /> : <Dashboard />}
            />

            {/* Manager */}
            <Route path="/tickets" element={<TicketQueue />} />
            <Route path="/assets" element={<AssetInventory />} />
            <Route path="/inspections" element={<InspectionQueue />} />

            {/* Admin */}
            <Route path="/exceptions" element={<ExceptionQueue />} />
            <Route path="/procurement" element={<ProcurementApprovals />} />
            <Route path="/retirements" element={<RetirementApprovals />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
