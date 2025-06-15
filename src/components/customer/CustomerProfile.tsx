import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { User, Phone, Mail, Calendar, Award, Clock, RefreshCw, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import CustomerActivity from './CustomerActivity';
import CustomerTags from './CustomerTags';
import CustomerNotes from './CustomerNotes';

interface CustomerProfileProps {
  userId: string;
  onClose?: () => void;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  points: number;
  loyalty_tier: string;
  created_at: string;
  profile_image?: string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ userId, onClose }) => {
  const { currentUser } = useAuth();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    activity: true,
    tags: true,
    notes: true
  });

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const fetchCustomerData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setCustomer(data.user);
    } catch (err: unknown) {
      let message = 'Failed to load customer data';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error('Error fetching customer data:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchCustomerData();
    }
  }, [userId, fetchCustomerData]);

  const handleRefresh = () => {
    fetchCustomerData();
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const toggleSection = (section: 'activity' | 'tags' | 'notes') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Not Found</h3>
        <p className="text-gray-500">
          The requested customer profile could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-700 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer Profile</h2>
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
      
      {/* Basic Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start">
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
                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {customer.phone}
                </div>
              )}
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                Member since {formatDate(customer.created_at)}
              </div>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-primary-600 mr-1" />
              <span className="text-lg font-semibold text-primary-600">{customer.points} Points</span>
            </div>
            <div className="mt-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {customer.loyalty_tier} Tier
            </div>
          </div>
        </div>
      </div>
      
      {/* CRM Sections */}
      <div className="divide-y divide-gray-200">
        {/* Activity Timeline Section */}
        <div>
          <div 
            className="px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('activity')}
          >
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
            </div>
            {expandedSections.activity ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          {expandedSections.activity && (
            <div className="px-6 py-4">
              <CustomerActivity userId={userId} refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
        
        {/* Tags Section */}
        <div>
          <div 
            className="px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('tags')}
          >
            <div className="flex items-center">
              <Tag className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Customer Tags</h3>
            </div>
            {expandedSections.tags ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          {expandedSections.tags && (
            <div className="px-6 py-4">
              <CustomerTags 
                userId={userId} 
                onTagsChange={() => setRefreshTrigger(prev => prev + 1)} 
              />
            </div>
          )}
        </div>
        
        {/* Notes Section */}
        <div>
          <div 
            className="px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('notes')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Customer Notes</h3>
            </div>
            {expandedSections.notes ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          {expandedSections.notes && (
            <div className="px-6 py-4">
              <CustomerNotes 
                userId={userId} 
                onNoteAdded={() => setRefreshTrigger(prev => prev + 1)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
