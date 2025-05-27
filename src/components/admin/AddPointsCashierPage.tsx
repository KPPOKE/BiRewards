import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddPointsCashierPage: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';

  const [phone, setPhone] = useState('');
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
      // 1. Find user by phone
      const userRes = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`);
      const userData = await userRes.json();
      if (!userData.success || !userData.data.length) {
        setError('User not found');
        setLoading(false);
        return;
      }
      const userId = userData.data[0].id;
      // 2. Add points
      const pointsRes = await fetch(`/api/transactions/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: Number(amount), description: 'Cashier/Waiter adjustment' }),
      });
      const pointsData = await pointsRes.json();
      if (pointsData.success) {
        setMessage(`Points updated! New balance: ${pointsData.data.newPoints}`);
        setPhone('');
        setAmount('');
      } else {
        setError(pointsData.error?.message || 'Failed to update points');
      }
    } catch (err) {
      setError('Failed to update points');
    }
    setLoading(false);
  };

  if (userRole !== 'cashier' && userRole !== 'waiter') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Points for Customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-6">
        <Input
          label="Customer Phone Number"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          fullWidth
        />
        <Input
          label="Amount"
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

export default AddPointsCashierPage; 