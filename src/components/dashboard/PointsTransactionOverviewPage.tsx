import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import ExportButton from '../../components/ui/ExportButton';
import * as XLSX from 'xlsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../../utils/api';

const FILTERS = [
  { label: 'Yearly', value: 'year' },
  { label: 'Monthly', value: 'month' },
  { label: 'Daily', value: 'day' },
];

interface PointsStatsItem {
  month: string;
  points_issued?: number | string;
  points_redeemed?: number | string;
}

interface ChartDataItem {
  label: string;
  points_issued: number;
  points_redeemed: number;
}

const PointsTransactionOverviewPage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [filter, setFilter] = useState('month');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
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
          const { pointsStats } = res.data;

          let formattedData: ChartDataItem[] = [];
          if (filter === 'month') {
            // Use data as-is (monthly)
            formattedData = pointsStats.map((item: PointsStatsItem) => ({
              label: item.month,
              points_issued: Number(item.points_issued || 0),
              points_redeemed: Number(item.points_redeemed || 0),
            }));
          } else if (filter === 'year') {
            // Aggregate by year
            const yearMap: Record<string, { points_issued: number; points_redeemed: number }> = {};
            pointsStats.forEach((item: PointsStatsItem) => {
              const year = item.month.split('-')[0];
              if (!yearMap[year]) yearMap[year] = { points_issued: 0, points_redeemed: 0 };
              yearMap[year].points_issued += Number(item.points_issued || 0);
              yearMap[year].points_redeemed += Number(item.points_redeemed || 0);
            });
            formattedData = Object.entries(yearMap).map(([year, vals]) => ({
              label: year,
              ...vals,
            }));
          } else if (filter === 'day') {
            // If you have daily data, adjust here; else fallback to monthly
            formattedData = pointsStats.map((item: PointsStatsItem) => ({
              label: item.month, // Replace with item.day if available
              points_issued: Number(item.points_issued || 0),
              points_redeemed: Number(item.points_redeemed || 0),
            }));
          }

          // Pad with zero-value months before and after if less than 3 data points
          if (filter === 'month' && formattedData.length < 3 && formattedData.length > 0) {
            const first = formattedData[0];
            const [year, month] = first.label.split('-');
            const prevMonthDate = new Date(Number(year), Number(month) - 2);
            const nextMonthDate = new Date(Number(year), Number(month));
            const prevLabel = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const nextLabel = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
            formattedData.unshift({
              label: prevLabel,
              points_issued: 0,
              points_redeemed: 0,
            });
            formattedData.push({
              label: nextLabel,
              points_issued: 0,
              points_redeemed: 0,
            });
          }
          setChartData(formattedData || []);
          setError(null);
        } else {
          setError('Failed to fetch points transaction data');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching points transaction data:', err);
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
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 40, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tickCount={8} domain={[0, 'dataMax + 100']} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="points_issued"
                  stroke="#6366f1"
                  fillOpacity={0.25}
                  fill="#6366f1"
                  name="Points Issued"
                  dot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="points_redeemed"
                  stroke="#f59e42"
                  fillOpacity={0.25}
                  fill="#f59e42"
                  name="Points Redeemed"
                  dot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsTransactionOverviewPage;
