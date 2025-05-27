import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  ticket: any;
  onClose: () => void;
}

const SupportTicketDetail: React.FC<Props> = ({ ticket, onClose }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    const res = await fetch(`http://localhost:3000/api/support-tickets/${ticket.id}`, {
      headers: { Authorization: `Bearer ${currentUser?.token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [ticket.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await fetch(`http://localhost:3000/api/support-tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser?.token}`,
      },
      body: JSON.stringify({ message: reply }),
    });
    setReply('');
    setSending(false);
    fetchMessages();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-2">{ticket.subject}</h2>
        <div className="mb-2 text-sm text-gray-500">Status: {ticket.status}</div>
        <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
          {loading ? (
            <div>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div>No messages yet.</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((msg: any) => (
                <li key={msg.id} className="bg-white p-2 rounded shadow text-sm">
                  <div className="font-semibold">{msg.user_id === currentUser?.id ? 'You' : 'Support'}</div>
                  <div>{msg.message}</div>
                  <div className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={handleReply} className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type your reply..."
            required
            disabled={sending}
          />
          <button className="btn btn-primary" type="submit" disabled={sending || !reply}>Send</button>
        </form>
      </div>
    </div>
  );
};

export default SupportTicketDetail; 