import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import ExportButton from '../../components/ui/ExportButton';
import Pagination from '../ui/Pagination';
import WaiterActivityLogsFilters from './WaiterActivityLogsFilters';
import * as XLSX from 'xlsx';
import { API_URL } from '../../utils/api';

// Type definition for activity log items
interface ActivityLog {
  created_at: string;
  actor_name: string;
  actor_role: string;
  target_name?: string;
  target_role?: string;
  description: string;
  points_added?: number;
}

const PAGE_SIZE_OPTIONS = [10, 15, 20];
const ActivityLogsPage: React.FC = () => {
  const token = localStorage.getItem('token');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Filters
  const [filter, setFilter] = useState({
    waiter: '',
    startDate: '',
    endDate: '',
  });
  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'points'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/activity-logs`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const filteredTransactions = (res.data as ActivityLog[])
            ? (res.data as ActivityLog[]).filter((transaction: ActivityLog) => {
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

  // Get unique waiter names for filter dropdown
  const waiterOptions = useMemo(() => {
    const set = new Set<string>();
    activityLogs.forEach(log => {
      if (log.actor_name) set.add(log.actor_name);
    });
    return Array.from(set).sort();
  }, [activityLogs]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (filter.waiter && log.actor_name !== filter.waiter) return false;
      if (filter.startDate && new Date(log.created_at) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(log.created_at) > new Date(filter.endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [activityLogs, filter]);

  // Apply sorting
  const sortedLogs = useMemo(() => {
    const logs = [...filteredLogs];
    logs.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return sortOrder === 'asc'
          ? (a.points_added || 0) - (b.points_added || 0)
          : (b.points_added || 0) - (a.points_added || 0);
      }
    });
    return logs;
  }, [filteredLogs, sortBy, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  // Export only filtered logs
  const handleExportExcel = () => {
    if (!sortedLogs || !sortedLogs.length) return;
    const data = sortedLogs.map((log: ActivityLog) => ({
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

  // Reset page if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, pageSize]);

  if (loading) return <div className="p-6">Loading activity logs...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-2 md:p-6">
      <Card className="shadow-md rounded-lg">
        {/* Sticky top controls for mobile */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-100 pb-2 mb-2">
          <h1 className="section-title font-bold text-lg mb-1 tracking-tight px-2 pt-2">Recent Waiter Activity Logs</h1>
          <div className="flex flex-col gap-2 px-2">
            {/* Responsive flex wrap for all controls */}
            <div className="flex flex-wrap gap-x-2 gap-y-2 items-end w-full">
              <div className="flex-1 min-w-[140px]">
                <WaiterActivityLogsFilters
                  waiterOptions={waiterOptions}
                  filter={filter}
                  onFilterChange={setFilter}
                />
              </div>
              <div className="flex flex-row items-center gap-2 min-w-[120px]">
                <label className="text-xs font-semibold">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'date' | 'points')}
                  className="rounded border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="points">Points</option>
                </select>
                <button
                  className="px-2 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
                  onClick={() => setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'))}
                  title="Toggle sort order"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <div className="flex flex-row items-center gap-2 min-w-[120px]">
                <label className="text-xs font-semibold">Page size:</label>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="rounded border-gray-300 px-2 py-1 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              {sortedLogs.length > 0 && (
                <ExportButton onClick={handleExportExcel} className="min-w-[160px]" />
              )}
            </div>
          </div>
        </div>
        {/* Desktop controls */}
        <CardHeader className="hidden md:flex flex-row items-end justify-between w-full gap-6">
          {/* Left: Filters, sort, page size */}
          <div className="flex flex-row flex-wrap items-end gap-4">
            <h1 className="section-title font-bold text-2xl mb-0 tracking-tight">Recent Waiter Activity Logs</h1>
            <WaiterActivityLogsFilters
              waiterOptions={waiterOptions}
              filter={filter}
              onFilterChange={setFilter}
            />
            <div className="flex flex-row items-center gap-2">
              <label className="text-xs font-semibold">Sort by:</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'points')}
                className="rounded border-gray-300 px-2 py-1 text-sm"
              >
                <option value="date">Date</option>
                <option value="points">Points</option>
              </select>
              <button
                className="px-2 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
                onClick={() => setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'))}
                title="Toggle sort order"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <label className="text-xs font-semibold ml-2">Page size:</label>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="rounded border-gray-300 px-2 py-1 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Right: Export button with divider */}
          {sortedLogs.length > 0 && (
            <div className="flex flex-row items-center h-full pl-6">
              <ExportButton onClick={handleExportExcel} className="min-w-[160px]" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {paginatedLogs && paginatedLogs.length > 0 ? (
            <ul className="activity-log-list space-y-6">
  {paginatedLogs.map((log, idx) => (
    <li
      key={idx}
      className="activity-log-item grid md:grid-cols-3 md:gap-6 bg-white md:rounded-xl md:shadow md:border md:border-gray-100 flex flex-col md:flex-row md:items-stretch md:py-6 md:px-8 py-4 px-2 transition hover:shadow-lg"
    >
      {/* Column 1: Actor → Target */}
      <div className="flex items-center gap-3 md:gap-4 md:justify-start md:border-r md:border-gray-100 md:pr-6">
        <span className="text-3xl md:text-4xl" title="Waiter">🧑‍🍳</span>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-base md:text-lg leading-tight">{log.actor_name}</span>
          <span className="text-xs text-gray-400 font-medium">{log.actor_role}</span>
        </div>
        <span className="mx-2 text-gray-300 text-lg font-bold hidden md:inline">→</span>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-base md:text-lg leading-tight">{log.target_name}</span>
          <span className="text-xs text-gray-400 font-medium">{log.target_role}</span>
        </div>
      </div>
      {/* Column 2: Description */}
      <div className="flex items-center md:justify-start md:px-6 py-2 md:py-0">
        <span className="block text-gray-700 text-sm md:text-base font-medium leading-snug">{log.description}</span>
      </div>
      {/* Column 3: Points & Timestamp */}
      <div className="flex flex-col items-end justify-between md:pl-6 gap-2 md:gap-4">
        <span className="inline-block rounded-full bg-green-50 text-green-700 font-extrabold px-5 py-2 text-base md:text-lg border border-green-200 min-w-[90px] text-center shadow-sm">
          {typeof log.points_added === 'number' && log.points_added > 0 ? `+${log.points_added} pts` : `+0 pts`}
        </span>
        <span className="text-xs text-gray-400 font-semibold tracking-wide text-right mt-1 md:mt-0">{formatDate(log.created_at)}</span>
      </div>
    </li>
  ))}
</ul>
          ) : (
            <div className="text-center text-gray-400 py-8 text-lg">
              No waiter activity logs yet.<br />Actions performed by waiters will appear here.
            </div>
          )}
          <div className="flex flex-col md:flex-row md:justify-between items-center mt-6 gap-2">
            <div className="text-xs text-gray-500">
              Showing {paginatedLogs.length ? (pageSize * (currentPage - 1) + 1) : 0}
              {paginatedLogs.length ? `–${pageSize * (currentPage - 1) + paginatedLogs.length}` : ''} of {sortedLogs.length} logs
            </div>
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <div className="rounded-xl shadow-md border border-gray-200 bg-white px-4 py-3 flex justify-center items-center gap-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="!space-x-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
