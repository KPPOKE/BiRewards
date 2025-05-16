import React, { useState } from 'react';
import { vouchers as mockVouchers } from '../../utils/mockData';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Gift, Pencil, Search, Plus, Calendar, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Voucher } from '../../types';

const AdminRewardsPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);
  
  // New voucher state
  const [newVoucher, setNewVoucher] = useState({
    title: '',
    description: '',
    pointsCost: 100,
    expiryDays: 30,
    isActive: true,
  });

  // Filter vouchers based on search term
  const filteredVouchers = vouchers.filter(voucher => 
    voucher.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVoucher = () => {
    // Simple validation
    if (!newVoucher.title || !newVoucher.description) {
      alert('Title and description are required');
      return;
    }

    if (newVoucher.pointsCost <= 0) {
      alert('Points cost must be greater than 0');
      return;
    }

    if (newVoucher.expiryDays <= 0) {
      alert('Expiry days must be greater than 0');
      return;
    }

    // Create new voucher with generated ID
    const newVoucherObj: Voucher = {
      id: `${vouchers.length + 1}`,
      ...newVoucher,
    };

    setVouchers([...vouchers, newVoucherObj]);
    setShowAddModal(false);
    
    // Reset form
    setNewVoucher({
      title: '',
      description: '',
      pointsCost: 100,
      expiryDays: 30,
      isActive: true,
    });
  };

  const handleEditVoucher = () => {
    if (!currentVoucher) return;
    
    // Simple validation
    if (!currentVoucher.title || !currentVoucher.description) {
      alert('Title and description are required');
      return;
    }

    if (currentVoucher.pointsCost <= 0) {
      alert('Points cost must be greater than 0');
      return;
    }

    if (currentVoucher.expiryDays <= 0) {
      alert('Expiry days must be greater than 0');
      return;
    }

    // Update voucher
    const updatedVouchers = vouchers.map(voucher => 
      voucher.id === currentVoucher.id ? currentVoucher : voucher
    );

    setVouchers(updatedVouchers);
    setShowEditModal(false);
    setCurrentVoucher(null);
  };

  const handleEditClick = (voucher: Voucher) => {
    setCurrentVoucher({...voucher});
    setShowEditModal(true);
  };

  const toggleVoucherStatus = (id: string) => {
    const updatedVouchers = vouchers.map(voucher => 
      voucher.id === id 
        ? { ...voucher, isActive: !voucher.isActive } 
        : voucher
    );
    setVouchers(updatedVouchers);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards Management</h1>
          <p className="text-gray-600 mt-1">Manage all rewards and vouchers in the loyalty program</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Reward
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Rewards</CardTitle>
            <Input
              placeholder="Search rewards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Description</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Points Cost</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Expiry</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold mr-3">
                          <Gift size={16} />
                        </div>
                        {voucher.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {voucher.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-medium">
                      <Badge variant="primary">
                        {voucher.pointsCost} pts
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-600">
                      <div className="flex items-center justify-center">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {voucher.expiryDays} days
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        className="inline-flex items-center text-sm font-medium"
                        onClick={() => toggleVoucherStatus(voucher.id)}
                      >
                        {voucher.isActive ? (
                          <>
                            <ToggleRight size={20} className="mr-1 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={20} className="mr-1 text-gray-400" />
                            <span className="text-gray-500">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Pencil size={14} />}
                        onClick={() => handleEditClick(voucher)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVouchers.length === 0 && (
            <div className="text-center py-8">
              <Gift size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No rewards found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm 
                  ? 'Try a different search term' 
                  : 'Add rewards to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Title"
                placeholder="Enter reward title"
                value={newVoucher.title}
                onChange={(e) => setNewVoucher({...newVoucher, title: e.target.value})}
                fullWidth
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Enter reward description"
                  value={newVoucher.description}
                  onChange={(e) => setNewVoucher({...newVoucher, description: e.target.value})}
                  required
                />
              </div>
              <Input
                label="Points Cost"
                type="number"
                placeholder="Required points"
                value={newVoucher.pointsCost.toString()}
                onChange={(e) => setNewVoucher({...newVoucher, pointsCost: parseInt(e.target.value) || 0})}
                fullWidth
                required
              />
              <Input
                label="Expiry Days"
                type="number"
                placeholder="Days until expiry after redemption"
                value={newVoucher.expiryDays.toString()}
                onChange={(e) => setNewVoucher({...newVoucher, expiryDays: parseInt(e.target.value) || 0})}
                fullWidth
                required
              />
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    checked={newVoucher.isActive}
                    onChange={() => setNewVoucher({...newVoucher, isActive: !newVoucher.isActive})}
                  />
                  <span className="ml-2 text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVoucher}
                leftIcon={<Gift size={16} />}
              >
                Add Reward
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {showEditModal && currentVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Edit Reward</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Title"
                placeholder="Enter reward title"
                value={currentVoucher.title}
                onChange={(e) => setCurrentVoucher({...currentVoucher, title: e.target.value})}
                fullWidth
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Enter reward description"
                  value={currentVoucher.description}
                  onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})}
                  required
                />
              </div>
              <Input
                label="Points Cost"
                type="number"
                placeholder="Required points"
                value={currentVoucher.pointsCost.toString()}
                onChange={(e) => setCurrentVoucher({...currentVoucher, pointsCost: parseInt(e.target.value) || 0})}
                fullWidth
                required
              />
              <Input
                label="Expiry Days"
                type="number"
                placeholder="Days until expiry after redemption"
                value={currentVoucher.expiryDays.toString()}
                onChange={(e) => setCurrentVoucher({...currentVoucher, expiryDays: parseInt(e.target.value) || 0})}
                fullWidth
                required
              />
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    checked={currentVoucher.isActive}
                    onChange={() => setCurrentVoucher({...currentVoucher, isActive: !currentVoucher.isActive})}
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
                onClick={handleEditVoucher}
                leftIcon={<Gift size={16} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewardsPage;