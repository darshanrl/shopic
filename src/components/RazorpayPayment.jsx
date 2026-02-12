import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, AlertCircle } from 'lucide-react';

export default function RazorpayPayment({ contestTitle, entryFee, userEmail, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug: Check if component is rendering
  console.log('RazorpayPayment component rendered with:', { contestTitle, entryFee, userEmail });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order on your backend (you'll need to create this endpoint)
      const orderResponse = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: entryFee * 100, // Convert to paise (₹1 = 100 paise)
          currency: 'INR',
          receipt: `contest_${contestTitle}_${Date.now()}`,
          notes: {
            contestTitle,
            userEmail,
            entryFee
          }
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const order = await orderResponse.json();

      // Initialize Razorpay
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const options = {
        key: 'rzp_test_SEvmD2z6OF8UYh', // Replace with your Razorpay key
        amount: order.amount,
        currency: order.currency,
        name: 'ShoPic Contest Entry',
        description: `Payment for ${contestTitle}`,
        image: '/logo.png', // Your app logo
        order_id: order.id,
        handler: async function (response) {
          // Payment successful
          try {
            const verifyResponse = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                contestTitle,
                userEmail,
                entryFee
              })
            });

            if (verifyResponse.ok) {
              onPaymentSuccess(response);
            } else {
              setError('Payment verification failed');
            }
          } catch (err) {
            setError('Payment verification failed');
          }
          setLoading(false);
        },
        prefill: {
          name: userEmail,
          email: userEmail,
        },
        theme: {
          color: '#7c3aed', // Purple to match your theme
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay with Razorpay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <h4 className="text-purple-300 font-medium mb-2">💳 Secure Payment</h4>
          <p className="text-purple-200 text-sm mb-4">
            Pay ₹{entryFee} securely with Razorpay to enter "{contestTitle}"
          </p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-4">
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pay ₹{entryFee}
              </div>
            )}
          </Button>
        </div>

        <div className="text-center text-slate-400 text-sm">
          <p>Your payment is secure and encrypted.</p>
          <p>After successful payment, your entry will be confirmed immediately.</p>
        </div>
      </CardContent>
    </Card>
  );
}
