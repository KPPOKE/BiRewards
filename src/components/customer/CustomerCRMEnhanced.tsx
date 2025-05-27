import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Tag, User, Clock, Star, AlertCircle, RefreshCw } from 'lucide-react';
import CustomerTags from './CustomerTags';
import CustomerNotes from './CustomerNotes';
import CustomerActivity from './CustomerActivity';
import TicketPriority from '../support/TicketPriority';
import SatisfactionRating from '../support/SatisfactionRating';

// Flag to disable automatic API calls in development to prevent infinite loops
const DISABLE_AUTO_REFRESH = false;

interface CustomerCRMEnhancedProps {
  userId: string;
  ticketId?: string;
  onClose?: () => void;
}

const CustomerCRMEnhanced: React.FC<CustomerCRMEnhancedProps> = ({ userId, ticketId, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'tags' | 'notes' | 'satisfaction'>('profile');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Ref to track initial load to prevent infinite loops
  const initialLoadDone = useRef(false);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  


  const fetchCustomerData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Attempt to fetch from API
      const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.user);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching customer data:', err);
      
      setError(err.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!DISABLE_AUTO_REFRESH) {
      fetchCustomerData();
    } else {
      // Only fetch on initial load
      if (!initialLoadDone.current) {
        fetchCustomerData();
        initialLoadDone.current = true;
      }
    }
  }, [userId]);

  const handleRefresh = () => {
    fetchCustomerData();
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-500">
          You don't have permission to view customer profiles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 flex justify-center items-center min-h-[300px]">
        <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="bg-red-50 p-6 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Profile</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-700 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer CRM</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="p-1 rounded-full hover:bg-primary-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-primary-600 transition-colors"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-5 w-5 mx-auto mb-1" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-5 w-5 mx-auto mb-1" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'tags'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="h-5 w-5 mx-auto mb-1" />
            Tags
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertCircle className="h-5 w-5 mx-auto mb-1" />
            Notes
          </button>
          {ticketId && (
            <button
              onClick={() => setActiveTab('satisfaction')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'satisfaction'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="h-5 w-5 mx-auto mb-1" />
              Satisfaction
            </button>
          )}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'profile' && customer && (
          <div>
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0">
                {customer.profile_image ? (
                  <img 
                    src={`http://localhost:3000/${customer.profile_image}`} 
                    alt={customer.name} 
                    className="h-20 w-20 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                    <User className="h-10 w-10 text-primary-700" />
                  </div>
                )}
              </div>
              <div className="ml-6 flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{customer.name}</h3>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {customer.phone}
                    </div>
                  )}
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since {formatDate(customer.created_at)}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex flex-col items-end">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-semibold text-primary-600">{customer.points} Points</span>
                </div>
                <div className="mt-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {customer.loyalty_tier || 'Bronze'} Tier
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {customer.transaction_count || '0'}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Support Tickets</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {customer.ticket_count || '0'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <CustomerActivity userId={userId} refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'tags' && (
          <CustomerTags userId={userId} onTagsChange={handleRefresh} />
        )}
        
        {activeTab === 'notes' && (
          <CustomerNotes userId={userId} onNoteAdded={handleRefresh} />
        )}
        
        {activeTab === 'satisfaction' && ticketId && (
          <div className="space-y-6">
            <TicketPriority 
              ticketId={ticketId}
              onUpdate={handleRefresh}
            />
            <SatisfactionRating 
              ticketId={ticketId}
              onRatingSubmitted={handleRefresh}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCRMEnhanced;
