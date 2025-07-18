import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { API_URL } from '../../utils/api';

// This interface should match the one in WaiterDashboard.tsx
interface User {
  id: string;
  name: string;
  phone: string;
  points: number;
}

interface Reward {
  id: string;
  title: string;
  points_cost: number;
  description: string;
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  rewards: Reward[];
  onPointsAdded: (newPoints: number) => void; // Callback to update points in the parent component
}

const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ isOpen, onClose, user, rewards, onPointsAdded }) => {
  const [purchase, setPurchase] = useState('');
  const [addPointsMsg, setAddPointsMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  // Reset local state when the modal is closed or the user changes
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setPurchase('');
      setAddPointsMsg(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleAddPoints = async () => {
    setLoading(true);
    setError(null);
    setAddPointsMsg(null);

    const purchaseAmount = Number(purchase);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      setError('Please enter a valid purchase amount.');
      setLoading(false);
      return;
    }

    const amount = Math.floor(purchaseAmount / 10000); // 1 point per Rp10,000
    if (amount <= 0) {
      setError('Purchase amount is too low to earn points.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/add-points/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ 
          amount, 
          description: `Purchase Rp${purchaseAmount}`,
          purchaseAmount: purchaseAmount
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAddPointsMsg(`Successfully added ${amount} points. New balance: ${data.data.newPoints}`);
        onPointsAdded(data.data.newPoints); // Use callback to update parent state
        setPurchase('');
      } else {
        setError(data.message || 'Failed to add points.');
      }
    } catch (err) {
      setError('An error occurred while adding points.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile">
      <div className="space-y-4">
        <div>
          <p className="text-lg font-bold text-primary-700 dark:text-primary-400">{user.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Phone: {user.phone}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Points: <span className="font-semibold">{user.points}</span></p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Add Points from Purchase</h4>
          <div className="space-y-3">
            <Input
              label="Total Purchase (Rp)"
              type="number"
              placeholder="e.g. 50000"
              value={purchase}
              onChange={e => setPurchase(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleAddPoints} isLoading={loading} className="w-full">
              Add Points
            </Button>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            {addPointsMsg && <p className="text-sm text-green-600 text-center">{addPointsMsg}</p>}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Available Rewards</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {user && rewards.filter(r => user.points >= r.points_cost).length > 0 ? (
              rewards
                .filter(r => user.points >= r.points_cost)
                .map(reward => (
                  <div key={reward.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{reward.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reward.description}</p>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-2">{reward.points_cost} points</p>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Not enough points to redeem any rewards.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerProfileModal;
