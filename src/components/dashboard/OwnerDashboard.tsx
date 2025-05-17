import React from 'react';

const OwnerDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      <ul className="space-y-2">
        <li>Total Active Users</li>
        <li>Top Redeemed Rewards</li>
        <li>Total Redemptions</li>
        <li>Admin & Cashier Activity Logs</li>
      </ul>
    </div>
  );
};

export default OwnerDashboard;
