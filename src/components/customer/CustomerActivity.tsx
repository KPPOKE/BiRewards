import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../utils/api';
import { Clock, User, MessageCircle, Star, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Flag to disable automatic API calls in development to prevent infinite loops
const DISABLE_AUTO_REFRESH = false;

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown> & { rating?: number };
  created_at: string;
}

interface PaginationInfo {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface CustomerActivityProps {
  userId: string;
  refreshTrigger?: number;
}

const CustomerActivity: React.FC<CustomerActivityProps> = ({ userId, refreshTrigger = 0 }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    offset: 0,
    limit: 10,
    hasMore: false
  });
  
  // Ref to track initial load to prevent infinite loops
  const initialLoadDone = useRef(false);
  


  const fetchActivities = React.useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/customers/users/${userId}/activity?limit=10&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        if (offset === 0) {
          setActivities(data.activities);
        } else {
          setActivities(prev => [...prev, ...data.activities]);
        }
        
        setPagination(data.pagination);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: unknown) {
      let message = 'Failed to load customer activity';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error fetching customer activity:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      if (!DISABLE_AUTO_REFRESH) {
        fetchActivities(0);
      } else {
        // Only fetch on initial load or explicit refresh
        if (!initialLoadDone.current || refreshTrigger > 0) {
          fetchActivities(0);
          initialLoadDone.current = true;
        }
      }
    }
  }, [userId, refreshTrigger, fetchActivities]);

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchActivities(pagination.offset + pagination.limit);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'customer_reply':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'staff_reply':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'ticket_status_changed':
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case 'satisfaction_rating':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'note_added':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-md shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Activity</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => fetchActivities(0)}
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
        <h3 className="text-lg font-medium text-gray-900">Customer Activity Timeline</h3>
        <button 
          onClick={() => fetchActivities(0)} 
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="px-4 py-3 max-h-96 overflow-y-auto">
        {activities.length === 0 && !loading ? (
          <div className="text-center py-6 text-gray-500">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>No activity recorded for this customer yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
            
            {/* Activity items */}
            <ul className="space-y-4 relative">
              {activities.map((activity) => (
                <li key={activity.id} className="ml-6">
                  <div className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-10 mt-1.5 rounded-full bg-white p-1">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    
                    {/* Activity content */}
                    <div className="bg-gray-50 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                      
                      {/* Additional metadata could be shown here */}
                      {activity.activity_type === 'satisfaction_rating' && activity.metadata && (
                        <div className="mt-2 flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${activity.metadata && typeof activity.metadata.rating === 'number' && i < activity.metadata.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          {typeof activity.metadata.feedback === 'string' && activity.metadata.feedback && (
                            <span className="ml-2 text-xs text-gray-600 italic">
                              "{activity.metadata.feedback}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              
              {loading && (
                <li className="ml-6">
                  <div className="relative">
                    <div className="absolute -left-10 mt-1.5 rounded-full bg-white p-1">
                      <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {pagination.hasMore && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerActivity;
