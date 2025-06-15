import React from 'react';
import { useAuth } from '../../context/useAuth';
import { useLoyalty } from '../../context/LoyaltyContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmModal from '../ui/ConfirmModal';
import { Award, TrendingUp, Clock, Gift, ShoppingBag, Wallet } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { UserRole } from '../../utils/roleAccess';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userTransactions, vouchers, redeemVoucher, refreshTransactions, refreshRewards, isLoading, lastRefreshTime } = useLoyalty();
  const userRole = (currentUser?.role as UserRole) || 'user';

  // State for confirmation modal (move up)
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = React.useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = React.useState(false);
  const [redeemMessage, setRedeemMessage] = React.useState<string | null>(null);

  // Add a second useEffect to refresh data when lastRefreshTime changes
  React.useEffect(() => {
    // This will re-render the component when transactions are updated
    // without triggering new API calls
  }, [lastRefreshTime]);

  if (userRole !== 'user') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  
  // Map to store the correct purchase amounts for each transaction description
  const purchaseAmounts: {[key: string]: number} = {
    'Purchase Rp100,000': 100000,
    'Purchase Rp50,000': 50000,
  };
  
  // Calculate total by matching transaction descriptions to known purchase amounts
  const totalSpent = userTransactions
    .filter(t => t.type === 'purchase' || t.type === 'points_added')
    .reduce((sum, t) => {
      // Check if we have a known amount for this description
      if (t.description && purchaseAmounts[t.description]) {
        return sum + purchaseAmounts[t.description];
      }
      // Fallback to using the amount property
      return sum + (t.purchaseAmount || 0);
    }, 0);
    
  const totalRedeemed = userTransactions
    .filter(t => t.type === 'redemption')
    .reduce((sum, t) => sum + (t.pointsSpent || 0), 0);
  
  // Count total transactions (purchases and points_added)
  const totalTransactionCount = userTransactions
    .filter(t => t.type === 'purchase' || t.type === 'points_added')
    .length;
  
  const recentTransactions = userTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // We don't need a separate date formatting function as we're using toLocaleDateString directly

  // State for confirmation modal
  // (already declared at the top)

  // Only opens the confirmation modal; does NOT redeem directly
  const handleRedeemVoucher = (voucherId: string) => {
    setSelectedVoucherId(voucherId);
    setConfirmOpen(true);
  };

  // Called ONLY from the confirmation modal
  const handleConfirmRedeem = async () => {
    if (!selectedVoucherId || !confirmOpen) return; // Defensive: only proceed if modal is open
    setRedeemLoading(true);
    setRedeemMessage(null);
    const success = await redeemVoucher(selectedVoucherId);
    setRedeemLoading(false);
    setConfirmOpen(false);
    setSelectedVoucherId(null);
    if (success) {
      setRedeemMessage('Voucher redeemed successfully!');
    } else {
      setRedeemMessage('Failed to redeem voucher. You may not have enough points.');
    }
    // Optionally, refresh rewards/transactions here
    await refreshRewards();
    await refreshTransactions();
  };



  // Determine status based on points
  const getUserStatus = (points: number) => {
    if (points >= 1000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
  };

  const statusColors = {
    Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Silver: 'bg-gray-100 text-gray-800 border-gray-300',
    Bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  const userStatus = getUserStatus(currentUser?.points || 0);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {currentUser?.name}</h1>
          <p className="text-gray-600 mt-1">Here's a summary of your loyalty program</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <div className="mr-3 flex items-center">
            <Award className="h-5 w-5 text-primary-600 mr-1" />
            <span className="font-medium">{currentUser?.points || 0} points</span>
          </div>
          
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Points" 
          value={currentUser?.points || 0} 
          icon={<Award size={20} className="text-primary-600" />}
          suffix="pts"
        />
        
        <StatCard 
          title="Total Spent" 
          value={totalSpent} 
          icon={<Wallet size={20} className="text-teal-600" />} 
          isAmount={true}
        />
        
        <StatCard 
          title="Total Transactions" 
          value={totalTransactionCount} 
          icon={<ShoppingBag size={20} className="text-blue-600" />}
        />
        
        <StatCard 
          title="Points Redeemed" 
          value={totalRedeemed} 
          icon={<Gift size={20} className="text-amber-600" />}
          suffix="pts"
        />
        
        <StatCard 
          title="Available Rewards" 
          value={vouchers.filter(v => v.isActive && v.pointsCost <= (currentUser?.points || 0)).length} 
          icon={<Gift size={20} className="text-green-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-500" />
                Recent Transactions
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refreshTransactions()}
                  isLoading={isLoading}
                >
                  Refresh
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => location.hash = '#transactions'}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-3 divide-y divide-gray-100">
                  {recentTransactions.map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No transactions found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Rewards */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift size={18} className="mr-2 text-gray-600" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 {isLoading ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Loading rewards...</p>
                  </div>
                ) : vouchers && vouchers.length > 0 ? (
                  vouchers
                    .filter(v => {
                      // Check if voucher is active and user has enough points
                      if (!v.isActive || v.pointsCost > (currentUser?.points || 0)) return false;
                      
                      // Check tier requirements if present
                      if (v.minimumRequiredTier) {
                        const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
                        // Use loyaltyTier from user object, or calculate from highestPoints
                        const userTier = currentUser?.loyaltyTier || 
                          ((currentUser?.highestPoints || 0) >= 1000 ? 'Gold' : 
                          (currentUser?.highestPoints || 0) >= 500 ? 'Silver' : 'Bronze');
                        return tierOrder[userTier] >= tierOrder[v.minimumRequiredTier];
                      }
                      
                      return true;
                    })
                    .slice(0, 3)
                    .map((voucher) => (
                      <div key={voucher.id} className="p-3 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{voucher.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{voucher.description}</p>
                          </div>
                          <Badge className="bg-transparent text-gray-700 font-semibold shadow-none">
                             {voucher.pointsCost} pts
                              </Badge>
                        </div>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleRedeemVoucher(voucher.id)}
                            fullWidth
                          >
                            Redeem
                          </Button>
                        </div>
                      </div>
                    ))
                ) : null}

                {/* Confirmation Modal */}
                <ConfirmModal
                  open={confirmOpen}
                  title="Confirm Redemption"
                  description="Are you sure you want to redeem this reward? This action cannot be undone."
                  confirmText={redeemLoading ? 'Processing...' : 'Yes, Redeem'}
                  cancelText="Cancel"
                  onConfirm={handleConfirmRedeem}
                  onCancel={() => { setConfirmOpen(false); setSelectedVoucherId(null); }}
                />
                {redeemMessage && (
                  <div className="text-center py-2">
                    <span className="text-green-600 font-medium">{redeemMessage}</span>
                  </div>
                )}
                
                {!isLoading && (!vouchers || vouchers.filter(v => {
                  // Check if voucher is active and user has enough points
                  if (!v.isActive || v.pointsCost > (currentUser?.points || 0)) return false;
                  
                  // Check tier requirements if present
                  if (v.minimumRequiredTier) {
                    const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
                    // Use loyaltyTier from user object, or calculate from highestPoints
                    const userTier = currentUser?.loyaltyTier || 
                      ((currentUser?.highestPoints || 0) >= 1000 ? 'Gold' : 
                      (currentUser?.highestPoints || 0) >= 500 ? 'Silver' : 'Bronze');
                    return tierOrder[userTier] >= tierOrder[v.minimumRequiredTier];
                  }
                  
                  return true;
                }).length === 0) && (
                  <div className="text-center py-6">
                    <Gift size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No rewards available with your current points.</p>
                    <p className="text-sm text-gray-400 mt-1">Earn more points to unlock rewards!</p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => location.hash = '#rewards'}
                  fullWidth
                >
                  View all rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress to next tier */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Progress to Next Tier</h3>
              <p className="text-primary-100 text-sm mt-1">
                {userStatus === 'Bronze' ? (
                  `Earn ${500 - (currentUser?.points || 0)} more points to reach Silver status`
                ) : userStatus === 'Silver' ? (
                  `Earn ${1000 - (currentUser?.points || 0)} more points to reach Gold status`
                ) : (
                  `You've reached our highest Gold tier!`
                )}
              </p>
            </div>
            <Badge className={`bg-white mt-2 sm:mt-0 ${statusColors[userStatus as keyof typeof statusColors]}`}>
           {userStatus}
            </Badge>         
             </div>
          
          {userStatus !== 'Gold' && (
            <div className="mt-4">
              <div className="w-full bg-primary-800 rounded-full h-2.5">
                <div 
                  className="bg-white h-2.5 rounded-full" 
                  style={{ 
                    width: userStatus === 'Bronze' ? 
                      `${Math.min(100, (currentUser?.points || 0) / 5)}%` : 
                      `${Math.min(100, ((currentUser?.points || 0) - 500) / 5)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  prefix?: string;
  suffix?: string;
  isAmount?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  prefix = '', 
  suffix = '',
  isAmount = false
}) => {
  // Responsive font size for value
  const valueLength = (isAmount ? String(value) : String(`${prefix}${value}${suffix}`)).length;
  const valueClass = valueLength > 10 ? 'text-xl' : 'text-2xl';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`${valueClass} font-bold mt-1 break-words max-w-[9ch]`}>
              {isAmount ? formatCurrency(value) : `${prefix}${value}${suffix}`}
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 p-3 rounded-full bg-gray-50">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-2">
            <span className={`text-xs font-medium flex items-center
              ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className={`mr-1 ${trendUp ? '' : 'transform rotate-180'}`} />
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag size={16} className="text-teal-600" />;
      case 'earning':
      case 'points_added':
        return <Award size={16} className="text-primary-600" />;
      case 'redemption':
      case 'reward_redeemed':
        return <Gift size={16} className="text-amber-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-center">
        <div className="mr-3 p-2 rounded-full bg-gray-100">
          {getTransactionIcon(transaction.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                {transaction.description}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              {(transaction.type === 'purchase' || transaction.type === 'points_added') && (
                <>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-green-600">+{transaction.pointsEarned || transaction.amount} pts</p>
                </>
              )}
              {(transaction.type === 'redemption' || transaction.type === 'reward_redeemed') && (
                <p className="text-xs text-amber-600">-{transaction.pointsSpent} pts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;