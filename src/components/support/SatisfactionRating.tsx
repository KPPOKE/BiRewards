import React, { useState } from 'react';
import { API_URL } from '../../utils/api';
import { Star, Send } from 'lucide-react';

interface SatisfactionRatingProps {
  ticketId: string;
  initialRating?: number;
  initialFeedback?: string;
  onRatingSubmitted?: () => void;
}

const SatisfactionRating: React.FC<SatisfactionRatingProps> = ({ 
  ticketId, 
  initialRating, 
  initialFeedback = '',
  onRatingSubmitted 
}) => {
  const [rating, setRating] = useState<number | null>(initialRating || null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(!!initialRating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === null) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/customers/tickets/${ticketId}/satisfaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      setSuccess(true);
      setSubmitted(true);
      if (onRatingSubmitted) onRatingSubmitted();
    } catch (err: unknown) {
      let message = 'Failed to submit satisfaction rating';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error submitting satisfaction rating:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && !initialRating) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-8 w-8 ${i < (rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you for your feedback!</h3>
          <p className="text-sm text-gray-500">
            Your rating helps us improve our support service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">Rate Your Support Experience</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 p-2 rounded-md">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 p-2 rounded-md">
            <p className="text-green-500 text-sm">Thank you for your feedback!</p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your experience?</label>
          <div className="flex justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                onClick={() => setRating(value)}
                className="p-1 focus:outline-none transition-colors"
              >
                <Star 
                  className={`h-8 w-8 ${
                    (hoveredRating !== null ? value <= hoveredRating : value <= (rating || 0))
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>
          <div className="text-center mt-1">
            <span className="text-sm text-gray-500">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
              {rating === null && 'Select a rating'}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Feedback (Optional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            rows={3}
            placeholder="Tell us more about your experience..."
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || rating === null}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
              <>
                <Send className="h-4 w-4 mr-1" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SatisfactionRating;
