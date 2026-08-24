import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ShieldAlert, Building2, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import LottieLoader from '../../components/ui/LottieLoader.jsx';
import TicketChat from '../../components/tickets/TicketChat.jsx';
import { conversationApi } from '../../api/conversation.api.js';

export const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: conversation, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversationApi.getConversationById(id),
    enabled: Boolean(id)
  });

  const { data: messages = [], isLoading: isMsgLoading, refetch } = useQuery({
    queryKey: ['conversation-messages', id],
    queryFn: () => conversationApi.getConversationMessages(id),
    enabled: Boolean(id)
  });

  if (isConvLoading || isMsgLoading) {
    return (
      <LottieLoader
        src="/Loading 52 _ Mario.lottie"
        className="w-44 h-44"
        message="Loading B2B Organization Channel..."
        fullPage
      />
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Conversation Channel Restricted
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested conversation channel does not exist or you lack authorization to access it.
        </p>
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Conversations', to: '/admin/support' },
          { label: `Channel #${id.slice(-6)}` }
        ]}
      />

      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {conversation.contextType.toUpperCase()} CHANNEL
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            {conversation.contextType === 'organization'
              ? 'Org Admin ↔ SuperAdmin Enterprise Support Channel'
              : `Discussion Channel #${conversation._id.slice(-6)}`}
          </h1>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
        <TicketChat
          conversationId={id}
          messages={messages}
          onNewMessage={() => refetch()}
          contextType={conversation.contextType}
        />
      </Card>
    </div>
  );
};

export default ConversationDetail;
