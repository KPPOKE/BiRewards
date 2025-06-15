import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  MessageCircle, 
  AlertCircle, 
  Lightbulb, 
  HelpCircle, 
  Clock, 
  User, 
  RefreshCw, 
  Search, 
  Send,
  UserCircle
} from 'lucide-react'; // Removed unused: Filter, Tag, SatisfactionRating
import CustomerCRMEnhanced from '../components/customer/CustomerCRMEnhanced';
import TicketPriority from '../components/support/TicketPriority';

// Flag to determine if we should use mock data as fallback
const USE_MOCK_FALLBACK = true;

// Flag to disable automatic API calls in development to prevent infinite loops
const DISABLE_AUTO_REFRESH = true;



interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority?: string;
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
  is_staff: boolean | number | string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  
  // Ref to track initial load to prevent infinite loops
  const initialLoadDone = useRef(false);

  // Check if user is admin or manager
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Mock tickets data for development
  const mockTickets = React.useMemo<Ticket[]>(() => [
    {
      id: '1',
      subject: 'Points not showing up',
      category: 'complaint',
      status: 'open',
      priority: 'high',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      user_id: 'user1',
      user_name: 'Test User',
      user_email: 'testuser@example.com'
    },
    {
      id: '2',
      subject: 'How do I redeem rewards?',
      category: 'general',
      status: 'open',
      priority: 'medium',
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 172800000).toISOString(),
      user_id: 'user2',
      user_name: 'Karen',
      user_email: 'usertest@gmail.com'
    },
    {
      id: '3',
      subject: 'App crashes on login',
      category: 'complaint',
      status: 'in progress',
      priority: 'high',
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      user_id: 'user3',
      user_name: 'Alfian',
      user_email: 'alfian@gmail.com'
    }
  ], []);

  // Mock messages for development
  const mockMessages = React.useMemo<Record<string, Message[]>>(() => ({
    '1': [
      {
        id: '101',
        user_id: 'user1',
        ticket_id: '1',
        message: 'I completed a purchase yesterday but my points haven\'t been added to my account yet.',
        is_staff: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_name: 'Test User'
      }
    ],
    '2': [
      {
        id: '201',
        user_id: 'user2',
        ticket_id: '2',
        message: 'I\'m new to the app and I\'m not sure how to redeem my points for rewards. Can you help?',
        is_staff: false,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_name: 'Karen'
      }
    ],
    '3': [
      {
        id: '301',
        user_id: 'user3',
        ticket_id: '3',
        message: 'Every time I try to log in, the app crashes. I\'m using the latest version.',
        is_staff: false,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        user_name: 'Alfian'
      },
      {
        id: '302',
        user_id: 'admin1',
        ticket_id: '3',
        message: 'I\'m sorry to hear about the issue. Could you please tell me what device and OS version you\'re using?',
        is_staff: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_name: 'Admin User'
      },
      {
        id: '303',
        user_id: 'user3',
        ticket_id: '3',
        message: 'I\'m using an iPhone 12 with iOS 15.5.',
        is_staff: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_name: 'Alfian'
      }
    ]
  }), []);

  // Declare fetchTickets above its first use
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Attempt to fetch from API
      const res = await fetch('http://localhost:3000/api/support-tickets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Check if response is ok
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      } else {
        // If API fails and we're in development, use mock data
        if (USE_MOCK_FALLBACK) {
          console.log('Using mock ticket data');
          setTickets(mockTickets);
        } else {
          throw new Error(`API error: ${res.status}`);
        }
      }
    } catch (err: unknown) {
        let message = 'An error occurred';
        if (err instanceof Error) {
          message = err.message;
        }
      console.error('Error fetching tickets:', err);
      setError(message);
      // Use mock data as fallback in development
      if (USE_MOCK_FALLBACK) {
        console.log('Using mock ticket data after error');
        setTickets(mockTickets);
      }
    } finally {
      setLoading(false);
    }
  }, [mockTickets]);

  // Effect to fetch tickets on component mount
  useEffect(() => {
    if (!DISABLE_AUTO_REFRESH) {
      fetchTickets();
    } else {
      // Only fetch on initial load
      if (!initialLoadDone.current) {
        fetchTickets();
        initialLoadDone.current = true;
      }
    }
  }, [fetchTickets]);

  // Function to fetch messages for a ticket
  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      setMessageLoading(true);
      setError('');
      // Attempt to fetch from API
      const res = await fetch(`http://localhost:3000/api/support-tickets/${ticketId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Check if response is ok
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched messages:', data.messages);
        setMessages(data.messages);
      } else {
        // If API fails and we're in development, use mock data
        if (USE_MOCK_FALLBACK && mockMessages[ticketId]) {
          console.log('Using mock message data');
          setMessages(mockMessages[ticketId]);
        } else {
          throw new Error(`API error: ${res.status}`);
        }
      }
    } catch (err: unknown) {
        let message = 'An error occurred';
        if (err instanceof Error) {
          message = err.message;
        }
      console.error('Error fetching messages:', err);
      setError(message);
      // Use mock data as fallback in development
      if (USE_MOCK_FALLBACK && mockMessages[ticketId]) {
        console.log('Using mock message data after error');
        setMessages(mockMessages[ticketId]);
      }
    } finally {
      setMessageLoading(false);
    }
  }, [mockMessages]);

  // Effect to filter tickets when search term or status filter changes
  useEffect(() => {
    if (tickets.length > 0) {
      let filtered = [...tickets];
      
      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(ticket => 
          ticket.subject.toLowerCase().includes(term) || 
          ticket.user_name?.toLowerCase().includes(term) || 
          ticket.user_email?.toLowerCase().includes(term)
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(ticket => ticket.status === statusFilter);
      }
      
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets([]);
    }
  }, [tickets, searchTerm, statusFilter]);

  // Effect to fetch messages when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket, fetchMessages]);

  // Function to handle refresh button click
  const handleRefresh = () => {
    fetchTickets();
  };

  // Function to send a reply to a ticket
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket || !reply.trim() || !isAuthorized) {
      return;
    }
    
    try {
      setMessageLoading(true);
      setError('');
      
      const res = await fetch(`http://localhost:3000/api/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: reply,
          is_staff: true
        })
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Add the new message to the messages array
      setMessages(prev => [...prev, {
        ...data.message,
        user_name: currentUser?.name || 'Support Team'
      }]);
      
      // Clear the reply field
      setReply('');
      
      // Refresh the ticket to update its status
      fetchTickets();
      
    } catch (err: unknown) {
        let message = 'An error occurred';
        if (err instanceof Error) {
          message = err.message;
        }
      console.error('Error sending reply:', err);
      setError(message);
    } finally {
      setMessageLoading(false);
    }
  };

  // Function to change ticket status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || !isAuthorized) {
      return;
    }
    
    try {
      setError('');
      
      const res = await fetch(`http://localhost:3000/api/support-tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      // Update the selected ticket status locally
      setSelectedTicket(prev => prev ? {...prev, status: newStatus} : null);
      
      // Refresh the tickets list
      fetchTickets();
      
    } catch (err: unknown) {
        let message = 'An error occurred';
        if (err instanceof Error) {
          message = err.message;
        }
      console.error('Error changing ticket status:', err);
      setError(message);
    }
  };
  
  // Helper function to get category icon
  const getCategoryIcon = (category: string | null | undefined) => {
    switch (category) {
      case 'complaint':
        return <AlertCircle className="h-4 w-4" />;
      case 'question':
        return <HelpCircle className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Open
          </span>
        );
      case 'in progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format the date
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };


  // Render the component
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Support Ticket Management</h1>
          
          <div className="flex h-[calc(100vh-200px)] overflow-hidden bg-white rounded-lg shadow">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search and filter */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search tickets"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="ml-2 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    title="Refresh"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              
              {/* Ticket list */}
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
                        ? 'Try adjusting your search or filter criteria.'
                        : 'There are no support tickets to display.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredTickets.map(ticket => (
                      <li key={ticket.id}>
                        <button
                          className={`w-full text-left px-6 py-4 hover:bg-gray-50 focus:outline-none ${selectedTicket?.id === ticket.id ? 'bg-primary-50' : ''}`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              {getCategoryIcon(ticket.category)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                                {getStatusBadge(ticket.status)}
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <p className="truncate">{ticket.user_name || 'Unknown User'}</p>
                              </div>
                              <div className="mt-1 flex justify-between">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  <p>{formatDate(ticket.created_at)}</p>
                                </div>
                                {ticket.priority && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Main content */}
            <div className="w-2/3 flex flex-col">
              {selectedTicket ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h2>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          Opened by {selectedTicket.user_name || 'Unknown User'} • {formatDate(selectedTicket.created_at)}
                        </span>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="relative">
                        <select
                          className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                          value={selectedTicket.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          disabled={!isAuthorized}
                        >
                          <option value="open">Open</option>
                          <option value="in progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setShowPriorityModal(!showPriorityModal)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Set Priority"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Priority
                      </button>
                      <button
                        onClick={() => setShowCustomerProfile(!showCustomerProfile)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="View Customer Profile"
                      >
                        <UserCircle className="h-3 w-3 mr-1" />
                        Customer
                      </button>
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
                          
                          rows={3}
                        />
                      </div>
                      <button
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed h-10"
                        type="submit"
                        disabled={!reply.trim()}
                      >
                        <Send className="-ml-1 mr-2 h-4 w-4" />
                        Send
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
            
            {/* Customer Profile Sidebar */}
            {selectedTicket && showCustomerProfile && (
              <div className="w-1/3 border-l border-gray-200 overflow-auto">
                <CustomerCRMEnhanced 
                  userId={selectedTicket.user_id} 
                  ticketId={selectedTicket.id}
                  onClose={() => setShowCustomerProfile(false)}
                />
              </div>
            )}
          </div>
          
          {/* Priority Setting Modal */}
          {selectedTicket && showPriorityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Set Ticket Priority</h3>
                  <button 
                    onClick={() => setShowPriorityModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <TicketPriority 
                  ticketId={selectedTicket.id}
                  onUpdate={() => {
                    setShowPriorityModal(false);
                    fetchTickets();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

export default AdminSupportPage;
