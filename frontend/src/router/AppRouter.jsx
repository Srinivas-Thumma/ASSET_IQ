import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import RoleLayout from '../components/layout/RoleLayout.jsx';
import SuperAdminLayout from '../components/layout/SuperAdminLayout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';

// Public Pages
import LandingPage from '../pages/public/LandingPage.jsx';
import Register from '../pages/public/Register.jsx';
import Login from '../pages/shared/Login.jsx';

// Shared Authenticated Pages
import AssetDetail from '../pages/shared/AssetDetail.jsx';
import Warranties from '../pages/shared/Warranties.jsx';

// Employee Pages
import MyAssets from '../pages/employee/MyAssets.jsx';
import MyTickets from '../pages/employee/MyTickets.jsx';
import TicketDetail from '../pages/employee/TicketDetail.jsx';
import TicketRouteDispatcher from '../components/tickets/TicketRouteDispatcher.jsx';

// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard.jsx';
import TicketQueue from '../pages/manager/TicketQueue.jsx';
import TicketWork from '../pages/manager/TicketWork.jsx';
import AssetInventory from '../pages/manager/AssetInventory.jsx';
import InspectionQueue from '../pages/manager/InspectionQueue.jsx';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard.jsx';
import ExceptionQueue from '../pages/admin/ExceptionQueue.jsx';
import ProcurementApprovals from '../pages/admin/ProcurementApprovals.jsx';
import RetirementApprovals from '../pages/admin/RetirementApprovals.jsx';
import Locations from '../pages/admin/Locations.jsx';
import Departments from '../pages/admin/Departments.jsx';
import Categories from '../pages/admin/Categories.jsx';
import Vendors from '../pages/admin/Vendors.jsx';
import Employees from '../pages/admin/Employees.jsx';
import Reports from '../pages/admin/Reports.jsx';
import Settings from '../pages/admin/Settings.jsx';

// Super Admin Pages
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard.jsx';
import Organizations from '../pages/superadmin/Organizations.jsx';
import OrganizationDetail from '../pages/superadmin/OrganizationDetail.jsx';
import Plans from '../pages/superadmin/Plans.jsx';
import SuperAdminAnalytics from '../pages/superadmin/SuperAdminAnalytics.jsx';
import AdminSupportQueue from '../pages/superadmin/AdminSupportQueue.jsx';
import SuperAdminSettings from '../pages/superadmin/SuperAdminSettings.jsx';

import { useAuthStore } from '../stores/auth.store.js';
import { ROLE_DEFAULT_ROUTES, ROLES } from '../utils/constants.js';

export const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!user?.role) return '/login';
    return ROLE_DEFAULT_ROUTES[user.role] || '/login';
  };

  return (
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

      {/* 3. Protected Super Admin Routes (Unified under standard RoleLayout) */}
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

      {/* 4. Protected Standard Tenant Routes */}
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
  );
};

export default AppRouter;
