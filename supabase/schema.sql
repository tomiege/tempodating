-- Supabase Database Schema for Tempo Dating App
-- Using service role for all backend API access (no RLS needed)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INTEGER,
  city TEXT,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  contact_info TEXT,
  is_male BOOLEAN,
  personality_quiz_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Checkout table
CREATE TABLE IF NOT EXISTS public.checkout (
  checkout_id SERIAL PRIMARY KEY,
  checkout_session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  age INTEGER,
  is_male BOOLEAN,
  city TEXT,
  country TEXT,
  product_id INTEGER,
  product_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Matches table for speed dating events
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'onlineSpeedDating',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, liked_user_id, product_id)
);

-- Event invitations table
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0 AND discount_amount <= 100),
  product_id INTEGER NOT NULL,
  product_type TEXT NOT NULL,
  discount_code TEXT,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table for event check-ins
CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  attendee_name TEXT NOT NULL,
  preferred_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age >= 16 AND age <= 100),
  product_id TEXT NOT NULL,
  site_name TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkout_session_id ON public.checkout(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_email ON public.checkout(email);
CREATE INDEX IF NOT EXISTS idx_checkout_user_id ON public.checkout(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_product ON public.checkout(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_liked_user_id ON public.matches(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_product ON public.matches(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_event_invitations_to_email ON public.event_invitations(to_email);
CREATE INDEX IF NOT EXISTS idx_event_invitations_from_user_id ON public.event_invitations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_product ON public.event_invitations(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_attendance_product_id ON public.attendance(product_id);
CREATE INDEX IF NOT EXISTS idx_attendance_site_name ON public.attendance(site_name);

