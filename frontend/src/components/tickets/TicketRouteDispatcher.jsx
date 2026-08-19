import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ticketApi from '../../api/ticket.api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import TicketDetail from '../../pages/employee/TicketDetail.jsx';
import TicketWork from '../../pages/manager/TicketWork.jsx';
import SuperAdminTicketView from './SuperAdminTicketView.jsx';
import PlatformSupportTicketView from './PlatformSupportTicketView.jsx';
import Skeleton from '../ui/Skeleton.jsx';

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
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
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
