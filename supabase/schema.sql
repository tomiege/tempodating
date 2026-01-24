-- Supabase Database Schema for Tempo Dating App

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Checkout table
CREATE TABLE IF NOT EXISTS public.checkout (
  checkout_id SERIAL PRIMARY KEY,
  checkout_session_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  site_name TEXT NOT NULL,
  total_order DECIMAL(10, 2) NOT NULL,
  customer_id TEXT,
  product_type TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  confirmation_email_sent BOOLEAN DEFAULT false,
  product_description TEXT,
  experiment TEXT,
  checkout_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT,
  phone_number TEXT,
  is_male BOOLEAN,
  query_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for checkout table
CREATE INDEX idx_checkout_session_id ON public.checkout(checkout_session_id);
CREATE INDEX idx_checkout_email ON public.checkout(email);
CREATE INDEX idx_checkout_product ON public.checkout(product_type, product_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Checkout
CREATE POLICY "Users can view their own checkouts"
  ON public.checkout FOR SELECT
  USING (email = auth.email());

CREATE POLICY "Anyone can create a checkout"
  ON public.checkout FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update checkouts"
  ON public.checkout FOR UPDATE
  USING (true);

-- Create a trigger to automatically create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkout_updated_at BEFORE UPDATE ON public.checkout
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
