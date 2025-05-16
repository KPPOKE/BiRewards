import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLoyalty } from '../../context/LoyaltyContext';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Award, TrendingUp, Clock, Gift, ShoppingBag } from 'lucide-react';
import { Transaction, Voucher } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userTransactions, vouchers, redeemVoucher } = useLoyalty();
  
  // Calculate some stats
  const totalSpent = userTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalRedeemed = userTransactions
    .filter(t => t.type === 'redemption')
    .reduce((sum, t) => sum + (t.pointsSpent || 0), 0);
  
  const recentTransactions = userTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleRedeemVoucher = async (voucherId: string) => {
    const confirmed = window.confirm('Are you sure you want to redeem this voucher?');
    if (confirmed) {
      const success = await redeemVoucher(voucherId);
      if (success) {
        alert('Voucher redeemed successfully!');
      } else {
        alert('Failed to redeem voucher. You may not have enough points.');
      }
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Points" 
          value={currentUser?.points || 0} 
          icon={<Award size={20} className="text-primary-600" />}
          suffix="pts"
        />
        
        <StatCard 
          title="Total Spent" 
          value={totalSpent} 
          icon={<ShoppingBag size={20} className="text-teal-600" />}
          isAmount={true}
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
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => location.hash = '#transactions'}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      View all transactions
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 py-4">No transactions found.</p>
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
                {vouchers
                  .filter(v => v.isActive && v.pointsCost <= (currentUser?.points || 0))
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
                  ))}
                
                {vouchers.filter(v => v.isActive && v.pointsCost <= (currentUser?.points || 0)).length === 0 && (
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
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {isAmount ? formatCurrency(value) : `${prefix}${value}${suffix}`}
            </p>
          </div>
          <div className="p-3 rounded-full bg-gray-50">
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
        return <Award size={16} className="text-primary-600" />;
      case 'redemption':
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
              {transaction.type === 'purchase' && (
                <>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-green-600">+{transaction.pointsEarned} pts</p>
                </>
              )}
              {transaction.type === 'redemption' && (
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