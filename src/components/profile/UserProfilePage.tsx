import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    const response = await fetch(`http://localhost:5000/users/${currentUser?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setCurrentUser(updatedUser); // perbarui context
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setMessage('Failed to update profile.');
    }
  };

  
  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-xl mx-auto mt-10 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      {isEditing ? (
        <>
          <input
            className="w-full mb-4 p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            className="w-full mb-4 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p><strong>Name:</strong> {currentUser.name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <button
  onClick={() => setIsEditing(true)}
  className="bg-primary-500 text-white px-4 py-2 rounded mt-4"
>
  Edit Profile
</button>
        </>
      )}
    </div>
  );
}
export default UserProfilePage;
