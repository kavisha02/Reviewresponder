-- Create user_subscriptions table to track Stripe subscription status and plan tiers
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'elite'
  status TEXT, -- 'active', 'canceled', 'past_due', etc.
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Restrict inserts/updates to service role (from webhook)
-- Users shouldn't be able to manually upgrade themselves!

-- Create user_credits table to track review syncing usage
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (user_id = auth.uid());

-- Restrict inserts/updates to service role

-- Create a trigger to automatically create a user_credits and user_subscriptions row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id)
  VALUES (new.id, 'free');
  
  INSERT INTO public.user_credits (user_id, total_credits, used_credits)
  VALUES (new.id, 50, 0); -- Give 50 free credits to start
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors on multiple runs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;
