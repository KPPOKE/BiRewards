import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../../utils/api';
import ExportButton from '../../components/ui/ExportButton';

const FILTERS = [
  { label: 'Yearly', value: 'year' },
  { label: 'Monthly', value: 'month' },
  { label: 'Daily', value: 'day' },
];

const UserGrowthTrendsPage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [filter, setFilter] = useState('month');
  interface ChartData {
  label: string;
  total_users: number;
  new_users: number;
}

const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    fetch(`${baseUrl}/users/owner/metrics`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const { userGrowth, totalUsers } = res.data;
          let formattedData: ChartData[] = [];
          if (filter === 'month' || filter === 'day') {
            // Use data as-is (monthly)
            const months = totalUsers.map((u: { label: string }) => u.label);
formattedData = months.map((month: string): ChartData => ({
  label: month,
  total_users: Number(totalUsers.find((u: { label: string; total_users: number }) => u.label === month)?.total_users || 0),
  new_users: Number(userGrowth.find((u: { label: string; new_users: number }) => u.label === month)?.new_users || 0),
}));
          } else if (filter === 'year') {
            // Aggregate by year
            const yearMap: Record<string, { total_users: number; new_users: number }> = {};
            totalUsers.forEach((u: { label: string; total_users: number }) => {
              const year = u.label.split('-')[0];
              if (!yearMap[year]) yearMap[year] = { total_users: 0, new_users: 0 };
              yearMap[year].total_users += Number(u.total_users || 0);
            });
            userGrowth.forEach((u: { month: string; new_users: number }) => {
              const year = u.month.split('-')[0];
              if (!yearMap[year]) yearMap[year] = { total_users: 0, new_users: 0 };
              yearMap[year].new_users += Number(u.new_users || 0);
            });
            formattedData = Object.entries(yearMap).map(([year, vals]: [string, { total_users: number; new_users: number }]) => ({
              label: year,
              ...vals,
            }));
          }
          setChartData(formattedData || []);
          setError(null);
        } else {
          setError('Failed to fetch user growth data');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching user growth data:', err);
        setError('Failed to fetch user growth data');
        setLoading(false);
      });
  }, [token, filter]);

  const handleExportExcel = () => {
    if (!chartData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(chartData.map(row => ({
  label: row.label,
  total_users: row.total_users,
  new_users: row.new_users,
})));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Growth Trends');
    XLSX.writeFile(workbook, 'user_growth_trends.xlsx');
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Growth Trends</CardTitle>
          <div className="flex gap-2 items-center">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <ExportButton onClick={handleExportExcel} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 40, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tickCount={8} domain={[0, 'dataMax + 1']} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="total_users"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Total Users"
                  fillOpacity={0.2}
                />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="New Users"
                  fillOpacity={0.2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserGrowthTrendsPage;
