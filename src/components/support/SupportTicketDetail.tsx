import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { MessageCircle, AlertCircle, X, Send, Clock, User, RefreshCw, Paperclip, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

interface Message {
  id: string;
  user_id: string;
  ticket_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_name?: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name?: string;
}

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: () => void;
}

const SupportTicketDetail: React.FC<Props> = ({ ticket, onClose, onUpdate }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  // Determine role headers
  const isStaffUser = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const getRoleHeaders = () => (isStaffUser ? { 'X-User-Role': 'admin' } : undefined);

  // React Query setup
  const queryClient = useQueryClient();

  type MessagesResponse = { messages: Message[] };

  const {
    data,
    isPending,
    isFetching,
    error: queryError,
    refetch
  } = useQuery<MessagesResponse, Error, MessagesResponse>({
    queryKey: ['ticketMessages', ticket.id],
    queryFn: async (): Promise<MessagesResponse> => (
      await api.get(`/support-tickets/${ticket.id}/messages`, { headers: getRoleHeaders() })
    ) as MessagesResponse,
    enabled: false, // manually triggered
    retry: 1
  });

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setMessagesLoaded(true);
    }
  }, [queryError]);

  // Normalize and store messages whenever data updates
  useEffect(() => {
    if (data && Array.isArray((data as MessagesResponse).messages)) {
      const normalized = (data as MessagesResponse).messages.map((msg: Message): Message => ({
        ...JSON.parse(JSON.stringify(msg)),
        is_staff: Boolean(msg.is_staff),
        created_at: msg.created_at ? new Date(msg.created_at).toISOString() : null,
        user_name: msg.user_name || 'Unknown User'
      }));
      setMessages(normalized);
      setError('');
    } else if (data) {
      setMessages([]);
    }
    if (data) setMessagesLoaded(true);
  }, [data]);

  const loading = isPending || isFetching;

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { message: string; is_staff: boolean }) =>
      api.post(`/support-tickets/${ticket.id}/messages`, payload, { headers: getRoleHeaders() }),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      if (onUpdate) onUpdate();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  });

  const sending = sendMessageMutation.isPending;

  // Fetch messages via React Query
  const fetchMessages = useCallback(async () => {
    setError('');
    setMessagesLoaded(false);
    try {
      await refetch();
    } finally {
      setMessagesLoaded(true);
    }
  }, [refetch]);

  // Automatically load messages when the detail modal is opened
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleReply = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setError('');
    sendMessageMutation.mutate({ message: reply, is_staff: isStaffUser });
  }, [reply, sending, sendMessageMutation, isStaffUser]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchMessages();
    // Ensure any cache is also invalidated for consistency
    await queryClient.invalidateQueries({ queryKey: ['ticketMessages', ticket.id] });
    setRefreshing(false);
  }, [queryClient, refreshing, ticket.id, fetchMessages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    let color = '';
    
    switch (status) {
      case 'open':
        color = 'bg-green-100 text-green-800';
        break;
      case 'in progress':
        color = 'bg-blue-100 text-blue-800';
        break;
      case 'closed':
        color = 'bg-gray-100 text-gray-800';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {status === 'in progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryIcon = (categoryValue: string) => {
    switch (categoryValue) {
      case 'general':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'complaint':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Initial load state */}
        {!loading && !messagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <button 
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-md"
              onClick={fetchMessages}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load Messages'}
            </button>
          </div>
        )}
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                {getCategoryIcon(ticket.category)}
                <h2 className="text-xl font-semibold text-gray-900 mr-3">{ticket.subject}</h2>
                {getStatusBadge(ticket.status)}
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatDate(ticket.created_at)}
                </span>
                <span className="flex items-center">
                  <User className="mr-1 h-4 w-4" />
                  Ticket #{String(ticket.id).substring(0, 8)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                disabled={refreshing}
                title="Refresh messages"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Message List */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-500">Loading messages...</span>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <div className="mt-2">
                    <button 
                      onClick={handleRefresh}
                      className="text-sm text-red-800 font-medium underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start the conversation by sending a message below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.user_id === currentUser?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${isCurrentUser ? 'bg-primary-100 text-primary-900' : msg.is_staff ? 'bg-blue-50' : 'bg-white'} rounded-lg shadow-sm p-4`}>
                      <div className="flex items-center mb-1">
                        <span className={`text-sm font-medium ${isCurrentUser ? 'text-primary-700' : msg.is_staff ? 'text-blue-700' : 'text-gray-700'}`}>
                          {isCurrentUser ? 'You' : msg.user_name || (msg.is_staff ? 'Support Team' : 'User')}
                        </span>
                        {msg.is_staff && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Shield className="mr-1 h-3 w-3" />
                            Staff
                          </span>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.message}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatDate(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Reply Form - Available to all users */}
        <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}
          
          <form onSubmit={handleReply} className="flex items-end gap-2">
            <div className="flex-grow relative">
              <textarea
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[80px]"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your message..."
                required
                disabled={sending}
                rows={3}
              />
              <button 
                type="button" 
                className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600"
                title="Attach file (coming soon)"
                disabled
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed h-10"
              type="submit" 
              disabled={sending || !reply.trim()}
            >
              {sending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="-ml-1 mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
