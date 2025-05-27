import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  type: string;
  amount: number;
  reward_title?: string;
  description: string;
  created_at: string;
}

const AdminTransactionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'manager') return;
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      search,
      type,
    });
    fetch(`/api/transactions/all?${params.toString()}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.data);
          setTotalPages(data.pagination.totalPages);
          setError(null);
        } else {
          setError('Failed to fetch transactions');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch transactions');
        setLoading(false);
      });
  }, [userRole, search, type, page]);

  if (userRole !== 'admin' && userRole !== 'manager') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Transactions</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Input
          placeholder="Search by user name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-64"
        />
        <select
          value={type}
          onChange={e => { setType(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="points_added">Points Added</option>
          <option value="reward_redeemed">Reward Redeemed</option>
        </select>
        <Button onClick={() => { setSearch(''); setType(''); setPage(1); }} variant="outline" size="sm">Clear</Button>
      </div>
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading transactions...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-500">No transactions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-3 text-left">User</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Role</th>
                <th className="py-2 px-3 text-left">Type</th>
                <th className="py-2 px-3 text-left">Amount</th>
                <th className="py-2 px-3 text-left">Reward</th>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">{tx.user_name}</td>
                  <td className="py-2 px-3">{tx.user_email}</td>
                  <td className="py-2 px-3">{tx.user_role}</td>
                  <td className="py-2 px-3">{tx.type}</td>
                  <td className="py-2 px-3">{tx.amount}</td>
                  <td className="py-2 px-3">{tx.reward_title || '-'}</td>
                  <td className="py-2 px-3">{tx.description}</td>
                  <td className="py-2 px-3">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)} size="sm">Prev</Button>
          <span className="px-2 py-1">Page {page} of {totalPages}</span>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)} size="sm">Next</Button>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage; 