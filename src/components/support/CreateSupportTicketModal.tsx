import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'other', label: 'Other' },
];

const CreateSupportTicketModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('http://localhost:3000/api/support-tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser?.token}`,
      },
      body: JSON.stringify({ category, subject, message }),
    });
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      setError('Failed to submit ticket');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Support Center</h1>
        <div className="border-b mb-6 pb-2">
          <h2 className="text-lg font-semibold">Submit a Support Ticket</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="input input-bordered w-full"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              className="input input-bordered w-full"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn bg-yellow-700 text-white hover:bg-yellow-800" disabled={loading}>Submit</button>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupportTicketModal; 