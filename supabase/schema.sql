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
  currency TEXT DEFAULT NULL,
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

-- Feedback table for user reviews/testimonials
CREATE TABLE IF NOT EXISTS public.feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  product_id INTEGER,
  product_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email campaigns tracking table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  product_type TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT,
  recipient_emails TEXT[] NOT NULL DEFAULT '{}',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  audience TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions table for makeup events, reschedulings, and free invites
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  product_id INTEGER,
  product_type TEXT NOT NULL,
  for_gender TEXT NOT NULL DEFAULT 'female' CHECK (for_gender IN ('male', 'female', 'both')),
  discount_percent INTEGER NOT NULL DEFAULT 100 CHECK (discount_percent >= 1 AND discount_percent <= 100),
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Redemption uses tracking table
CREATE TABLE IF NOT EXISTS public.redemption_uses (
  id SERIAL PRIMARY KEY,
  redemption_id UUID NOT NULL REFERENCES public.redemptions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  checkout_id INTEGER REFERENCES public.checkout(checkout_id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_product ON public.redemptions(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_redemptions_expires_at ON public.redemptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_redemption_uses_redemption_id ON public.redemption_uses(redemption_id);
CREATE INDEX IF NOT EXISTS idx_redemption_uses_email ON public.redemption_uses(email);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_product ON public.email_campaigns(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template ON public.email_campaigns(template);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON public.email_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
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

-- Messages table for user-to-user messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_to_user ON public.messages(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON public.messages(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(
  LEAST(from_user_id, to_user_id),
  GREATEST(from_user_id, to_user_id),
  created_at DESC
);

-- Analytics events table (redundancy for PostHog)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  url TEXT,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);

-- Support messages table (conversation within a ticket)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

-- AI photo submissions table (user uploads training photos for AI photo generation)
CREATE TABLE IF NOT EXISTS public.ai_photo_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  photos JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_photo_submissions_user ON public.ai_photo_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_photo_submissions_status ON public.ai_photo_submissions(status);

-- AI photo generations table (stores every generated photo output)
CREATE TABLE IF NOT EXISTS public.ai_photo_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_image_urls JSONB NOT NULL DEFAULT '[]',
  prompt TEXT,
  reference_image_url TEXT,
  output_url TEXT,
  result JSONB,
  is_free BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_photo_generations_user ON public.ai_photo_generations(user_id);

