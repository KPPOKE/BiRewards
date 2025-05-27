import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, AlertCircle, X, Send, Clock, User, RefreshCw, Paperclip, Shield } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  // Use a ref to track ongoing requests and prevent duplicates
  const requestInProgressRef = useRef(false);
  
  // Check if user is admin or manager
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  
  // For API access purposes, treat manager exactly like admin
  const effectiveRole = isAuthorized ? 'admin' : 'user';

  // Improved fetch messages function with request deduplication
  const fetchMessages = useCallback(async () => {
    // Prevent concurrent requests for the same data
    if (requestInProgressRef.current || loading) {
      console.log('Request already in progress, skipping duplicate call');
      return;
    }
    
    requestInProgressRef.current = true;
    setLoading(true);
    setError('');
    
    try {
      const ticketId = String(ticket.id);
      const endpoint = 'http://localhost:3000/api/support-tickets';
      // Use dedicated messages endpoint 
      const url = `${endpoint}/${ticketId}/messages`;
      
      console.log('Fetching messages once for ticket:', ticketId);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`,
          'X-User-Role': effectiveRole,
          'Content-Type': 'application/json',
          // Prevent browser caching with unique timestamp
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      
      console.log('Messages received from API:', data);
      
      // Check if component is still mounted before updating state
      if (Array.isArray(data.messages)) {
        // Deep clone and normalize the data to prevent reference equality issues
        const normalized = data.messages.map((msg: any) => ({
          ...JSON.parse(JSON.stringify(msg)),
          // Always convert is_staff to boolean to ensure consistent type
          is_staff: Boolean(msg.is_staff),
          // Ensure created_at is consistent
          created_at: msg.created_at ? new Date(msg.created_at).toISOString() : null,
          // Ensure user_name exists
          user_name: msg.user_name || 'Unknown User'
        }));
        
        setMessages(normalized);
        setMessagesLoaded(true);
        console.log('Messages normalized and set:', normalized.length);
      } else {
        setMessages([]);
        setMessagesLoaded(true);
        console.log('No messages found or invalid data format');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Could not load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
      requestInProgressRef.current = false;
    }
  }, [currentUser?.token, effectiveRole, loading, ticket.id]);

  // No useEffect for automatic fetching - this completely eliminates the infinite loop problem

  // Improved reply handler with better error handling and response processing
  const handleReply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    
    setSending(true);
    setError('');
    
    try {
      const ticketId = String(ticket.id);
      const isStaffUser = currentUser?.role === 'admin' || currentUser?.role === 'manager';
      const endpoint = 'http://localhost:3000/api/support-tickets';
      const url = `${endpoint}/${ticketId}/messages`;
      
      console.log('Sending reply to ticket:', ticketId);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
          'X-User-Role': effectiveRole,
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          message: reply,
          is_staff: isStaffUser
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      // Clear the reply input immediately to give user feedback
      setReply('');
      
      // Add a small delay before fetching updated messages to ensure backend has processed
      setTimeout(async () => {
        await fetchMessages();
        // Notify parent component of the update
        if (onUpdate) onUpdate();
      }, 300);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [currentUser?.token, effectiveRole, fetchMessages, onUpdate, reply, sending, ticket.id]);

  // Improved refresh handler with error handling
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // Clear messages first to avoid stale data
      setMessages([]);
      await fetchMessages();
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh messages. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchMessages, refreshing]);

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
