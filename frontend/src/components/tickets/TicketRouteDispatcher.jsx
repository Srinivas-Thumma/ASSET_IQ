import React from 'react';
import { useAuthStore } from '../../stores/auth.store.js';
import TicketDetail from '../../pages/employee/TicketDetail.jsx';
import TicketWork from '../../pages/manager/TicketWork.jsx';

export const TicketRouteDispatcher = () => {
  const { user } = useAuthStore();

  if (user?.role === 'asset_manager' || user?.role === 'org_admin' || user?.role === 'super_admin') {
    return <TicketWork />;
  }

  return <TicketDetail />;
};

export default TicketRouteDispatcher;
