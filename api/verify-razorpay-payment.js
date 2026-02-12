import { supabase } from '../../lib/supabase';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      contestTitle,
      userEmail,
      entryFee
    } = await req.json();

    // Verify payment signature using Node.js crypto
    const crypto = require('crypto');
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Store payment record
    const paymentData = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      contest_title: contestTitle,
      user_email: userEmail,
      amount: entryFee,
      status: 'verified',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('payments')
      .insert(paymentData);

    if (error) {
      console.error('Payment storage error:', error);
      throw new Error('Failed to store payment');
    }

    return new Response(JSON.stringify({ 
      success: true,
      payment_id: razorpay_payment_id 
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Payment verification failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
