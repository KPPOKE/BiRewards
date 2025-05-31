import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import * as XLSX from 'xlsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FILTERS = [
  { label: 'Yearly', value: 'year' },
  { label: 'Monthly', value: 'month' },
  { label: 'Daily', value: 'day' },
];

const PointsTransactionOverviewPage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [filter, setFilter] = useState('month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Make sure the API_URL doesn't already end with a slash
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    fetch(`${baseUrl}/users/owner/points_stats?granularity=${filter}`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setChartData(res.data || []);
          setError(null);
        } else {
          setError('Failed to fetch points transaction data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch points transaction data');
        setLoading(false);
      });
  }, [token, filter]);

  const handleExportExcel = () => {
    if (!chartData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(chartData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Points Transaction Overview');
    XLSX.writeFile(workbook, 'points_transaction_overview.xlsx');
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Points Transaction Overview</CardTitle>
          <div className="flex gap-2 items-center">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <button onClick={handleExportExcel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Export to Excel</button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="points_issued" stackId="1" stroke="#6366f1" fill="#6366f1" name="Points Issued" />
                <Area type="monotone" dataKey="points_redeemed" stackId="1" stroke="#f59e42" fill="#f59e42" name="Points Redeemed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsTransactionOverviewPage;
