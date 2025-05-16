import { User, Voucher, Transaction } from '../types';

// Mock users
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
];

// Mock vouchers
export const vouchers: Voucher[] = [
  {
    id: '1',
    title: '10% Off Next Purchase',
    description: 'Get 10% off on your next purchase. Valid for 30 days after redemption.',
    pointsCost: 200,
    expiryDays: 30,
    isActive: true,
  },
  {
    id: '2',
    title: 'Free Shipping',
    description: 'Free shipping on your next order. Valid for 14 days after redemption.',
    pointsCost: 150,
    expiryDays: 14,
    isActive: true,
  },
  {
    id: '3',
    title: 'IDR25.000 Gift Card',
    description: 'Redeem for a IDR25.000 gift card. Valid for 60 days after redemption.',
    pointsCost: 500,
    expiryDays: 60,
    isActive: true,
  },
  {
    id: '4',
    title: 'Premium Membership (1 Month)',
    description: 'Get premium membership benefits for 1 month.',
    pointsCost: 800,
    expiryDays: 30,
    isActive: true,
  },
  {
    id: '5',
    title: 'Exclusive Product Early Access',
    description: 'Get our new food product.',
    pointsCost: 1000,
    expiryDays: 90,
    isActive: true,
  },
];

// Mock transactions
export const transactions: Transaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'purchase',
    amount: 150.00,
    pointsEarned: 150,
    createdAt: '2023-08-10T09:23:15Z',
    description: 'Purchase from Gojek',
  },
  {
    id: '2',
    userId: '1',
    type: 'redemption',
    amount: 0,
    pointsSpent: 200,
    voucherId: '1',
    createdAt: '2023-08-15T14:30:45Z',
    description: 'Redeemed 10% Off Next Purchase voucher',
  },
  {
    id: '3',
    userId: '1',
    type: 'purchase',
    amount: 85.50,
    pointsEarned: 85,
    createdAt: '2024-09-02T11:45:22Z',
    description: 'In-store purchase',
  },
  {
    id: '4',
    userId: '1',
    type: 'purchase',
    amount: 215.75,
    pointsEarned: 215,
    createdAt: '2024-09-20T16:12:08Z',
    description: 'purchase from gojek',
  },
  {
    id: '5',
    userId: '3',
    type: 'purchase',
    amount: 350.00,
    pointsEarned: 350,
    createdAt: '2024-08-05T10:15:45Z',
    description: 'Purchase from home',
  },
  {
    id: '6',
    userId: '3',
    type: 'redemption',
    amount: 0,
    pointsSpent: 150,
    voucherId: '2',
    createdAt: '2024-09-10T13:20:30Z',
    description: 'Redeemed Free Ice Tea',
  },
];