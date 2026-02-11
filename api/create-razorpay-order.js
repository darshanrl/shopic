export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { amount, currency, receipt, notes } = await req.json();
    
    // Create Razorpay order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`)}`
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
        payment_capture: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.description || 'Failed to create order');
    }

    const order = await response.json();
    
    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create order' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
