import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface OwnerStats {
  totalUsers: number;
  totalRedemptions: number;
  activityLogs: {
    id: string;
    user_id: string;
    user_name: string;
    role: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
  }[];
}

interface OwnerMetrics {
  userGrowth: { month: string; new_users: number }[];
  totalUsers: { month: string; total_users: number }[];
  pointsStats: { month: string; points_issued: number; points_redeemed: number }[];
  topUsers: { id: string; name: string; email: string; points: number; total_purchase: number }[];
}

const OwnerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';
  const token = (currentUser as any)?.token;

  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'owner' && userRole !== 'admin') return;
    setLoading(true);
    fetch(`${API_URL}/owner/stats`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
          setError(null);
        } else {
          setError('Failed to fetch stats');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch stats');
        setLoading(false);
      });
  }, [userRole, token]);

  useEffect(() => {
    if (userRole !== 'owner' && userRole !== 'admin') return;
    setMetricsLoading(true);
    fetch(`${API_URL}/owner/metrics`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
          setMetricsError(null);
        } else {
          setMetricsError('Failed to fetch metrics');
        }
        setMetricsLoading(false);
      })
      .catch(() => {
        setMetricsError('Failed to fetch metrics');
        setMetricsLoading(false);
      });
  }, [userRole, token]);

  if (userRole !== 'owner' && userRole !== 'admin') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  if (loading || metricsLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (error || metricsError) {
    return <div className="p-6 text-red-600">{error || metricsError}</div>;
  }

  // Prepare chart data
  const months = metrics?.totalUsers.map(u => u.month) || [];
  const userGrowthData = months.map(month => ({
    month,
    total_users: Number(metrics?.totalUsers.find(u => u.month === month)?.total_users || 0),
    new_users: Number(metrics?.userGrowth.find(u => u.month === month)?.new_users || 0),
  }));
  const pointsStatsData = months.map(month => ({
    month,
    points_issued: Number(metrics?.pointsStats.find(p => p.month === month)?.points_issued || 0),
    points_redeemed: Number(metrics?.pointsStats.find(p => p.month === month)?.points_redeemed || 0),
  }));

  // Summary values
  const totalUsers = stats?.totalUsers || 0;
  const totalRedemptions = stats?.totalRedemptions || 0;
  const pointsIssued = pointsStatsData.reduce((sum, d) => sum + d.points_issued, 0);
  const pointsRedeemed = pointsStatsData.reduce((sum, d) => sum + d.points_redeemed, 0);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={totalUsers} />
        <StatCard title="Total Redemptions" value={totalRedemptions} />
        <StatCard title="Points Issued" value={pointsIssued} />
        <StatCard title="Points Redeemed" value={pointsRedeemed} />
      </div>

      {/* User Growth Trends */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_users" stroke="#6366f1" name="Total Users" strokeWidth={2} />
              <Line type="monotone" dataKey="new_users" stroke="#10b981" name="New Users" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Points Transaction Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Points Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={pointsStatsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="points_issued" stackId="1" stroke="#6366f1" fill="#6366f1" name="Points Issued" />
              <Area type="monotone" dataKey="points_redeemed" stackId="1" stroke="#f59e42" fill="#f59e42" name="Points Redeemed" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
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
                {metrics?.topUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4 text-right">{user.points}</td>
                    <td className="py-2 px-4 text-right">{user.total_purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Admin & Cashier Activity Logs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Admin & Cashier Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.activityLogs.length ? (
            <ul className="divide-y divide-gray-200 bg-white rounded text-sm">
              {stats.activityLogs.map(log => (
                <li key={log.id} className="flex justify-between items-center px-4 py-2">
                  <div>
                    <span className="font-semibold">{log.user_name}</span> <span className="text-gray-500">({log.role})</span>
                    <span className="ml-2 text-gray-600">{log.description}</span>
                  </div>
                  <div className="text-gray-400">{new Date(log.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No recent activity logs.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <Card className="flex flex-col items-center justify-center p-4">
    <div className="text-2xl font-bold text-primary-700">{value}</div>
    <div className="text-gray-600 mt-1 text-sm">{title}</div>
  </Card>
);

export default OwnerDashboard;
