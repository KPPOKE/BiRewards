import { User, Voucher, Transaction } from '../types';

// Data user
export const users: User[] = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'kentang',
    role: 'user',
    points: 200,
    createdAt: '2023-05-15T10:30:00Z',
  },
  {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin',
    points: 1500,
    createdAt: '2023-01-10T08:15:00Z',
  },
  {
    id: '3',
    email: 'rehan@example.com',
    name: 'Rehan',
    role: 'user',
    points: 350,
    createdAt: '2023-06-20T14:45:00Z',
  },
  {
    id: '4',
    name: 'Owner Boss',
    email: 'owner@example.com',
    role: 'owner',
    points: 1000,
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Manager Guy',
    email: 'manager@example.com',
    role: 'manager',
    points: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Kasir Man',
    email: 'cashier@example.com',
    role: 'cashier',
    points: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Waiter Bro',
    email: 'waiter@example.com',
    role: 'waiter',
    points: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Admin Woman',
    email: 'admin2@example.com',
    role: 'admin',
    points: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Pelanggan',
    email: 'user@example.com',
    role: 'user',
    points: 300,
    createdAt: new Date().toISOString()
  }
];

// Data voucher
export const vouchers: Voucher[] = [
  {
    id: '1',
    title: 'Free Coffee',
    description: 'Get a free coffee with this voucher.',
    pointsCost: 100,
    expiryDays: 30,
    isActive: true,
  },
  {
    id: '2',
    title: 'Discount 10%',
    description: '10% off on your next purchase.',
    pointsCost: 200,
    expiryDays: 60,
    isActive: true,
  },
];

// ...existing code...

export const transactions: Transaction[] = [
  {
    id: 't1',
    userId: '1',
    type: 'earning',
    amount: 50000,
    pointsEarned: 50,
    createdAt: '2023-05-15T11:00:00Z',
    description: 'Pembelian kopi di BI Cafe',
  },
  {
    id: 't2',
    userId: '1',
    type: 'redemption',
    amount: 0,
    pointsSpent: 100,
    voucherId: '1',
    createdAt: '2023-05-20T09:30:00Z',
    description: 'Redeem voucher Free Coffee',
  },
  {
    id: 't3',
    userId: '2',
    type: 'earning',
    amount: 100000,
    pointsEarned: 100,
    createdAt: '2023-06-01T14:20:00Z',
    description: 'Pembelian makanan di BI Cafe',
  },
  {
    id: 't4',
    userId: '3',
    type: 'purchase',
    amount: 75000,
    createdAt: '2023-06-21T10:00:00Z',
    description: 'Pembelian snack',
  },
  {
    id: 't5',
    userId: '3',
    type: 'redemption',
    amount: 0,
    pointsSpent: 200,
    voucherId: '2',
    createdAt: '2023-06-22T12:00:00Z',
    description: 'Redeem voucher Discount 10%',
  },
];