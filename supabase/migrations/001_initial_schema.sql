-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users with additional fields)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Usage history table
CREATE TABLE public.usage_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  input_content TEXT NOT NULL,
  tone TEXT NOT NULL,
  language TEXT NOT NULL,
  outputs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'creator', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  razorpay_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Usage count per month (for tracking limits)
CREATE TABLE public.monthly_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(user_id, year, month)
);

-- Create indexes
CREATE INDEX idx_usage_history_user_id ON public.usage_history(user_id);
CREATE INDEX idx_usage_history_created_at ON public.usage_history(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_monthly_usage_user_id ON public.monthly_usage(user_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for usage_history
CREATE POLICY "Users can view own usage history" 
  ON public.usage_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage history" 
  ON public.usage_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" 
  ON public.subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
  ON public.subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for monthly_usage
CREATE POLICY "Users can view own monthly usage" 
  ON public.monthly_usage FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly usage" 
  ON public.monthly_usage FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly usage" 
  ON public.monthly_usage FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Create default free subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get usage count for current month
CREATE OR REPLACE FUNCTION public.get_current_month_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO v_count
  FROM public.monthly_usage
  WHERE user_id = p_user_id 
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.monthly_usage (user_id, year, month, count)
  VALUES (p_user_id, EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), 1)
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET count = monthly_usage.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
