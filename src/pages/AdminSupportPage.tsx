import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, AlertCircle, Lightbulb, HelpCircle, Clock, User, RefreshCw, Search, Filter, Send } from 'lucide-react';

// Utility function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function for API calls with retry logic
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 300) {
  try {
    console.log(`Attempting fetch to ${url}`);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const mergedOptions = {
      ...options,
      signal: controller.signal
    };
    
    const response = await fetch(url, mergedOptions);
    clearTimeout(timeoutId);
    
    // Log response status for debugging
    console.log(`Response status: ${response.status} for ${url}`);
    
    // Handle rate limiting
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, retrying after ${backoff}ms...`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    // Handle other error statuses
    if (!response.ok && retries > 0) {
      console.log(`Error status ${response.status}, retrying after ${backoff}ms...`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Network error, retrying after ${backoff}ms...`, error);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    console.error('Fetch failed after all retries:', error);
    throw error;
  }
}

// Flag to determine if we should use mock data as fallback
const USE_MOCK_FALLBACK = false; // Set to false to use real database data

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

  // Fetch tickets with throttling to prevent too many requests
  const fetchTickets = async () => {
    // Don't fetch if component is unmounted
    if (!isMountedRef.current) return;
    
    // Check if we've fetched tickets recently (within the last 1 second - reduced from 3 seconds)
    const now = Date.now();
    const timeSinceLastFetch = now - lastTicketFetchTimeRef.current;
    const MIN_FETCH_INTERVAL = 1000; // 1 second (reduced from 3 seconds to be more responsive)
    
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL && lastTicketFetchTimeRef.current > 0) {
      console.log(`Skipping ticket fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    // Update the last fetch time
    lastTicketFetchTimeRef.current = now;
    
    // Don't fetch if already loading
    if (loading) {
      console.log('Already loading tickets, skipping fetch');
      return;
    }
    
    // For debugging - log auth information
    console.log('Current user:', currentUser);
    console.log('Is authorized:', isAuthorized);
    console.log('Auth token:', currentUser?.token);
    
    console.log('Fetching tickets at', new Date().toISOString());
    setLoading(true);
    setError('');
    
    try {
      const endpoint = 'http://localhost:3000/api/support-tickets';
      
      // Add a cache-busting parameter to prevent browser caching
      const url = `${endpoint}?_=${Date.now()}`;
      console.log('Using URL:', url);
      
      // Use fetch directly with a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Log the headers being sent for debugging
      const headers = { 
        Authorization: `Bearer ${currentUser?.token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };
      console.log('Request headers:', headers);
      
      const res = await fetch(url, {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('Component unmounted during fetch, abandoning');
        return;
      }
      
      if (!res.ok) {
        let errorMessage = `API error: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          errorMessage = `API error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse response data
      const data = await res.json();
      
      // Log full data to debug
      console.log('Raw API response:', data);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Mark that we've loaded initial data
      initialDataLoadedRef.current = true;
      
      // Handle different response formats
      // Direct array format from PostgreSQL
      if (Array.isArray(data)) {
        console.log('Fetched tickets successfully (array format):', data.length, 'tickets');
        setTickets(data);
        setFilteredTickets(data);
      }
      // Wrapped object format with success property
      else if (data.success && data.tickets && Array.isArray(data.tickets)) {
        console.log('Fetched tickets successfully (wrapped format):', data.tickets.length, 'tickets');
        setTickets(data.tickets);
        setFilteredTickets(data.tickets);
      } 
      // Handle legacy format where data might be in a different property
      else if (data.data && Array.isArray(data.data)) {
        console.log('Fetched tickets successfully (legacy format):', data.data.length, 'tickets');
        setTickets(data.data);
        setFilteredTickets(data.data);
      }
      // Empty or invalid response
      else {
        // Set empty arrays if no tickets are returned
        console.warn('No tickets found or invalid format:', data);
        setTickets([]);
        setFilteredTickets([]);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load tickets: ${errorMessage}`);
      // Log error but don't use mock data anymore
      console.log('Error fetching tickets but not using mock data as fallback');
    } finally {
      // Always reset loading state to prevent UI from being stuck
      setLoading(false);
    }
  };

  // Track if the component is mounted to prevent state updates after unmounting
  const isMountedRef = React.useRef(true);
  
  // Track if initial data has been loaded
  const initialDataLoadedRef = React.useRef(false);

  // Track which tickets have had their messages fetched
  const fetchedMessagesRef = React.useRef<Record<string, boolean>>({});
  
  // Track the last time tickets were fetched to prevent too frequent requests
  const lastTicketFetchTimeRef = React.useRef<number>(0);
  
  // Initial data loading effect
  useEffect(() => {
    // Only fetch data if the component is mounted and authorized
    if (isMountedRef.current && isAuthorized) {
      console.log('Initial data loading effect triggered');
      // Give the component a moment to fully mount before fetching
      setTimeout(() => {
        fetchTickets();
      }, 500);
      
      // Safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        if (loading && isMountedRef.current) {
          console.log('Safety timeout triggered - resetting loading state');
          setLoading(false);
          setError('Request timed out. Please try refreshing.');
        }
      }, 15000); // 15 seconds timeout
      
      return () => {
        clearTimeout(safetyTimeout);
      };
    }
    
    return () => {
      // Mark component as unmounted when it's destroyed
      isMountedRef.current = false;
    };
  }, [isAuthorized, loading]); // Re-run if authorization or loading state changes
  
  // Controlled message fetching function that prevents infinite loops
  const fetchMessages = async (ticketId: string) => {
      if (messageLoading) {
        console.log('Already fetching messages, skipping duplicate call');
        return;
      }
      
      // Check if we should bypass API calls (for development/testing)
      if (USE_MOCK_FALLBACK) {
        console.log(`Mock data option enabled, but we're now using real database data`);
      }
      
      setMessageLoading(true);
      setError('');
      
      // Set a safety timeout to reset message loading state if it gets stuck
      const messageLoadingTimeout = setTimeout(() => {
        if (messageLoading && isMountedRef.current) {
          console.log('Message loading safety timeout triggered');
          setMessageLoading(false);
        }
      }, 10000); // 10 second timeout
      
      try {
        // Ensure ticket ID is properly formatted
        const safeTicketId = String(ticketId);
        console.log('Fetching messages for ticket:', safeTicketId);
        
        // Use the dedicated messages endpoint with proper URL
        const endpoint = 'http://localhost:3000/api/support-tickets';
        const url = `${endpoint}/${safeTicketId}/messages`;
        
        // Add cache-busting parameter to prevent browser caching
        const cacheBustedUrl = `${url}?_=${Date.now()}`;
        
        // Log the headers being sent for debugging
        const headers = {
          Authorization: `Bearer ${currentUser?.token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        };
        console.log('Message request headers:', headers);
        
        // Use direct fetch instead of fetchWithRetry to avoid potential rate limiting issues
        const res = await fetch(cacheBustedUrl, {
          headers,
          // Add a signal with a timeout to prevent hanging requests
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Message data received:', data);
        
        // Clear the safety timeout since we received a response
        clearTimeout(messageLoadingTimeout);
        
        // Check if data is an array directly (matching the PostgreSQL response)
        if (Array.isArray(data)) {
          // Process messages to ensure consistent is_staff formatting
          const processedMessages = data.map((msg: any) => ({
            ...msg,
            // Normalize is_staff to boolean regardless of what the API returns
            is_staff: Boolean(
              msg.is_staff === true || 
              Number(msg.is_staff) === 1 || 
              String(msg.is_staff) === '1' || 
              String(msg.is_staff) === 'true'
            )
          }));
          
          console.log('Processed messages:', processedMessages);
          setMessages(processedMessages);
        } 
        // Handle single message object
        else if (data && typeof data === 'object' && data.message) {
          // Handle case where API returns a single message object
          const singleMessage = {
            ...data,
            is_staff: Boolean(
              data.is_staff === true || 
              Number(data.is_staff) === 1 || 
              String(data.is_staff) === '1' || 
              String(data.is_staff) === 'true'
            )
          };
          setMessages([singleMessage]);
        }
        // Also handle wrapped response format
        else if (data && Array.isArray(data.messages)) {
          const processedMessages = data.messages.map((msg: any) => ({
            ...msg,
            is_staff: Boolean(
              msg.is_staff === true || 
              Number(msg.is_staff) === 1 || 
              String(msg.is_staff) === '1' || 
              String(msg.is_staff) === 'true'
            )
          }));
          
          console.log('Processed messages:', processedMessages);
          setMessages(processedMessages);
        } 
        // Handle data.data format (another possible format)
        else if (data && Array.isArray(data.data)) {
          const processedMessages = data.data.map((msg: any) => ({
            ...msg,
            is_staff: Boolean(
              msg.is_staff === true || 
              Number(msg.is_staff) === 1 || 
              String(msg.is_staff) === '1' || 
              String(msg.is_staff) === 'true'
            )
          }));
          
          console.log('Processed messages (data.data format):', processedMessages);
          setMessages(processedMessages);
        } else {
          console.error('Invalid message data format:', data);
          throw new Error('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages: ' + (err instanceof Error ? err.message : 'Unknown error'));
        // Log error but don't use mock data anymore
        console.log(`Failed to fetch messages for ticket ${ticketId}. Using real database only.`);
      } finally {
        // Always clear the timeout and reset loading state
        clearTimeout(messageLoadingTimeout);
        setMessageLoading(false);
      }
  };
  // Apply filtering based on search term and status filter
  useEffect(() => {
    if (tickets.length === 0) return;
    
    let filtered = [...tickets];
    
    // Apply search term filter if present
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ticket => 
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.user_name?.toLowerCase().includes(searchLower) ||
          ticket.user_email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter]);

  useEffect(() => {
    if (selectedTicket && !messageLoading && !fetchedMessagesRef.current[selectedTicket.id]) {
      console.log('Fetching messages for ticket (first time only):', selectedTicket.id);
      fetchedMessagesRef.current[selectedTicket.id] = true;
      fetchMessages(selectedTicket.id);
    } else if (selectedTicket) {
      console.log('Skipping message fetch for ticket (already fetched):', selectedTicket.id);
    }
  }, [selectedTicket, messageLoading]);

  const handleRefresh = async () => {
    if (!selectedTicket) return;
    
    setRefreshing(true);
    setError(''); // Clear any previous errors
    
    try {
      console.log('Manual refresh triggered by user');
      
      // Force reset any stuck loading states
      setLoading(false);
      setMessageLoading(false);
      
      // Small delay to ensure states are reset
      await delay(100);
      
      // Refresh messages for the selected ticket
      await fetchMessages(selectedTicket.id);
      
      // Also refresh the tickets list
      await fetchTickets();
      
      console.log('Refresh completed successfully');
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;

    setError('');
    try {
      const safeTicketId = String(selectedTicket.id);
      console.log('Updating status for ticket:', safeTicketId, 'to', newStatus);

      const endpoint = 'http://localhost:3000/api/support-tickets';
      const url = `${endpoint}/${safeTicketId}`;

      const res = await fetchWithRetry(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      }, 3, 500);

      if (!res.ok) {
        let errorMessage = `API error: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          errorMessage = `API error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Status updated successfully:', data);

      if (data.success && data.ticket) {
        const updatedTicket = data.ticket;
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(ticket => ticket.id === selectedTicket.id ? updatedTicket : ticket));
      } else {
        const updatedTicket = { ...selectedTicket, status: newStatus, updated_at: new Date().toISOString() };
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(ticket => ticket.id === selectedTicket.id ? updatedTicket : ticket));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update ticket status: ${errorMessage}`);

      if (USE_MOCK_FALLBACK) {
        console.log('Using mock implementation as fallback');
        const updatedTicket = { ...selectedTicket, status: newStatus, updated_at: new Date().toISOString() };
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(ticket => ticket.id === selectedTicket.id ? updatedTicket : ticket));
      }
    }
  };

  const handleSendReply = async (e: any) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;

    setSending(true);
    setError('');

    try {
      const safeTicketId = String(selectedTicket.id);

      const endpoint = 'http://localhost:3000/api/support-tickets';
      const url = `${endpoint}/${safeTicketId}/messages`;

      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({
          message: reply,
          is_staff: isAuthorized
        })
      }, 3, 500);

      if (!res.ok) {
        let errorMessage = `API error: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          errorMessage = `API error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Reply sent successfully:', data);

      if (data.success && data.message) {
        const newMessage = {
          ...data.message,
          created_at: data.message.created_at || new Date().toISOString(),
          user_name: data.message.user_name || currentUser?.name || 'Support Team'
        };
        setMessages(prev => [...prev, newMessage]);
      } else {
        await delay(500);
        await fetchMessages(selectedTicket.id);
      }

      setReply('');
    } catch (err) {
      console.error('Error sending reply:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to send reply: ${errorMessage}`);

      if (USE_MOCK_FALLBACK) {
        console.log('Using mock implementation as fallback');
        const newMessage: any = {
          id: `mock-${Date.now()}`,
          user_id: currentUser?.id || 'admin1',
          ticket_id: selectedTicket.id,
          message: reply,
          is_staff: true,
          created_at: new Date().toISOString(),
          user_name: currentUser?.name || 'Support Team'
        };
        setMessages(prev => [...prev, newMessage]);
        setReply('');
      }
    } finally {
      setSending(false);
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
      return date.toLocaleString();
    } catch (e) {
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
                      {/* Add debugging information */}
                      {messages.length > 0 ? (
                        messages.map(msg => {
                          // Log each message to debug
                          console.log('Rendering message:', msg);
                          
                          // Check if the message is from staff (admin/manager) or user
                          // Handle different possible formats of is_staff from the backend
                          // Log the raw is_staff value to debug
                          console.log(`Message ${msg.id} is_staff type:`, typeof msg.is_staff, 'value:', msg.is_staff);
                          
                          // Handle all possible formats: boolean true, number 1, string '1', string 'true'
                          const isStaff = Boolean(
                            msg.is_staff === true || 
                            Number(msg.is_staff) === 1 || 
                            String(msg.is_staff) === '1' || 
                            String(msg.is_staff) === 'true'
                          );
                          
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
                        })
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <p>No messages to display. Messages array length: {messages.length}</p>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-[200px] text-left">
                            {JSON.stringify(messages, null, 2)}
                          </pre>
                        </div>
                      )}
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
  );
};

export default AdminSupportPage;
