import React from 'react';

const CashierDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cashier Dashboard</h1>
      <ul className="space-y-2">
        <li>Input Manual Transactions</li>
        <li>Redeem Points for Customers</li>
        <li>Search Customer by Email</li>
      </ul>
    </div>
  );
};

export default CashierDashboard;
