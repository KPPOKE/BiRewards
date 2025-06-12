import React, { useState } from 'react';
import { MessageCircle, AlertCircle, Lightbulb, HelpCircle, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface Category {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const categories: Category[] = [
  { 
    value: 'general', 
    label: 'General Inquiry', 
    icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
    description: 'Questions about your account, rewards, or general information'
  },
  { 
    value: 'complaint', 
    label: 'Report an Issue', 
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    description: 'Problems with the app, rewards, or point transactions'
  },
  { 
    value: 'suggestion', 
    label: 'Suggestion', 
    icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    description: 'Ideas for improving our services or new features'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: <HelpCircle className="h-5 w-5 text-gray-500" />,
    description: 'Any other inquiries not covered by the categories above'
  },
];

const CreateSupportTicketModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = category selection, 2 = form

  const selectedCategory = categories.find(cat => cat.value === category);

  const queryClient = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: (payload: {category: string; subject: string; message: string}) => 
      api.post('/support-tickets', payload),
    onSuccess: () => {
      // Refresh tickets list cache
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      onCreated();
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit ticket');
      }
    }
  });

  const loading = createTicketMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    createTicketMutation.mutate({ category, subject, message });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative animate-fadeIn">
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="mr-2 h-5 w-5 text-primary-600" />
            New Support Ticket
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Our support team will respond to your inquiry as soon as possible.
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">What can we help you with?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {categories.map((cat) => (
                  <div 
                    key={cat.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${category === cat.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                    onClick={() => setCategory(cat.value)}
                  >
                    <div className="flex items-center mb-2">
                      {cat.icon}
                      <h4 className="ml-2 font-medium text-gray-900">{cat.label}</h4>
                    </div>
                    <p className="text-sm text-gray-500">{cat.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-4">
                <div className="flex items-center mb-4">
                  {selectedCategory?.icon}
                  <h3 className="ml-2 text-lg font-medium text-gray-900">{selectedCategory?.label}</h3>
                </div>
                <button 
                  type="button" 
                  className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                  onClick={() => setStep(1)}
                >
                  Change category
                </button>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Brief summary of your inquiry"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please provide as much detail as possible"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSupportTicketModal; 