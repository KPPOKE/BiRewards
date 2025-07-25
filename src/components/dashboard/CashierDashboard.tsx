import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { UserRole } from '../../utils/roleAccess';
import { API_URL } from '../../utils/api';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CustomerProfileModal from './CustomerProfileModal';

interface User {
  id: string;
  name: string;
  phone: string;
  points: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  is_active: boolean;
}

const CashierDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';
  const token = localStorage.getItem('token');

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [searchBy, setSearchBy] = useState<'phone' | 'name'>('phone');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Mock rewards fetch (replace with real API after backend)
  React.useEffect(() => {
    setLoadingRewards(true);
    fetch(`${API_URL}/rewards`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRewards(data.data);
        setLoadingRewards(false);
      })
      .catch(() => setLoadingRewards(false));
  }, [token]);

  const handleSearch = async () => {
    if ((searchBy === 'phone' && !phone) || (searchBy === 'name' && !name)) {
      setSearchError(`Please enter a ${searchBy} to search`);
      return;
    }
    
    setSearching(true);
    setSearchError(null);
    setFoundUser(null);
    
    try {
      // Build the query string based on search type
      const queryParam = searchBy === 'phone' 
        ? `phone=${encodeURIComponent(phone)}` 
        : `name=${encodeURIComponent(name)}`;
      
      const res = await fetch(`${API_URL}/users/lookup?${queryParam}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        setFoundUser(data.data);
        setIsProfileModalOpen(true); // Open the modal on success
      } else {
        setSearchError('User not found');
      }
    } catch {
      setSearchError('User not found');
    }
    
    setSearching(false);
  };

  const handlePointsAdded = (newPoints: number) => {
    if (foundUser) {
      setFoundUser({ ...foundUser, points: newPoints });
    }
  };



  if (userRole !== 'cashier') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: Customer Lookup */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Cashier Dashboard</h1>
        <p className="mb-4 text-gray-600">Manage customer points and view active promotions.</p>
        <Card>
          <CardHeader>
            <CardTitle>Customer Lookup</CardTitle>
            <p className="text-gray-500 text-sm">Search for a customer by phone number or name.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <div className="flex mb-2">
                  <div className="mr-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        className="form-radio h-4 w-4 text-primary-500" 
                        checked={searchBy === 'phone'} 
                        onChange={() => setSearchBy('phone')}
                      />
                      <span className="ml-2 text-sm text-gray-700">Phone</span>
                    </label>
                  </div>
                  <div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        className="form-radio h-4 w-4 text-primary-500" 
                        checked={searchBy === 'name'} 
                        onChange={() => setSearchBy('name')}
                      />
                      <span className="ml-2 text-sm text-gray-700">Name</span>
                    </label>
                  </div>
                </div>
                
                {searchBy === 'phone' ? (
                  <Input
                    placeholder="Phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <Input
                    placeholder="Customer name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <Button onClick={handleSearch} isLoading={searching} className="self-end">Search</Button>
            </div>
            {searchError && <div className="text-red-600 mb-2">{searchError}</div>}
          </CardContent>
        </Card>
      </div>
      {/* Right: Active Promotions */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Active Promotions</CardTitle>
            <p className="text-gray-500 text-sm">Current rewards available for customers to redeem.</p>
          </CardHeader>
          <CardContent>
            {loadingRewards ? (
              <div>Loading rewards...</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {rewards.filter(r => r.is_active).map(r => (
                  <li key={r.id} className="py-3">
                    <div className="font-semibold text-primary-700">{r.title}</div>
                    <div className="text-gray-600 text-sm mb-1">{r.description}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-semibold">{r.points_cost} points</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Active</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <CustomerProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={foundUser}
        rewards={rewards}
        onPointsAdded={handlePointsAdded}
      />
    </div>
  );
};

export default CashierDashboard;
