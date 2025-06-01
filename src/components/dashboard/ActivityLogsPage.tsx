import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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
        console.log('Activity Logs API response:', res.data);
        if (res.success) {
          const filteredTransactions = res.data
            ? res.data.filter((transaction: any) => {
                const senderRoleCheck =
                  transaction.actor_role === 'waiter';
                const receiverCheck = transaction.target_name !== undefined;
                return senderRoleCheck && receiverCheck;
              })
            : [];
          setActivityLogs(filteredTransactions);
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

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  };

  if (loading) return <div className="p-6">Loading activity logs...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <Card className="shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <h1 className="section-title font-bold text-2xl mb-4 tracking-tight">Recent Waiter Activity Logs</h1>
          {activityLogs && activityLogs.length > 0 && (
            <Button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow-md ml-4"
            >
              Export to Excel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activityLogs && activityLogs.length > 0 ? (
            <ul className="activity-log-list divide-y divide-gray-100">
              {activityLogs.map((log, idx) => (
                <li key={idx} className="activity-log-item flex items-center py-4">
                  <span className="mr-3 text-2xl" title="Waiter">🧑‍🍳</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-semibold text-gray-800">{log.actor_name}</span> <span className="role-label text-gray-500">({log.actor_role})</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="font-semibold text-gray-700">{log.target_name}</span> <span className="text-sm text-gray-400">({log.target_role})</span>
                      <span className="ml-2 text-gray-600">{log.description}</span>
                      <span className="ml-2 text-green-600 font-bold">(+{log.points_added} pts)</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-8 text-lg">
              No waiter activity logs yet.<br />Actions performed by waiters will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
