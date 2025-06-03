import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { Gift, Info, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RedeemRequest {
  id: number;
  status: string;
  requested_at: string;
  reward_name: string;
  reward_description?: string;
  points_cost: number;
  points_used: number;
}

const UserRedeemRequestsPage: React.FC = () => {
  // We don't need currentUser here, just using localStorage token directly
  const [redeemRequests, setRedeemRequests] = useState<RedeemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch redeem requests when component mounts
  useEffect(() => {
    const fetchRedeemRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3000/api/redeem-requests/my-requests', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch your redemption requests');
        }

        const data = await response.json();
        if (data.success) {
          setRedeemRequests(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch redemption requests');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRedeemRequests();
  }, []);

  const handleUseVoucher = async (requestId: number) => {
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/redeem-requests/${requestId}/use-voucher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to use voucher');
      }

      const data = await response.json();
      if (data.success) {
        // Update the status in the local state
        setRedeemRequests(requests => 
          requests.map(req => 
            req.id === requestId 
              ? { ...req, status: 'used' } 
              : req
          )
        );
        setSuccessMessage('Voucher successfully used!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to use voucher');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  // Helper function to get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  // Helper function to get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved - Claim Now';
      case 'rejected':
        return 'Rejected - Points Refunded';
      case 'pending':
      default:
        return 'Pending Approval';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redeem Requests</h1>
          <p className="text-gray-600 mt-1">Track the status of your reward redemptions</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mb-4">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start mb-4">
          <Info className="h-5 w-5 mr-2 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-600">Loading your redemption requests...</p>
        </div>
      ) : redeemRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No redemption requests yet</h3>
          <p className="mt-2 text-gray-600">
            You haven't made any redemption requests. Visit the Rewards page to redeem your points!
          </p>
          <Button 
            variant="primary"
            className="mt-4"
            onClick={() => window.location.hash = 'rewards'}
          >
            Browse Rewards
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {redeemRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-primary-500 mr-2" /> 
                    {request.reward_name}
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusClass(request.status)} flex items-center`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 hidden sm:inline">{getStatusText(request.status)}</span>
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Redemption Date</p>
                    <p className="font-medium">{formatDate(request.requested_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Points Used</p>
                    <p className="font-medium">{request.points_used} points</p>
                  </div>
                  
                  {request.reward_description && (
                    <div>
                      <p className="text-sm text-gray-500">Reward Description</p>
                      <p className="text-sm">{request.reward_description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                {request.status === 'approved' && (
                  <Button 
                    variant="primary" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleUseVoucher(request.id)}
                  >
                    Use Voucher
                  </Button>
                )}
                
                {request.status === 'rejected' && (
                  <div className="text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Points have been refunded to your account
                  </div>
                )}
                
                {request.status === 'pending' && (
                  <div className="text-sm text-amber-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Your request is being reviewed
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRedeemRequestsPage;
