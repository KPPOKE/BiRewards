import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface TopUser {
  id: string;
  name: string;
  email: string;
  points: number;
  total_purchase: number;
}

function formatRupiah(amount: any): string {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return 'Rp0,00';
  return 'Rp' + num
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, '$&.')
    .replace('.', ',')
    .replace(/\.(?=\d{3})/g, '.')
    .replace(/,(\d{2})$/, ',$1');
}

const OwnerTopUsersPage: React.FC = () => {
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

  const handleExportExcel = () => {
    if (!topUsers.length) return;
    const data = topUsers.map((user: TopUser) => ({
      'Name': user.name,
      'Email': user.email,
      'Points': user.points,
      'Total Purchase': user.total_purchase,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Users');
    XLSX.writeFile(workbook, 'owner_top_users.xlsx');
  };

  if (loading) return <div className="p-6">Loading top users...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!topUsers.length) return <div className="p-6">No user data available.</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Users</CardTitle>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Export to Excel</button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-right">Points</th>
                  <th className="py-2 px-4 text-right">Total Purchase</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4 text-right">{user.points}</td>
                    <td className="py-2 px-4 text-right">{formatRupiah(user.total_purchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerTopUsersPage;
