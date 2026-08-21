import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ticketApi from '../../api/ticket.api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import TicketDetail from '../../pages/employee/TicketDetail.jsx';
import TicketWork from '../../pages/manager/TicketWork.jsx';
import SuperAdminTicketView from './SuperAdminTicketView.jsx';
import PlatformSupportTicketView from './PlatformSupportTicketView.jsx';
import NotFound404 from '../ui/NotFound404.jsx';
import LottieLoader from '../ui/LottieLoader.jsx';

export const TicketRouteDispatcher = () => {
  const { id } = useParams();
  const { user } = useAuthStore();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => (ticketApi.getTicketById ? ticketApi.getTicketById(id) : ticketApi.getTicket(id)),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return (
      <LottieLoader
        src="/Loading 52 _ Mario.lottie"
        className="w-44 h-44"
        message="Loading Support Ticket Case..."
        fullPage
      />
    );
  }

  if (!ticket) {
    return (
      <NotFound404
        title="Ticket Case Not Found"
        message="The requested support case or operational ticket does not exist or has been deleted."
        backPath={-1}
      />
    );
  }

  // 1. Platform Support Tickets (Org Admin <-> SuperAdmin communication)
  if (ticket?.type === 'admin_support') {
    return <PlatformSupportTicketView />;
  }

  // 2. SuperAdmin viewing standard tenant operational tickets (strictly read-only)
  if (user?.role === 'super_admin') {
    return <SuperAdminTicketView />;
  }

  // 3. Asset Manager / Org Admin handling internal operational tickets
  if (user?.role === 'asset_manager' || user?.role === 'org_admin') {
    return <TicketWork />;
  }

  // 4. Employee viewing their own ticket
  return <TicketDetail />;
};

export default TicketRouteDispatcher;
