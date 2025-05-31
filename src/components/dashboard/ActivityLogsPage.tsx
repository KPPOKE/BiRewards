import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import * as XLSX from 'xlsx';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ActivityLogsPage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/activity-logs`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setActivityLogs(res.data || []);
          setError(null);
        } else {
          setError('Failed to fetch activity logs');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch activity logs');
        setLoading(false);
      });
  }, [token]);

  const handleExportExcel = () => {
    if (!activityLogs || !activityLogs.length) return;
    const data = activityLogs.map((log: any) => ({
      'Date/Time': new Date(log.created_at).toLocaleString(),
      'Actor Name': log.actor_name,
      'Actor Role': log.actor_role,
      'Target Name': log.target_name,
      'Target Role': log.target_role,
      'Action/Description': log.description,
      'Points Added': typeof log.points_added !== 'undefined' ? log.points_added : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');
    XLSX.writeFile(workbook, 'activity_logs.xlsx');
  };

  if (loading) return <div className="p-6">Loading activity logs...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Cashier & Waiter Activity Logs</CardTitle>
          {activityLogs && activityLogs.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Export to Excel
            </button>
          )}
        </CardHeader>
        <CardContent>
          {activityLogs && activityLogs.length ? (
            <ul className="divide-y divide-gray-200 text-sm">
              {activityLogs.map(log => (
                <li key={log.id} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold">{log.actor_name}</span> <span className="text-gray-500">({log.actor_role})</span>
                    <span className="mx-2">→</span>
                    <span className="font-semibold">{log.target_name}</span> <span className="text-gray-500">({log.target_role})</span>
                    <span className="ml-2 text-gray-600">{log.description}</span>
                    {typeof log.points_added !== 'undefined' && (
                      <span className="ml-2 text-blue-600 font-semibold">(+{log.points_added} pts)</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleString()}</div>
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

export default ActivityLogsPage;
