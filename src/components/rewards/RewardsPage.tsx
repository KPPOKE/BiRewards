import React, { useState } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Award, Gift, Info, AlertTriangle } from 'lucide-react';
import { Voucher } from '../../types';

const RewardsPage: React.FC = () => {
  const { vouchers, redeemVoucher } = useLoyalty();
  const { currentUser } = useAuth();
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const points = currentUser?.points || 0;
let tierColor = 'text-yellow-700'; // bronze (default)

if (points >= 1000) {
  tierColor = 'text-yellow-500'; // gold
} else if (points >= 500) {
  tierColor = 'text-gray-500'; // silver
}

  const handleRedeemVoucher = async (voucher: Voucher) => {
    if (!currentUser) return;

    try {
      if (currentUser.points < voucher.pointsCost) {
        setRedeemError(`You need ${voucher.pointsCost - currentUser.points} more points to redeem this reward.`);
        setRedeemSuccess(null);
        setTimeout(() => setRedeemError(null), 3000);
        return;
      }

      const success = await redeemVoucher(voucher.id);
      
      if (success) {
        setRedeemSuccess(`You've successfully redeemed ${voucher.title}!`);
        setRedeemError(null);
        setTimeout(() => setRedeemSuccess(null), 3000);
      } else {
        setRedeemError('Failed to redeem voucher. Please try again.');
        setRedeemSuccess(null);
        setTimeout(() => setRedeemError(null), 3000);
      }
    } catch (error) {
      setRedeemError('An error occurred. Please try again.');
      setRedeemSuccess(null);
      setTimeout(() => setRedeemError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-600 mt-1">Redeem your points for exclusive rewards</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <div className="flex items-center">
            <Award className={`h-5 w-5 mr-2 ${tierColor}`} />
          <span className={`font-medium ${tierColor}`}>{points} points </span>
          </div>
        </div>
      </div>

      {/* Notification area */}
      {redeemSuccess && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
          <Info className="h-5 w-5 mr-2 mt-0.5" />
          <span>{redeemSuccess}</span>
        </div>
      )}
      
      {redeemError && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <span>{redeemError}</span>
        </div>
      )}

      {/* Points tier explanation */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Points & Tiers</h2>
              <p className="mt-1 text-primary-100">Earn points with every purchase and unlock higher status tiers</p>
            </div>
            <div className="flex space-x-4">
              <div className="text-center px-4 py-2 bg-white bg-opacity-20 rounded-lg">
                <div className="font-bold text-lg">Bronze</div>
                <div className="text-sm">0-499 points</div>
              </div>
              <div className="text-center px-4 py-2 bg-white bg-opacity-20 rounded-lg">
                <div className="font-bold text-lg">Silver</div>
                <div className="text-sm">500-999 points</div>
              </div>
              <div className="text-center px-4 py-2 bg-white bg-opacity-20 rounded-lg">
                <div className="font-bold text-lg">Gold</div>
                <div className="text-sm">1000+ points</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((voucher) => (
          <RewardCard 
            key={voucher.id} 
            voucher={voucher} 
            canRedeem={currentUser ? currentUser.points >= voucher.pointsCost : false}
            onRedeem={() => handleRedeemVoucher(voucher)}
          />
        ))}
      </div>

      {vouchers.length === 0 && (
        <div className="text-center py-12">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No rewards available</h3>
          <p className="text-gray-500 mt-1">Check back later for new rewards</p>
        </div>
      )}
    </div>
  );
};

interface RewardCardProps {
  voucher: Voucher;
  canRedeem: boolean;
  onRedeem: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ voucher, canRedeem, onRedeem }) => {
  return (
    <Card className={`transition-all duration-200 ${!voucher.isActive ? 'opacity-60' : canRedeem ? 'hover:shadow-lg' : ''}`} hoverEffect={voucher.isActive && canRedeem}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{voucher.title}</CardTitle>
          <Badge className="bg-transparent text-gray-700 font-semibold shadow-none" size="lg">
            {voucher.pointsCost} pts
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 mb-4">{voucher.description}</p>
        <div className="text-sm text-gray-500 flex items-center mb-4">
          <Info size={14} className="mr-1" />
          Valid for {voucher.expiryDays} days after redemption
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          variant={canRedeem ? 'primary' : 'outline'}
          fullWidth
          disabled={!voucher.isActive || !canRedeem}
          onClick={onRedeem}
          leftIcon={<Gift size={16} />}
        >
          {canRedeem ? 'Redeem Now' : `Not Enough Points`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardsPage;