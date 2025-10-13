'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface RazorpayPaymentProps {
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  onSuccess,
  onError,
  onClose
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (loading) return;
    
    setLoading(true);
    toast.loading('Creating payment order...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const orderData = await response.json();
      toast.dismiss();

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ExamIndia Wallet',
        description: 'Wallet Deposit',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            toast.loading('Verifying payment...');
            
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            toast.dismiss();

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }

            const result = await verifyResponse.json();
            toast.success('Payment successful! Wallet updated.');
            onSuccess(result);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
            onError(error);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            toast.dismiss();
            onClose();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.dismiss();
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add Money to Wallet</h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">Amount: ₹{amount}</p>
        <p className="text-sm text-gray-500">
          Secure payment powered by Razorpay
        </p>
      </div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md font-semibold text-white ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>
    </div>
  );
};

export default RazorpayPayment;
