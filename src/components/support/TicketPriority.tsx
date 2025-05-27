import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Calendar, Save } from 'lucide-react';

interface TicketPriorityProps {
  ticketId: string;
  initialPriority?: string;
  initialDueDate?: string;
  onUpdate?: () => void;
}

const TicketPriority: React.FC<TicketPriorityProps> = ({ 
  ticketId, 
  initialPriority = 'medium', 
  initialDueDate,
  onUpdate 
}) => {
  const { currentUser } = useAuth();
  const [priority, setPriority] = useState(initialPriority);
  const [dueDate, setDueDate] = useState(initialDueDate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthorized) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const res = await fetch(`http://localhost:3000/api/customers/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          priority,
          dueDate: dueDate || null
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      setSuccess(true);
      if (onUpdate) onUpdate();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating ticket priority:', err);
      setError(err.message || 'Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">Ticket Priority</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 p-2 rounded-md">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 p-2 rounded-md">
            <p className="text-green-500 text-sm">Priority updated successfully</p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
          <div className="flex space-x-2">
            {['low', 'medium', 'high'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-3 py-2 rounded-md text-sm font-medium border ${
                  priority === p 
                    ? `${getPriorityColor(p)} ring-2 ring-offset-2 ring-${p === 'high' ? 'red' : p === 'medium' ? 'yellow' : 'green'}-500` 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p === 'high' && <AlertTriangle className="inline-block h-4 w-4 mr-1" />}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline-block h-4 w-4 mr-1" />
            Due Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Set a due date to help prioritize this ticket
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Update Priority
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketPriority;
