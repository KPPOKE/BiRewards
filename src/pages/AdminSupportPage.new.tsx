import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { MessageCircle, AlertCircle, Lightbulb, HelpCircle, Clock, User, RefreshCw, Search, Filter, Send } from 'lucide-react';

// No mock data fallback - using only database

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

interface Message {
  id: string;
  user_id: string;
  ticket_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_name?: string;
}

const AdminSupportPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Check if user is admin or manager
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // No mock data - using only database

  // No mock messages - using only database

  // Add delay function to prevent rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Define base API URL to avoid typos
  const API_BASE_URL = 'http://localhost:3000/api';

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Add a small delay to prevent rate limiting
      await delay(300);
      
      const res = await fetch(`${API_BASE_URL}/support-tickets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || currentUser?.token || ''}` },
        // Add cache control to prevent duplicate requests
        cache: 'no-cache'
      });
      
      if (!res.ok) {
        // Stop retrying if unauthorized or rate limited
        if (res.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          setLoading(false);
          return;
        }
        if (res.status === 429) {
          setError('Too many requests. Please wait and try again.');
          setLoading(false);
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      setTickets(data.tickets || []);
      setFilteredTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again later.');
      // No fallback to mock data - show error to user
      console.error('Database connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setMessageLoading(true);
    setError('');
    try {
      // Add a small delay to prevent rate limiting
      await delay(300);
      
      const token = localStorage.getItem('token') || currentUser?.token || '';
      const res = await fetch(`${API_BASE_URL}/support-tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
        // Add cache control to prevent duplicate requests
        cache: 'no-cache'
      });
      
      if (!res.ok) {
        // Stop retrying if unauthorized or rate limited
        if (res.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          setLoading(false);
          return;
        }
        if (res.status === 429) {
          setError('Too many requests. Please wait and try again.');
          setLoading(false);
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
      // No fallback to mock data - show error to user
      console.error('Database connection error:', err);
    } finally {
      setMessageLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthorized) {
      fetchTickets();
    }
  }, [isAuthorized, fetchTickets]);

  useEffect(() => {
    // Apply filters whenever tickets, searchTerm, or statusFilter changes
    let result = [...tickets];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    setFilteredTickets(result);
  }, [tickets, searchTerm, statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket, fetchMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(''); // Clear any previous errors
    
    try {
      await fetchTickets();
      if (selectedTicket) {
        // Add a small delay between requests to prevent rate limiting
        await delay(300);
        await fetchMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    
    setSending(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || currentUser?.token || '';
      const res = await fetch(`${API_BASE_URL}/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: reply,
          is_staff: true,
          user_id: currentUser?.id,
          user_name: currentUser?.name
        }),
      });
      
      if (!res.ok) {
        // Stop retrying if unauthorized or rate limited
        if (res.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          setLoading(false);
          return;
        }
        if (res.status === 429) {
          setError('Too many requests. Please wait and try again.');
          setLoading(false);
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      
      // Clear the reply field
      setReply('');
      
      // Refresh messages to show the new reply
      await fetchMessages(selectedTicket.id);
      
      // Update ticket status to 'in progress' if it's 'open'
      if (selectedTicket.status === 'open') {
        await handleStatusChange('in progress');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again later.');
      
      // No fallback to mock data - show error to user
      console.error('Database connection error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    
    setError('');
    try {
      // Show loading state
      const loadingTicket = { ...selectedTicket, status: 'updating...' };
      setSelectedTicket(loadingTicket);
      
      // Add a small delay to prevent rate limiting
      await delay(300);
      
      // Now that we've fixed the backend API, let's use it properly
      console.log('Updating ticket status to:', newStatus);
      
      // Make the API call to update the ticket status
      const token = localStorage.getItem('token') || currentUser?.token || '';
      const res = await fetch(`${API_BASE_URL}/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
        cache: 'no-cache'
      });
      
      if (!res.ok) {
        // Stop retrying if unauthorized or rate limited
        if (res.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          setLoading(false);
          return;
        }
        if (res.status === 429) {
          setError('Too many requests. Please wait and try again.');
          setLoading(false);
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      
      // Get the updated ticket data from the response
      const updatedData = await res.json();
      console.log('API response:', updatedData);
      
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedData : ticket
        )
      );
      setFilteredTickets(prev => 
        prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedData : ticket
        )
      );
      
      // Clear any previous errors
      setError('');
      console.log('Successfully updated ticket status to:', newStatus);
      
      // Force a refresh of tickets after a short delay
      setTimeout(() => {
        fetchTickets();
      }, 1000);
      
    } catch (err) {
      console.error('Error updating status:', err);
      
      // Revert the ticket status in UI
      if (selectedTicket) {
        setSelectedTicket({...selectedTicket});
      }
      
      // Set error message
      setError('Failed to update ticket status. Please try again later.');
      console.error('Database connection error:', err);
    }
  };

  const getCategoryIcon = (category: string | null | undefined) => {
    const categoryValue = category?.toLowerCase() || 'other';
    switch (categoryValue) {
      case 'general':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'complaint':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const statusValue = status?.toLowerCase() || 'open';
    let colorClass = '';
    
    switch (statusValue) {
      case 'open':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'in progress':
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case 'resolved':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      case 'closed':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch {

      return dateString;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col md:flex-row h-[calc(100vh-200px)]">
          {/* Tickets list */}
          <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Support Tickets</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleRefresh}
                    className="p-1 rounded-full hover:bg-gray-100"
                    title="Refresh tickets"
                  >
                    <RefreshCw className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search tickets"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'There are no support tickets to display'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredTickets.map(ticket => (
                    <li 
                      key={ticket.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-primary-50' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(ticket.category)}
                            <p className="text-sm font-medium text-gray-900 ml-2 truncate">
                              {ticket.subject}
                            </p>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {ticket.user_name || 'Unknown User'}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>
                              {formatDate(ticket.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Conversation view */}
          <div className="w-full md:w-2/3 flex flex-col">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h2>
                    <div className="mt-1 flex items-center">
                      <p className="text-sm text-gray-500 mr-4">
                        From: {selectedTicket.user_name || 'Unknown User'} ({selectedTicket.user_email || 'No email'})
                      </p>
                      <p className="text-sm text-gray-500">
                        Opened: {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                  {messageLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Start the conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map(msg => {
                        const isStaff = msg.is_staff;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${isStaff ? 'bg-primary-100 text-primary-900' : 'bg-white'} rounded-lg shadow-sm p-4`}>
                              <div className="flex items-center mb-1">
                                <span className={`text-sm font-medium ${isStaff ? 'text-primary-700' : 'text-gray-700'}`}>
                                  {isStaff ? (msg.user_name || 'Support Team') : (msg.user_name || 'User')}
                                </span>
                                {isStaff && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
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
                
                {/* Reply form */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  {error && (
                    <div className="mb-3 text-sm text-red-600">{error}</div>
                  )}
                  <form onSubmit={handleSendReply} className="flex items-end gap-2">
                    <div className="flex-grow relative">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[80px]"
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        placeholder="Type your reply..."
                        required
                        disabled={sending}
                        rows={3}
                      />
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
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gray-50">
                <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a ticket</h3>
                <p className="text-sm text-gray-500 text-center max-w-md mt-2">
                  Choose a support ticket from the list on the left to view the conversation and respond to the customer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

}

export default AdminSupportPage;
