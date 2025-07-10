import React, { useEffect, useState } from 'react';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/useAuth';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { MessageCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  general: <MessageCircle className="h-5 w-5 text-blue-500" />,
  complaint: <AlertCircle className="h-5 w-5 text-red-500" />,
  suggestion: <HelpCircle className="h-5 w-5 text-yellow-500" />,
  other: <HelpCircle className="h-5 w-5 text-gray-500" />,
};

const UserSupportTicketsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/support-tickets?user_id=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTickets(data.data);
        } else {
          setError(data.message || 'Failed to load tickets');
        }
      } catch {
        setError('Network error. Please try again.');
      }
      setLoading(false);
    };
    fetchTickets();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">Submit and track your support requests</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No tickets yet</h3>
              <p className="text-gray-500 mt-1">Create a new support ticket to get help from our team.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Subject</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{categoryIcons[ticket.category] || <HelpCircle className="h-5 w-5 text-gray-400" />}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{ticket.subject}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSupportTicketsPage;
