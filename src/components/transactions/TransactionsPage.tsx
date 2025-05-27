import React, { useState } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { 
  ShoppingBag, 
  Gift, 
  Clock, 
  Search, 
  FilterX,
  Calendar,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Transaction } from '../../types';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const TransactionsPage: React.FC = () => {
  const { userTransactions } = useLoyalty();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'purchase' | 'redemption'>('all');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Filter and sort transactions
  const filteredTransactions = userTransactions
    .filter(transaction => {
      // Filter by type
      if (filter !== 'all' && transaction.type !== filter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return (
          <Badge variant="success" className="flex items-center">
            <ShoppingBag size={12} className="mr-1" />
            Purchase
          </Badge>
        );
      case 'redemption':
        return (
          <Badge variant="warning" className="flex items-center">
            <Gift size={12} className="mr-1" />
            Redemption
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="flex items-center">
            <Clock size={12} className="mr-1" />
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-1">View and filter your transaction history</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Transactions</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} />}
                className="w-full sm:w-60"
                rightIcon={
                  searchTerm ? (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FilterX size={16} />
                    </button>
                  ) : undefined
                }
              />
              
              <div className="flex gap-2">
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    className={`px-3 py-1 text-sm transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 text-sm flex items-center transition-colors ${filter === 'purchase' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setFilter('purchase')}
                  >
                    <ShoppingBag size={14} className="mr-1" />
                    Purchases
                  </button>
                  <button
                    className={`px-3 py-1 text-sm flex items-center transition-colors ${filter === 'redemption' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setFilter('redemption')}
                  >
                    <Gift size={14} className="mr-1" />
                    Redemptions
                  </button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                >
                  <Calendar size={14} />
                  {sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-gray-400" />
                          {formatDate(transaction.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4">
                        {getTransactionTypeLabel(transaction.type)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {transaction.amount > 0 
                          ? formatCurrency(transaction.amount) 
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {transaction.type === 'purchase' && transaction.pointsEarned && (
                          <span className="text-green-600">+{transaction.pointsEarned}</span>
                        )}
                        {transaction.type === 'redemption' && transaction.pointsSpent && (
                          <span className="text-amber-600">-{transaction.pointsSpent}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || filter !== 'all' 
                  ? 'Try changing your search or filters' 
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;