import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Voucher, Transaction } from '../types';
import { useAuth } from './useAuth';
import { API_URL } from '../utils/api';

// Development mode flag to disable automatic API calls during development
const DEV_MODE = import.meta.env.DEV;

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

// Backend response typings
interface BackendTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  reward_id?: string;
  created_at: string;
  description: string;
  purchase_amount?: number;
}

interface BackendVoucher {
  id: string | number;
  title: string;
  description: string;
  points_cost: number;
  expiry_days: number;
  is_active: boolean | number;
  minimum_required_tier?: 'Bronze' | 'Silver' | 'Gold';
}

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  console.log('[LoyaltyProvider] currentUser:', currentUser); // For debugging

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedRewards, setFetchedRewards] = useState(false);
  const [fetchedTransactions, setFetchedTransactions] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState({ transactions: null as number | null, rewards: null as number | null });

  const isFetchingTransactions = useRef(false);
  const isFetchingRewards = useRef(false);

  // Reset fetch flags when currentUser changes (login/logout)
  useEffect(() => {
    setFetchedRewards(false);
    setFetchedTransactions(false);
  }, [currentUser]);

  // Unified fetch for admin-level users (owner, manager)
  const fetchAdminData = useCallback(async () => {
    if (isFetchingTransactions.current || isFetchingRewards.current) return;
    if (DEV_MODE && fetchedTransactions && fetchedRewards) return;

    isFetchingTransactions.current = true;
    isFetchingRewards.current = true;
    setIsLoading(true);
    try {
      const token = currentUser?.token;
      const response = await fetch(`${API_URL}/users/owner/metrics`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include'
      });
      const data = await response.json();
      console.log('[LoyaltyProvider] Admin Metrics Response:', data);
      if (data.success && data.data) {
        const { activityLogs = [], rewards = [] } = data.data;
                const mappedTransactions: Transaction[] = (activityLogs as BackendTransaction[]).map((t) => ({ id: t.id, userId: t.user_id, type: t.type as Transaction['type'], description: t.description, amount: t.purchase_amount || t.amount, pointsEarned: t.type === 'points_added' ? t.amount : undefined, pointsSpent: t.type === 'reward_redeemed' ? t.amount : undefined, createdAt: t.created_at }));
        setUserTransactions(mappedTransactions);
        setTransactions(mappedTransactions);
        const mappedVouchers: Voucher[] = (rewards as BackendVoucher[]).map((v) => ({ id: String(v.id), title: v.title, description: v.description, pointsCost: v.points_cost, isActive: !!v.is_active, expiryDays: v.expiry_days, minimumRequiredTier: v.minimum_required_tier }));
        setVouchers(mappedVouchers);
        setLastRefreshTime({ transactions: Date.now(), rewards: Date.now() });
        setFetchedTransactions(true);
        setFetchedRewards(true);
      } else {
        console.error('Failed to fetch admin metrics:', data.message);
      }
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      isFetchingTransactions.current = false;
      isFetchingRewards.current = false;
      setIsLoading(false);
    }
  }, [currentUser, fetchedTransactions, fetchedRewards]);

  // Fetch user transactions for non-admin users
  const fetchUserTransactions = useCallback(async () => {
    if (!currentUser || !currentUser.id || isFetchingTransactions.current) return;
    if (DEV_MODE && fetchedTransactions) return;
    isFetchingTransactions.current = true;
    setIsLoading(true);
    try {
      const token = currentUser?.token;
      const response = await fetch(`${API_URL}/users/${currentUser.id}/transactions`, { headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, credentials: 'include' });
      const data = await response.json();
      if (data.success && data.data) {
                const mappedTransactions: Transaction[] = (data.data as BackendTransaction[]).map<Transaction>((t) => ({ id: t.id, userId: t.user_id, type: t.type as Transaction['type'], description: t.description, amount: t.purchase_amount || t.amount, pointsEarned: t.type === 'points_added' ? t.amount : undefined, pointsSpent: t.type === 'reward_redeemed' ? t.amount : undefined, createdAt: t.created_at }));
        setUserTransactions(mappedTransactions);
        setTransactions(mappedTransactions);
        setLastRefreshTime(prev => ({ ...prev, transactions: Date.now() }));
        setFetchedTransactions(true);
      } else {
        console.error('Failed to fetch transactions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      isFetchingTransactions.current = false;
      setIsLoading(false);
    }
  }, [currentUser, fetchedTransactions]);

  // Fetch rewards for non-admin users
  const fetchRewards = useCallback(async () => {
    if (isFetchingRewards.current) return;
    if (DEV_MODE && fetchedRewards) return;
    isFetchingRewards.current = true;
    setIsLoading(true);
    try {
      const token = currentUser?.token;
      const response = await fetch(`${API_URL}/rewards`, { headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, credentials: 'include' });
      const data = await response.json();
      if (data.success && data.data) {
        const mappedVouchers: Voucher[] = (data.data as BackendVoucher[]).map((v) => ({ id: String(v.id), title: v.title, description: v.description, pointsCost: v.points_cost, isActive: !!v.is_active, expiryDays: v.expiry_days, minimumRequiredTier: v.minimum_required_tier }));
        setVouchers(mappedVouchers);
        setLastRefreshTime(prev => ({ ...prev, rewards: Date.now() }));
        setFetchedRewards(true);
      } else {
        console.error('Failed to fetch rewards:', data.message);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      isFetchingRewards.current = false;
      setIsLoading(false);
    }
  }, [currentUser, fetchedRewards]);

  // Main effect to fetch data on user change or navigation
  useEffect(() => {
    const fetchDataForRole = () => {
      if (currentUser) {
        const role = currentUser.role ? currentUser.role.toLowerCase() : '';
        if (['owner', 'manager'].includes(role)) {
          fetchAdminData();
        } else {
          fetchUserTransactions();
          fetchRewards();
        }
      } else {
        // Clear data on logout
        setTransactions([]);
        setVouchers([]);
        setUserTransactions([]);
      }
    };

    fetchDataForRole(); // Fetch on initial load and user change

    window.addEventListener('hashchange', fetchDataForRole); // Fetch on navigation
    return () => window.removeEventListener('hashchange', fetchDataForRole);
  }, [currentUser, fetchAdminData, fetchUserTransactions, fetchRewards]);

  const redeemVoucher = async (voucherId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher || !voucher.isActive) return false;

      const role = currentUser.role ? currentUser.role.toLowerCase() : '';
      if (['owner', 'manager'].includes(role)) {
        console.log('Voucher redemption is not applicable for admin roles.');
        return false;
      }

      if (currentUser.points < voucher.pointsCost) return false;

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${currentUser.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ rewardId: voucherId })
      });

      if (!response.ok) {
        console.error('Failed to redeem voucher. Status:', response.status);
        return false;
      }

      const data = await response.json();
      if (data.success) {
        await fetchUserTransactions();
        if (currentUser && data.data && data.data.newPoints !== undefined) {
          currentUser.points = data.data.newPoints;
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

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const newTransaction: Transaction = { id: `${Date.now()}`, createdAt: new Date().toISOString(), ...transactionData };
      const updatedTransactions: Transaction[] = Array.from(new Map([...transactions, newTransaction].map((t: Transaction) => [t.id, t])).values());
      setTransactions(updatedTransactions);
      setUserTransactions(updatedTransactions);
      if (DEV_MODE) setFetchedTransactions(false);
      setLastRefreshTime(prev => ({ ...prev, transactions: Date.now() }));
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  const forceRefreshTransactions = async (): Promise<void> => {
    if (DEV_MODE) setFetchedTransactions(false);
    const now = Date.now();
    if (lastRefreshTime.transactions && now - lastRefreshTime.transactions < 5000) return;
    return fetchUserTransactions();
  };

  const forceRefreshRewards = async (): Promise<void> => {
    if (DEV_MODE) setFetchedRewards(false);
    const now = Date.now();
    if (lastRefreshTime.rewards && now - lastRefreshTime.rewards < 5000) return;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useLoyalty = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};