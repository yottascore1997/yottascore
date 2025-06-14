'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

const WalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isAddingDummyBalance, setIsAddingDummyBalance] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchWalletData();
  }, [router]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      const data: WalletData = await res.json();
      setWalletData(data);
    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      toast.error(error.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (typeof depositAmount !== 'number' || depositAmount <= 0 || isDepositing) return;
    setIsDepositing(true);
    toast.loading('Processing deposit...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: depositAmount }),
      });
      toast.dismiss();
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Deposit failed');
      }
      const result = await res.json();
      toast.success(result.message || 'Deposit successful!');
      setDepositAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast.dismiss();
      console.error('Error during deposit:', error);
      toast.error(error.message || 'An error occurred during deposit.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleAddDummyBalance = async () => {
    if (isAddingDummyBalance) return;
    setIsAddingDummyBalance(true);
    toast.loading('Adding dummy balance...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/wallet/add-dummy-balance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      toast.dismiss();
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add dummy balance');
      }
      const result = await res.json();
      toast.success(result.message || 'Dummy balance added!');
      fetchWalletData();
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding dummy balance:', error);
      toast.error(error.message || 'An error occurred while adding dummy balance.');
    } finally {
      setIsAddingDummyBalance(false);
    }
  };

  const handleWithdraw = async () => {
    if (typeof withdrawAmount !== 'number' || withdrawAmount <= 0 || isWithdrawing || !walletData || walletData.balance < withdrawAmount) return;
    setIsWithdrawing(true);
    toast.loading('Processing withdrawal...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      toast.dismiss();
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Withdrawal failed');
      }
      const result = await res.json();
      toast.success(result.message || 'Withdrawal successful!');
      setWithdrawAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast.dismiss();
      console.error('Error during withdrawal:', error);
      toast.error(error.message || 'An error occurred during withdrawal.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading wallet...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>
      {/* Available Balance */}
      <div className="bg-blue-600 text-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Available Balance</h2>
        <p className="text-3xl font-bold">₹{walletData?.balance.toFixed(2) ?? '0.00'}</p>
      </div>
      {/* Deposit Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Deposit</h2>
        <div className="mb-4">
          <button
            onClick={handleAddDummyBalance}
            disabled={isAddingDummyBalance}
            className={`bg-yellow-500 text-white py-2 px-4 rounded-md font-semibold text-sm w-full ${isAddingDummyBalance ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'}`}
          >
            {isAddingDummyBalance ? 'Adding...' : 'Add Dummy Balance (₹1000)'}
          </button>
        </div>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => {
              const value = e.target.value;
              setDepositAmount(value === '' ? '' : parseFloat(value));
            }}
            className="flex-grow p-2 border rounded-md"
          />
          <button
            onClick={handleDeposit}
            disabled={typeof depositAmount !== 'number' || depositAmount <= 0 || isDepositing}
            className={`bg-green-600 text-white py-2 px-4 rounded-md font-semibold ${typeof depositAmount !== 'number' || depositAmount <= 0 || isDepositing ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
          >
            + Add Cash
          </button>
        </div>
      </div>
      {/* Wallet Sections (Placeholder based on screenshot) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between py-3 border-b last:border-b-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-400 rounded-full mr-3"></div>
            <span className="text-gray-800">Winnings</span>
          </div>
          <span className="text-gray-800 font-semibold">₹0.00</span>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={withdrawAmount}
              onChange={(e) => {
                const value = e.target.value;
                setWithdrawAmount(value === '' ? '' : parseFloat(value));
              }}
              className="w-24 p-1 border rounded-md text-sm"
            />
            <button
              onClick={handleWithdraw}
              disabled={typeof withdrawAmount !== 'number' || withdrawAmount <= 0 || isWithdrawing || !walletData || walletData.balance < withdrawAmount}
              className={`bg-red-600 text-white text-sm py-1 px-3 rounded-md font-semibold ${typeof withdrawAmount !== 'number' || withdrawAmount <= 0 || isWithdrawing || !walletData || walletData.balance < withdrawAmount ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'}`}
            >
              Withdraw
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-b last:border-b-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-800">Real Cash</span>
          </div>
          <span className="text-gray-800 font-semibold">₹0.00</span>
        </div>
      </div>
      {/* Navigation Links (Placeholder based on screenshot) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/student/wallet/transactions')}>
          <span className="text-gray-800">My Transactions</span>
          <span>&gt;</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/student/wallet/kyc')}>
          <span className="text-gray-800">My KYC Details</span>
          <span>&gt;</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/student/wallet/withdraw-history')}>
          <span className="text-gray-800">Withdraw History</span>
          <span>&gt;</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50" onClick={() => router.push('/student/wallet/statement-download')}>
          <span className="text-gray-800">Statement Download</span>
          <span>&gt;</span>
        </div>
      </div>
      {/* Transaction History */}
      {walletData?.transactions && walletData.transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <ul>
            {walletData.transactions.map((transaction) => (
              <li key={transaction.id} className="py-2 border-b last:border-b-0 text-sm text-gray-700">
                Type: {transaction.type}, Amount: ₹{transaction.amount.toFixed(2)}, Status: {transaction.status}, Date: {new Date(transaction.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WalletPage; 