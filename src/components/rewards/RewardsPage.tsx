import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Voucher } from '../../types';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Gift, Info, AlertTriangle, Award } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';

// Helper functions for tier badges
const getTierStyles = (tier: string): string => {
  switch (tier) {
    case 'Gold':
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'Silver':
      return 'bg-gray-100 text-gray-700 border border-gray-300';
    default: // Bronze
      return 'bg-orange-100 text-orange-800 border border-orange-300';
  }
};

const getTierIcon = (tier: string) => {
  return <Award size={14} className={tier === 'Gold' ? 'text-amber-600' : tier === 'Silver' ? 'text-gray-500' : 'text-orange-600'} />;
};

const RewardsPage: React.FC = () => {
  const { vouchers } = useLoyalty();
  const { currentUser, setCurrentUser } = useAuth();
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  
  // Force update the user's loyalty tier based on highest points
  useEffect(() => {
    if (currentUser && currentUser.highestPoints) {
      // Determine the correct tier based on highestPoints
      let correctTier: 'Bronze' | 'Silver' | 'Gold' = 'Bronze';
      if (currentUser.highestPoints >= 1000) {
        correctTier = 'Gold';
      } else if (currentUser.highestPoints >= 500) {
        correctTier = 'Silver';
      }
      
      // If the stored tier is different from what it should be, update it
      if (currentUser.loyaltyTier !== correctTier) {
        console.log(`Fixing tier: ${currentUser.loyaltyTier} → ${correctTier}`);
        
        // Update in memory
        const updatedUser = {
          ...currentUser,
          loyaltyTier: correctTier
        };
        
        // Update in state
        setCurrentUser(updatedUser);
        
        // Update in localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  }, [currentUser, setCurrentUser]);

  const points = currentUser?.points || 0;
  const highestPoints = currentUser?.highestPoints ?? 0;
  const loyaltyTier = currentUser?.loyaltyTier
  || (highestPoints >= 1000 ? 'Gold'
      : highestPoints >= 500 ? 'Silver'
      : 'Bronze');
  let tierColor = 'text-yellow-700'; // bronze (default)

  if (loyaltyTier === 'Gold') {
    tierColor = 'text-yellow-500';
  } else if (loyaltyTier === 'Silver') {
    tierColor = 'text-gray-500';
  }

  // Only open the modal, don't redeem yet
  const handleRedeemVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setConfirmOpen(true);
  };

  // Called ONLY from the confirmation modal
  const handleConfirmRedeem = async () => {
    if (!selectedVoucher || !currentUser) return;
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      if (currentUser.points < selectedVoucher.pointsCost) {
        setRedeemError(`You need ${selectedVoucher.pointsCost - currentUser.points} more points to redeem this reward.`);
        setRedeemSuccess(null);
        setTimeout(() => setRedeemError(null), 3000);
        setRedeemLoading(false);
        setConfirmOpen(false);
        setSelectedVoucher(null);
        return;
      }
      
      // Create a redeem request instead of direct redemption
      const response = await fetch('http://localhost:3000/api/redeem-requests/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reward_id: selectedVoucher.id,
          points_to_use: selectedVoucher.pointsCost
        })
      });
      
      const data = await response.json();
      setRedeemLoading(false);
      setConfirmOpen(false);
      setSelectedVoucher(null);
      
      if (data.success) {
        // Update user points in local state
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            points: currentUser.points - selectedVoucher.pointsCost
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        
        setRedeemSuccess(`Reward redemption request created! A manager will review your request shortly.`);
        setRedeemError(null);
        setTimeout(() => {
          setRedeemSuccess(null);
          // Redirect to redeem requests page to see status
          window.location.hash = 'redeem-requests';
        }, 3000);
      } else {
        setRedeemError(data.message || 'Failed to create redemption request. Please try again.');
        setRedeemSuccess(null);
        setTimeout(() => setRedeemError(null), 3000);
      }
    } catch (error) {
      setRedeemError('An error occurred. Please try again.');
      setRedeemSuccess(null);
      setTimeout(() => setRedeemError(null), 3000);
      setRedeemLoading(false);
      setConfirmOpen(false);
      setSelectedVoucher(null);
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
            canRedeem={(() => {
              if (!currentUser) return false;
              
              // Points check - must have enough points to redeem
              const hasEnoughPoints = currentUser.points >= voucher.pointsCost;
              
              // Tier validation
              const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
              
              // IMPORTANT: Force the loyalty tier to be one of the valid tier values to ensure proper mapping
              // Ensure the user's tier is always one of the three valid tiers for comparison
              let userTier = 'Bronze';
              if (loyaltyTier === 'Gold') {
                userTier = 'Gold';
              } else if (loyaltyTier === 'Silver') {
                userTier = 'Silver';
              }
              
              // Get the required tier for this voucher (default to Bronze if not specified)
              const requiredTier = voucher.minimumRequiredTier || 'Bronze';
              
              // Make sure we're only using valid tier values
              const validUserTier = userTier as 'Bronze' | 'Silver' | 'Gold';
              const validRequiredTier = requiredTier as 'Bronze' | 'Silver' | 'Gold';
              
              // Log for debugging
              console.log(`Voucher: ${voucher.title}, User Tier: ${validUserTier}, Required Tier: ${validRequiredTier}`);
              console.log(`User has points: ${currentUser.points}, Required points: ${voucher.pointsCost}`);
              console.log(`User has tier level: ${tierOrder[validUserTier]}, Needs tier level: ${tierOrder[validRequiredTier]}`);
              
              // The user can redeem if they have enough points AND their tier is high enough
              const canRedeemTier = tierOrder[validUserTier] >= tierOrder[validRequiredTier];
              console.log(`Can redeem: ${hasEnoughPoints && canRedeemTier} (Points: ${hasEnoughPoints}, Tier: ${canRedeemTier})`);
              
              return hasEnoughPoints && canRedeemTier;
            })()}
            userTier={loyaltyTier}
            onRedeem={() => handleRedeemVoucher(voucher)}
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmOpen}
        onCancel={() => { setConfirmOpen(false); setSelectedVoucher(null); }}
        onConfirm={handleConfirmRedeem}
        title="Request Reward Redemption"
        confirmText={redeemLoading ? 'Processing...' : 'Submit Request'}
      >
        {selectedVoucher && (
          <div className="space-y-4">
            <p>
              Are you sure you want to request <strong>{selectedVoucher.title}</strong> for <strong>{selectedVoucher.pointsCost} points</strong>?
            </p>
            <div className="p-3 bg-gray-100 rounded-md">
              <div className="text-sm font-medium text-gray-500">Current points balance:</div>
              <div className="text-lg font-medium">{points} points</div>
              <div className="text-sm font-medium text-gray-500 mt-2">Points after redemption:</div>
              <div className="text-lg font-medium">{points - (selectedVoucher?.pointsCost || 0)} points</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Note:</span> Your points will be reserved while your request is reviewed by a manager. 
                If approved, you'll receive a voucher. If rejected, your points will be refunded.
              </p>
            </div>
          </div>
        )}
      </ConfirmModal>

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
  userTier: 'Bronze' | 'Silver' | 'Gold';
  onRedeem: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ voucher, canRedeem, userTier, onRedeem }) => {
  const tierOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
  const requiredTier = voucher.minimumRequiredTier || 'Bronze';
  const belowTier = tierOrder[userTier] < tierOrder[requiredTier];
  return (
    <Card className={`transition-all duration-200 ${!voucher.isActive ? 'opacity-60' : canRedeem ? 'hover:shadow-lg' : ''}`} hoverEffect={voucher.isActive && canRedeem}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{voucher.title}</CardTitle>
          <div className="flex flex-col items-end">
            <Badge className="bg-transparent text-gray-700 font-semibold shadow-none" size="lg">
              {voucher.pointsCost} pts
            </Badge>
            <div className="flex items-center mt-2">
              <Badge 
                className={`px-2 py-1 rounded-full flex items-center gap-1.5 ${getTierStyles(voucher.minimumRequiredTier || 'Bronze')}`}
              >
                {getTierIcon(voucher.minimumRequiredTier || 'Bronze')}
                <span>{voucher.minimumRequiredTier || 'Bronze'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 mb-4">{voucher.description}</p>
        <div className="text-sm text-gray-500 flex items-center mb-4">
          <Info size={14} className="mr-1" />
          Valid for {voucher.expiryDays} days after redemption
        </div>
        {belowTier && (
          <div className="text-xs text-red-600 flex items-center mt-2">
            <AlertTriangle size={14} className="mr-1" />
            This reward can only be claimed once you reach {voucher.minimumRequiredTier} tier.
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          variant={canRedeem ? 'primary' : 'outline'}
          fullWidth
          disabled={!voucher.isActive || !canRedeem}
          onClick={onRedeem}
          leftIcon={<Gift size={16} />}
        >
          {canRedeem
            ? 'Request Now'
            : belowTier
              ? `Tier Too Low`
              : `Not Enough Points`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardsPage;