import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { API_URL } from '../../utils/api';

interface TopUser {
  id: string;
  name: string;
  email: string;
  points: number;
  total_purchase: number;
}

function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return 'Rp0,00';
  return 'Rp' + num
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, '$&.')
    .replace('.', ',')
    .replace(/\.(?=\d{3})/g, '.')
    .replace(/,(\d{2})$/, ',$1');
}

const TopUsersPerformancePage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/users/owner/metrics`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setTopUsers(res.data.topUsers || []);
          setError(null);
        } else {
          setError('Failed to fetch top users data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch top users data');
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="p-6">Loading top users...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  if (!topUsers.length) return <div className="p-6">No user data available.</div>;
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Users Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {topUsers.map(user => (
              <Card key={user.id} hoverEffect className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-primary-700">{user.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Points:</span>
                      <span className="ml-2 font-semibold" style={{ color: '#FFD700' }}>{user.points}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Purchase:</span>
                      <span className="ml-2 font-semibold">{formatRupiah(user.total_purchase)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUsersPerformancePage;
