import React, { createContext, useContext, useEffect, useState } from 'react';
import { Voucher, Transaction } from '../types';
import { vouchers as mockVouchers, transactions as mockTransactions } from '../utils/mockData';
import { useAuth } from './AuthContext';

interface LoyaltyContextType {
  transactions: Transaction[];
  vouchers: Voucher[];
  userTransactions: Transaction[];
  redeemVoucher: (voucherId: string) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Filter transactions for the current user
      const filteredTransactions = transactions.filter(
        (transaction) => transaction.userId === currentUser.id
      );
      setUserTransactions(filteredTransactions);
    } else {
      setUserTransactions([]);
    }
  }, [currentUser, transactions]);

  const redeemVoucher = async (voucherId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      // Find the voucher
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher || !voucher.isActive) return false;

      // Check if user has enough points
      if (currentUser.points < voucher.pointsCost) return false;

      // Create redemption transaction
      const newTransaction: Transaction = {
        id: `${transactions.length + 1}`,
        userId: currentUser.id,
        type: 'redemption',
        amount: 0,
        pointsSpent: voucher.pointsCost,
        voucherId: voucher.id,
        createdAt: new Date().toISOString(),
        description: `Redeemed ${voucher.title}`,
      };

      // Update user points (in a real app, this would be done on the server)
      currentUser.points -= voucher.pointsCost;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      // Add the transaction
      setTransactions([...transactions, newTransaction]);
      return true;
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      return false;
    }
  };

  const addTransaction = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const newTransaction: Transaction = {
        id: `${transactions.length + 1}`,
        createdAt: new Date().toISOString(),
        ...transactionData,
      };

      setTransactions([...transactions, newTransaction]);
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  return (
    <LoyaltyContext.Provider
      value={{
        transactions,
        vouchers,
        userTransactions,
        redeemVoucher,
        addTransaction,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};