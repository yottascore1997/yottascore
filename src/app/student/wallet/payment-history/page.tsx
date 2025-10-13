'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface PaymentTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

const PaymentHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchPaymentHistory();
  }, [router]);

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch payment history');
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      toast.error(error.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status.toLowerCase() === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return '💰';
      case 'withdraw':
        return '💸';
      case 'winning':
        return '🏆';
      default:
        return '💳';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading payment history...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'success', 'pending', 'failed'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-md font-medium capitalize ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-md">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No transactions found</p>
            <p className="text-sm">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.description || transaction.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                      {transaction.razorpayPaymentId && (
                        <p className="text-xs text-blue-600">
                          Payment ID: {transaction.razorpayPaymentId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type.toLowerCase() === 'deposit' || 
                      transaction.type.toLowerCase() === 'winning'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type.toLowerCase() === 'deposit' || 
                     transaction.type.toLowerCase() === 'winning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ₹{transactions
                  .filter(t => t.status.toLowerCase() === 'success' && 
                    (t.type.toLowerCase() === 'deposit' || t.type.toLowerCase() === 'winning'))
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Deposits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                ₹{transactions
                  .filter(t => t.status.toLowerCase() === 'success' && t.type.toLowerCase() === 'withdraw')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Withdrawals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => t.status.toLowerCase() === 'success').length}
              </p>
              <p className="text-sm text-gray-600">Successful Transactions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
