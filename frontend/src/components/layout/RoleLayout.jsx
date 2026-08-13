import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import PageWrapper from './PageWrapper.jsx';

export const RoleLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar: fixed width, full viewport height, independent scroll if needed */}
      <Sidebar />

      {/* Main content: takes remaining width, scrolls independently */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden flex flex-col min-w-0">
        <Navbar />
        <div className="p-6 flex-1 min-h-0 max-w-7xl w-full mx-auto">
          <PageWrapper pageId={location.pathname}>
            <Outlet />
          </PageWrapper>
        </div>
      </main>
    </div>
  );
};

export default RoleLayout;
