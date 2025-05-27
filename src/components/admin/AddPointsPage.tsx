import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddPointsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      // 1. Find user by email
      const userRes = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const userData = await userRes.json();
      if (!userData.success || !userData.data.length) {
        setError('User not found');
        setLoading(false);
        return;
      }
      const userId = userData.data[0].id;
      // 2. Add/remove points
      const pointsRes = await fetch(`/api/transactions/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: Number(amount), description: 'Manual adjustment' }),
      });
      const pointsData = await pointsRes.json();
      if (pointsData.success) {
        setMessage(`Points updated! New balance: ${pointsData.data.newPoints}`);
        setEmail('');
        setAmount('');
      } else {
        setError(pointsData.error?.message || 'Failed to update points');
      }
    } catch (err) {
      setError('Failed to update points');
    }
    setLoading(false);
  };

  if (userRole !== 'admin' && userRole !== 'manager') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add or Remove User Points</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-6">
        <Input
          label="User Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          fullWidth
        />
        <Input
          label="Amount (use negative to remove points)"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" isLoading={loading} fullWidth>
          Submit
        </Button>
        {message && <div className="text-green-600 font-semibold mt-2">{message}</div>}
        {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default AddPointsPage;