import React from 'react';

const ManagerDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Operational Manager Dashboard</h1>
      <ul className="space-y-2">
        <li>Customer Activity Overview</li>
        <li>Reward Performance Reports</li>
        <li>Transaction Summaries</li>
        <li>Export Reports</li>
      </ul>
    </div>
  );
};

export default ManagerDashboard;
