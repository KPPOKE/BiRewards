export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'owner' | 'manager' | 'cashier' | 'waiter';
  points: number;
  createdAt: string;
  token?: string;
}

export type Voucher = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  expiryDays: number;
  isActive: boolean;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'purchase' | 'earning' | 'redemption' | 'points_added' | 'reward_redeemed';
  amount: number;
  pointsEarned?: number;
  pointsSpent?: number;
  voucherId?: string;
  createdAt: string;
  description: string;
  purchaseAmount?: number;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
};