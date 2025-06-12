import React, { useState, useMemo } from 'react';
import CreateSupportTicketModal from '../components/support/CreateSupportTicketModal';
import SupportTicketDetail from '../components/support/SupportTicketDetail';
import { MessageCircle, AlertCircle, Lightbulb, HelpCircle, Filter, Plus, RefreshCw, Search } from 'lucide-react';
import api from '../utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const SupportTicketsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isPending, refetch } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['supportTickets'],
    queryFn: () => api.get('/support-tickets'),
  });

  const tickets: Ticket[] = useMemo(() => data?.tickets ?? [], [data]);

  // Local filters
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Memo-derived ticket list after filters applied
  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (searchTerm) {
      result = result.filter(ticket => ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [tickets, searchTerm, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
    let colorClass = '';
    const statusValue = status?.toLowerCase() || 'open';
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2 text-primary-600" />
              Support Center
            </h1>
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowModal(true)}
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              New Ticket
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Submit and track your support requests
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
            <div className="relative rounded-md shadow-sm max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search tickets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <div className="relative inline-block text-left">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 text-gray-500 mr-1" />
                  <select
                    className="focus:ring-primary-500 focus:border-primary-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
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
              <button
                type="button"
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`-ml-0.5 mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="bg-white overflow-hidden">
          {isPending ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-500">Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {tickets.length === 0 
                  ? 'Create a new support ticket to get help from our team.'
                  : 'Try changing your search or filter settings.'}
              </p>
              {tickets.length === 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    New Ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <li 
                    key={ticket.id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 space-x-3">
                        <div className="flex-shrink-0">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            Created on {formatDate(ticket.created_at)}
                          </p>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <CreateSupportTicketModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            setShowModal(false);
          }}
        />
      )}
      {selectedTicket && (
        <SupportTicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['supportTickets'] })}
        />
      )}
    </div>
  );
};

export default SupportTicketsPage; 