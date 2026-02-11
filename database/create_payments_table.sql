-- Create payments table for Razorpay transactions
-- Run this in Supabase SQL Editor

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_signature TEXT NOT NULL,
  contest_title TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view payments" ON public.payments FOR SELECT USING (true);

CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE email = user_email AND id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_payments_user_email ON public.payments(user_email);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
