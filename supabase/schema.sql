-- Schema setup for BetPK Clone on Supabase PostgreSQL

-- 1. Create a table for wallets linked to Supabase Auth users
CREATE TABLE public.wallets (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'PHP' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) for wallets: Users can only read their own wallet
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Trigger to automatically create a wallet when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create game_sessions table
CREATE TABLE public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  bet_amount DECIMAL(12, 2) NOT NULL,
  payout DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  status TEXT NOT NULL, -- 'active', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update on game_sessions should only be allowed via secure API routes (Service Role), so no RLS policy for insert/update for anon users.

-- 3. Create real-time table for Crash game state
CREATE TABLE public.crash_state (
  id INT PRIMARY KEY,
  status TEXT NOT NULL, -- 'waiting', 'running', 'crashed'
  multiplier DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the initial singleton row
INSERT INTO public.crash_state (id, status, multiplier) VALUES (1, 'waiting', 1.00);

-- Enable realtime for Crash State
ALTER PUBLICATION supabase_realtime ADD TABLE public.crash_state;
