import React, { useState } from 'react';
import { users as mockUsers } from '../../utils/mockData';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { User, Award, Pencil, Search, Plus, Calendar, X } from 'lucide-react';
import { User as UserType } from '../../types';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // New user state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    points: 0,
    role: 'user' as 'user' | 'admin',
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    // Simple validation
    if (!newUser.name || !newUser.email) {
      alert('Name and email are required');
      return;
    }

    // Check if email is already used
    if (users.some(user => user.email === newUser.email)) {
      alert('Email is already in use');
      return;
    }

    // Create new user with generated ID
    const newUserObj: UserType = {
      id: `${users.length + 1}`,
      ...newUser,
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, newUserObj]);
    setShowAddModal(false);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      points: 0,
      role: 'user',
    });
  };

  const handleEditUser = () => {
    if (!currentUser) return;
    
    // Simple validation
    if (!currentUser.name || !currentUser.email) {
      alert('Name and email are required');
      return;
    }

    // Update user
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? currentUser : user
    );

    setUsers(updatedUsers);
    setShowEditModal(false);
    setCurrentUser(null);
  };

  const handleEditClick = (user: UserType) => {
    setCurrentUser({...user});
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users in the loyalty program</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Users</CardTitle>
            <Input
              placeholder="Search users..."
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Role</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Points</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Member Since</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold mr-3">
                          {user.name.charAt(0)}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={user.role === 'admin' ? 'primary' : 'secondary'}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      <div className="flex items-center justify-end">
                        <Award size={16} className="mr-1 text-purple-600" />
                        {user.points}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Pencil size={14} />}
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <User size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm 
                  ? 'Try a different search term' 
                  : 'Add users to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter user's full name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                fullWidth
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter user's email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                fullWidth
                required
              />
              <Input
                label="Points"
                type="number"
                placeholder="Initial points"
                value={newUser.points.toString()}
                onChange={(e) => setNewUser({...newUser, points: parseInt(e.target.value) || 0})}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-purple-600"
                      checked={newUser.role === 'user'}
                      onChange={() => setNewUser({...newUser, role: 'user'})}
                    />
                    <span className="ml-2 text-gray-700">User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-purple-600"
                      checked={newUser.role === 'admin'}
                      onChange={() => setNewUser({...newUser, role: 'admin'})}
                    />
                    <span className="ml-2 text-gray-700">Admin</span>
                  </label>
                </div>
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
                onClick={handleAddUser}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter user's full name"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                fullWidth
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter user's email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                fullWidth
                required
              />
              <Input
                label="Points"
                type="number"
                placeholder="Points"
                value={currentUser.points.toString()}
                onChange={(e) => setCurrentUser({...currentUser, points: parseInt(e.target.value) || 0})}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-purple-600"
                      checked={currentUser.role === 'user'}
                      onChange={() => setCurrentUser({...currentUser, role: 'user'})}
                    />
                    <span className="ml-2 text-gray-700">User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-purple-600"
                      checked={currentUser.role === 'admin'}
                      onChange={() => setCurrentUser({...currentUser, role: 'admin'})}
                    />
                    <span className="ml-2 text-gray-700">Admin</span>
                  </label>
                </div>
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
                onClick={handleEditUser}
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

export default AdminUsersPage;