import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Plus, Send, X, AlertCircle, RefreshCw } from 'lucide-react';

// Flag to disable automatic API calls in development to prevent infinite loops
const DISABLE_AUTO_REFRESH = false;

interface Note {
  id: string;
  user_id: string;
  staff_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  staff_name: string;
}

interface CustomerNotesProps {
  userId: string;
  onNoteAdded?: () => void;
}

const CustomerNotes: React.FC<CustomerNotesProps> = ({ userId, onNoteAdded }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Ref to track initial load to prevent infinite loops
  const initialLoadDone = useRef(false);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  


  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`http://localhost:3000/api/customers/users/${userId}/notes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching customer notes:', err);
      
      setError(err.message || 'Failed to load customer notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      
      const res = await fetch(`http://localhost:3000/api/customers/users/${userId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          note: newNote.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNote('');
        setIsAddingNote(false);
        if (onNoteAdded) onNoteAdded();
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error adding customer note:', err);
      
      setError(err.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    if (userId && isAuthorized) {
      if (!DISABLE_AUTO_REFRESH) {
        fetchNotes();
      } else {
        // Only fetch on initial load
        if (!initialLoadDone.current) {
          fetchNotes();
          initialLoadDone.current = true;
        }
      }
    }
  }, [userId, isAuthorized]);

  if (!isAuthorized) {
    return null;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-md shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchNotes}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Customer Notes</h3>
        {!isAddingNote && (
          <button 
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Note
          </button>
        )}
      </div>
      
      <div className="p-4">
        {/* Add note form */}
        {isAddingNote && (
          <div className="mb-4 border border-gray-200 rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Add a new note</h4>
              <button 
                onClick={() => setIsAddingNote(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              rows={3}
              placeholder="Enter your note about this customer..."
            ></textarea>
            <div className="mt-2 flex justify-end">
              <button
                onClick={addNote}
                disabled={!newNote.trim() || submitting}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Notes list */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No notes have been added for this customer yet.</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-gray-50 rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-800">
                          {note.staff_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{note.staff_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(note.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{note.note}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerNotes;
