import React, { useState } from 'react';
import { API_URL } from '../../utils/api';

import { useAuth } from '../../context/useAuth';
import { useLoyalty } from '../../context/LoyaltyContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Gift, Pencil, Trash, Plus, Calendar } from 'lucide-react';
import Input from '../ui/Input';

interface Reward {
  id: string;
  title: string;
  points_cost: number;
  is_active: boolean;
  redemptions: number;
  created_at: string;
}

const ManagerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { vouchers, isLoading: loading, refreshRewards } = useLoyalty();
  const rewards: Reward[] = vouchers.map(v => ({
    id: v.id,
    title: v.title,
    points_cost: v.pointsCost,
    is_active: v.isActive,
    redemptions: 0, // Placeholder, as this data is not in the context
    created_at: '', // Placeholder
  }));
  const token = currentUser?.token;
  const userRole = currentUser?.role;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editForm, setEditForm] = useState({ title: '', points_cost: 0, is_active: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', points_cost: 0, is_active: true });
  const [addLoading, setAddLoading] = useState(false);

  const handleEditClick = (reward: Reward) => {
    setEditingReward(reward);
    setEditForm({ title: reward.title, points_cost: reward.points_cost, is_active: reward.is_active });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingReward) return;
    try {
                  const res = await fetch(`${API_URL}/rewards/${editingReward.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        refreshRewards();
        setShowEditModal(false);
        setEditingReward(null);
      } else {
        alert('Failed to update reward.');
      }
    } catch {
      alert('Failed to update reward.');
    }
  };

  const handleDeleteReward = async (reward: Reward) => {
    const rewardId = reward.id;
    if (!window.confirm('Are you sure you want to delete this reward?')) return;
    try {
                  const res = await fetch(`${API_URL}/rewards/${rewardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
      });
      if (res.ok) {
        refreshRewards();
      } else {
        alert('Failed to delete reward.');
      }
    } catch {
      alert('Failed to delete reward.');
    }
  };

  const handleAddReward = async () => {
    setAddLoading(true);
    try {
      const res = await fetch(`${API_URL}/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        refreshRewards();
        setShowAddModal(false);
        setAddForm({ title: '', points_cost: 0, is_active: true });
      } else {
        alert('Failed to add reward.');
      }
    } catch {
      alert('Failed to add reward.');
    }
    setAddLoading(false);
  };

  if (userRole !== 'manager') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
      {/* Rewards Management Table (only table remains, all other dashboard cards/features removed) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rewards Management</CardTitle>
          <Button leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>Add New Reward</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-left">Reward Name</th>
                  <th className="py-2 px-4 text-right">Points Required</th>
                  <th className="py-2 px-4 text-center">Status</th>
                  <th className="py-2 px-4 text-right">Redemptions</th>
                  <th className="py-2 px-4 text-center">Created</th>
                  <th className="py-2 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rewards && rewards.length > 0 ? (
                  rewards.map(reward => (
                    <tr key={reward.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 flex items-center">
                        <Gift size={16} className="mr-2 text-purple-600" />
                        {reward.title}
                      </td>
                      <td className="py-2 px-4 text-right">{reward.points_cost}</td>
                      <td className="py-2 px-4 text-center">
                        {reward.is_active ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">Active</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Inactive</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">{reward.redemptions || 0}</td>
                      <td className="py-2 px-4 text-center">
                        <Calendar size={14} className="inline mr-1 text-gray-400" />
                        {reward.created_at ? new Date(reward.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2 px-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => handleEditClick(reward)}>Edit</Button>
                        <Button variant="danger" size="sm" leftIcon={<Trash size={14} />} onClick={() => handleDeleteReward(reward)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                      No rewards found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Reward Modal */}
      {showEditModal && editingReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Edit Reward</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Title"
                placeholder="Enter reward title"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                fullWidth
                required
              />
              <Input
                label="Points Cost"
                type="number"
                placeholder="Required points"
                value={editForm.points_cost.toString()}
                onChange={e => setEditForm({ ...editForm, points_cost: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    checked={editForm.is_active}
                    onChange={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  />
                  <span className="ml-2 text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Add New Reward</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Title"
                placeholder="Enter reward title"
                value={addForm.title}
                onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                fullWidth
                required
              />
              <Input
                label="Points Cost"
                type="number"
                placeholder="Required points"
                value={addForm.points_cost.toString()}
                onChange={e => setAddForm({ ...addForm, points_cost: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    checked={addForm.is_active}
                    onChange={() => setAddForm({ ...addForm, is_active: !addForm.is_active })}
                  />
                  <span className="ml-2 text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={addLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddReward}
                isLoading={addLoading}
              >
                Add Reward
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ManagerDashboard;
