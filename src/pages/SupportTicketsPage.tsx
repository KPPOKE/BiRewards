import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateSupportTicketModal from '../components/support/CreateSupportTicketModal';
import SupportTicketDetail from '../components/support/SupportTicketDetail';

const SupportTicketsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:3000/api/support-tickets', {
      headers: { Authorization: `Bearer ${currentUser?.token}` },
    });
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          New Ticket
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : tickets.length === 0 ? (
        <div>No tickets found.</div>
      ) : (
        <ul className="divide-y">
          {tickets.map((ticket: any) => (
            <li key={ticket.id} className="py-3 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedTicket(ticket)}>
              <div className="flex justify-between">
                <span className="font-medium">{ticket.subject}</span>
                <span className="text-sm text-gray-500">{ticket.status}</span>
              </div>
              <div className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <CreateSupportTicketModal
          onClose={() => setShowModal(false)}
          onCreated={fetchTickets}
        />
      )}
      {selectedTicket && (
        <SupportTicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};

export default SupportTicketsPage; 