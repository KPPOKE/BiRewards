import React from 'react';

const WaiterDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Waiter Dashboard</h1>
      <ul className="space-y-2">
        <li>Check Customer Membership</li>
        <li>Scan QR for Status (optional)</li>
      </ul>
    </div>
  );
};

export default WaiterDashboard;
