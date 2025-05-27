import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Voucher, Transaction } from '../types';
import { useAuth } from './AuthContext';

// Development mode flag to disable automatic API calls during development
const DEV_MODE = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface LoyaltyContextType {
  transactions: Transaction[];
  vouchers: Voucher[];
  userTransactions: Transaction[];
  redeemVoucher: (voucherId: string) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
  refreshTransactions: () => Promise<void>;
  refreshRewards: () => Promise<void>;
  isLoading: boolean;
  lastRefreshTime: {
    transactions: number | null;
    rewards: number | null;
  };
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedRewards, setFetchedRewards] = useState(false);
  const [fetchedTransactions, setFetchedTransactions] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState({
    transactions: null as number | null,
    rewards: null as number | null
  });
  
  // Use refs to prevent unnecessary re-renders
  const isFetchingTransactions = useRef(false);
  const isFetchingRewards = useRef(false);

  // Fetch user transactions from the API
  const fetchUserTransactions = async () => {
    // Skip if already fetching to prevent duplicate calls
    if (!currentUser || !currentUser.id || isFetchingTransactions.current) return;
    
    // In development mode, respect the fetchedTransactions flag to prevent infinite loops
    if (DEV_MODE && fetchedTransactions) return;
    
    isFetchingTransactions.current = true;
    setIsLoading(true);
    try {
      const token = (currentUser as any)?.token;
      const response = await fetch(`${API_URL}/users/${currentUser.id}/transactions`, {
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Map backend transaction format to frontend format
        const mappedTransactions = data.data.map((t: any) => {
          // Extract the purchase amount from the description if it's not available in purchase_amount
          let extractedAmount = 0;
          if (t.type === 'points_added' && t.description) {
            const match = t.description.match(/Rp(\d+)/i);
            if (match && match[1]) {
              extractedAmount = parseInt(match[1], 10);
            }
          }
          
          // Use purchase_amount if available, otherwise use extracted amount from description
          const actualPurchaseAmount = t.purchase_amount || extractedAmount || 0;
          
          return {
            id: t.id,
            userId: t.user_id,
            type: t.type,
            // For display purposes, use the actual purchase amount for points_added transactions
            amount: t.type === 'points_added' ? actualPurchaseAmount : (t.amount || 0),
            pointsEarned: t.type === 'points_added' ? t.amount : 0,
            pointsSpent: t.type === 'reward_redeemed' ? Math.abs(t.amount) : 0,
            voucherId: t.reward_id,
            createdAt: t.created_at,
            description: t.description,
            purchaseAmount: actualPurchaseAmount
          };
        });
        
        setTransactions(mappedTransactions);
        setUserTransactions(mappedTransactions);
        setFetchedTransactions(true);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
      isFetchingTransactions.current = false;
      setLastRefreshTime(prev => ({
        ...prev,
        transactions: Date.now()
      }));
    }
  };

  // Fetch rewards from the API
  const fetchRewards = async () => {
    // Skip if already fetching to prevent duplicate calls
    if (isFetchingRewards.current) return;
    
    // In development mode, respect the fetchedRewards flag to prevent infinite loops
    if (DEV_MODE && fetchedRewards) return;
    
    isFetchingRewards.current = true;
    setIsLoading(true);
    try {
      const token = (currentUser as any)?.token;
      const response = await fetch(`${API_URL}/rewards`, {
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('Fetched rewards from API:', data.data);
        // Map backend reward format to frontend voucher format
        const mappedVouchers = data.data.map((r: any) => ({
          id: r.id.toString(),
          title: r.title,
          description: r.description,
          pointsCost: r.points_cost,
          expiryDays: r.expiry_days || 30, // Default to 30 days if not specified
          isActive: typeof r.is_active === 'boolean' ? r.is_active : r.is_active === 1
        }));
        
        setVouchers(mappedVouchers);
        setFetchedRewards(true);
      } else {
        console.error('Failed to fetch rewards:', data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
      isFetchingRewards.current = false;
      setLastRefreshTime(prev => ({
        ...prev,
        rewards: Date.now()
      }));
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Only fetch rewards when user is authenticated
      fetchRewards();
      fetchUserTransactions();
    } else {
      setUserTransactions([]);
      // When not authenticated, set empty vouchers array
      setVouchers([]);
    }
  }, [currentUser]);

  const redeemVoucher = async (voucherId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      // Find the voucher
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher || !voucher.isActive) return false;

      // Check if user has enough points
      if (currentUser.points < voucher.pointsCost) return false;

      // Call API to redeem voucher
      const token = (currentUser as any)?.token;
      const response = await fetch(`${API_URL}/users/${currentUser.id}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ rewardId: voucherId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh transactions to get the latest data
        await fetchUserTransactions();
        
        // Update user points in state
        if (currentUser && data.data && data.data.newPoints !== undefined) {
          // Update the current user's points
          currentUser.points = data.data.newPoints;
          
          // Update in localStorage to persist the change
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.points = data.data.newPoints;
            localStorage.setItem('currentUser', JSON.stringify(parsedUser));
          }
        }
        return true;
      } else {
        console.error('Failed to redeem voucher:', data.message);
        return false;
      }
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
      // In a real implementation, this would call the API to add a transaction
      const newTransaction: Transaction = {
        id: `${Date.now()}`, // Use timestamp for unique ID
        createdAt: new Date().toISOString(),
        ...transactionData,
      };

      // Update both transactions and userTransactions arrays
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      setUserTransactions(updatedTransactions);
      
      // Reset the fetch flag to ensure we get fresh data next time
      if (DEV_MODE) {
        setFetchedTransactions(false);
      }
      
      // Update the last refresh time
      setLastRefreshTime(prev => ({
        ...prev,
        transactions: Date.now()
      }));
      
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  // Force refresh function that bypasses the fetch flags
  const forceRefreshTransactions = async (): Promise<void> => {
    // Only reset the flag in development mode
    if (DEV_MODE) {
      setFetchedTransactions(false);
    }
    
    // Prevent refreshing more than once per 5 seconds to avoid unnecessary API calls
    const now = Date.now();
    const lastRefresh = lastRefreshTime.transactions;
    if (lastRefresh && now - lastRefresh < 5000) {
      console.log('Skipping transaction refresh - too soon');
      return Promise.resolve();
    }
    
    return fetchUserTransactions();
  };

  const forceRefreshRewards = async (): Promise<void> => {
    // Only reset the flag in development mode
    if (DEV_MODE) {
      setFetchedRewards(false);
    }
    
    // Prevent refreshing more than once per 5 seconds to avoid unnecessary API calls
    const now = Date.now();
    const lastRefresh = lastRefreshTime.rewards;
    if (lastRefresh && now - lastRefresh < 5000) {
      console.log('Skipping rewards refresh - too soon');
      return Promise.resolve();
    }
    
    return fetchRewards();
  };

  return (
    <LoyaltyContext.Provider
      value={{
        transactions,
        vouchers,
        userTransactions,
        redeemVoucher,
        addTransaction,
        refreshTransactions: forceRefreshTransactions,
        refreshRewards: forceRefreshRewards,
        isLoading,
        lastRefreshTime
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