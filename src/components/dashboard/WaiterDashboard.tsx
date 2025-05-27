import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  expiry_date?: string;
  is_active: boolean;
}

const WaiterDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';
  const token = (currentUser as any)?.token;

  const [phone, setPhone] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState('');
  const [addPointsMsg, setAddPointsMsg] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

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
    setSearching(true);
    setSearchError(null);
    setFoundUser(null);
    setAddPointsMsg(null);
    // TODO: Replace with real API after backend
    try {
      const res = await fetch(`${API_URL}/users/lookup?phone=${encodeURIComponent(phone)}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setFoundUser(data.data);
      } else {
        setSearchError('User not found');
      }
    } catch (err) {
      setSearchError('User not found');
    }
    setSearching(false);
  };

  const handleAddPoints = async () => {
    if (!foundUser) return;
    setAddPointsMsg(null);
    const amount = Math.floor(Number(purchase) / 10000); // 1 point per Rp10,000
    if (amount <= 0) {
      setAddPointsMsg('Purchase too low for points.');
      return;
    }
    // TODO: Replace with real API after backend
    try {
      const res = await fetch(`${API_URL}/transactions/users/${foundUser.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ amount, description: `Purchase Rp${purchase}` }),
      });
      const data = await res.json();
      if (data.success) {
        setAddPointsMsg(`Points added! New balance: ${data.data.newPoints}`);
        setFoundUser({ ...foundUser, points: data.data.newPoints });
        setPurchase('');
      } else {
        setAddPointsMsg('Failed to add points.');
      }
    } catch (err) {
      setAddPointsMsg('Failed to add points.');
    }
  };

  if (userRole !== 'waiter') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: Customer Lookup & Add Points */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Waiter Dashboard</h1>
        <p className="mb-4 text-gray-600">Manage customer points and view active promotions.</p>
        <Card>
          <CardHeader>
            <CardTitle>Customer Lookup</CardTitle>
            <p className="text-gray-500 text-sm">Search for a customer by phone number.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} isLoading={searching}>Search</Button>
            </div>
            {searchError && <div className="text-red-600 mb-2">{searchError}</div>}
            {foundUser && (
              <div className="mb-4 p-3 rounded bg-gray-50 border">
                <div className="font-semibold">{foundUser.name}</div>
                <div className="text-sm text-gray-600">Phone: {foundUser.phone}</div>
                <div className="text-sm text-gray-600">Points: {foundUser.points}</div>
              </div>
            )}
            {foundUser && (
              <div className="space-y-2">
                <Input
                  label="Total Purchase (Rp)"
                  type="number"
                  placeholder="e.g. 50000"
                  value={purchase}
                  onChange={e => setPurchase(e.target.value)}
                />
                <Button onClick={handleAddPoints}>Add Points</Button>
                {addPointsMsg && <div className="text-green-600 mt-2">{addPointsMsg}</div>}
              </div>
            )}
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
                      {r.expiry_date && <span className="text-gray-500">Expires {r.expiry_date}</span>}
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Active</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaiterDashboard;
