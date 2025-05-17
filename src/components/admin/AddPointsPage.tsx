import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

const AddPointsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setMessage('Failed to fetch users.'));
  }, []);

  const handleSubmit = async () => {
    if (!selectedUserId || points <= 0) {
      setMessage('Please select a user and enter a valid point.');
      return;
    }

    const response = await fetch(`http://localhost:5000/users/${selectedUserId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    });

    if (response.ok) {
      setMessage('Points added successfully!');
      setPoints(0);
    } else {
      setMessage('Failed to add points.');
    }
  };

  if (users.length === 0) {
    return <p className="text-center">Loading users...</p>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Add Points to Customer</h2>
      {message && <p className="mb-4 text-sm text-red-500">{message}</p>}
      <select
        className="w-full p-2 border rounded mb-4"
        onChange={(e) => setSelectedUserId(Number(e.target.value))}
        value={selectedUserId ?? ''}
      >
        <option value="">Select a user</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Enter points to add"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        className="w-full p-2 border rounded mb-4"
        min={1}
      />
      <button
        onClick={handleSubmit}
        className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition"
      >
        Add Points
      </button>
    </div>
  );
};

export default AddPointsPage;