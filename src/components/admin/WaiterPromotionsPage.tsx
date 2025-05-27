import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../utils/roleAccess';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Gift } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  is_active: boolean;
}

const WaiterPromotionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const userRole = (currentUser?.role as UserRole) || 'user';

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'waiter') return;
    setLoading(true);
    fetch('/api/rewards')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRewards(data.data.filter((r: Reward) => r.is_active));
          setError(null);
        } else {
          setError('Failed to fetch promotions');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch promotions');
        setLoading(false);
      });
  }, [userRole]);

  if (userRole !== 'waiter') {
    return <div className="p-6 text-red-600 font-semibold">Not authorized to view this page.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Active Promotions</h1>
      {loading ? (
        <div className="text-gray-500">Loading promotions...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : rewards.length === 0 ? (
        <div className="text-gray-500">No active promotions found.</div>
      ) : (
        <div className="space-y-4">
          {rewards.map(reward => (
            <Card key={reward.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift size={18} className="mr-2 text-primary-600" />
                  {reward.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 mb-2">{reward.description}</div>
                <div className="text-primary-700 font-semibold">{reward.points_cost} pts</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaiterPromotionsPage; 