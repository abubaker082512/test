const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const SUPABASE_URL = 'https://khixzltkmbwfdhtzpcjr.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXh6bHRrbWJ3ZmRodHpwY2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU2OTYxMSwiZXhwIjoyMTAwMTQ1NjExfQ.V4PvAc4uaogq8jzuPB5kx81XLNCSfNBf66yRNOV2qsc'

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'winxpro_salt_2024').digest('hex')
}

async function main() {
  console.log('Setting up Supabase tables for WinX Pro...')

  // Create admin_users table
  const adminTableSQL = `
    CREATE TABLE IF NOT EXISTS public.admin_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'super_admin',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  // Create support_messages table (persistent chat)
  const supportMsgSQL = `
    CREATE TABLE IF NOT EXISTS public.support_messages (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      user_email TEXT,
      user_name TEXT,
      sender TEXT NOT NULL,
      text TEXT,
      image TEXT,
      audio TEXT,
      audio_duration INTEGER DEFAULT 0,
      admin_name TEXT,
      timestamp BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS support_messages_user_key_idx ON public.support_messages(user_key);
    CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages(created_at);
  `

  // Create bet_history table
  const betHistorySQL = `
    CREATE TABLE IF NOT EXISTS public.bet_history (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      user_email TEXT,
      game_id TEXT,
      game_name TEXT,
      bet_amount DECIMAL(12, 2) NOT NULL,
      win_amount DECIMAL(12, 2) DEFAULT 0,
      result TEXT NOT NULL,
      multiplier DECIMAL(10, 2) DEFAULT 1.0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS bet_history_user_id_idx ON public.bet_history(user_id);
    CREATE INDEX IF NOT EXISTS bet_history_created_at_idx ON public.bet_history(created_at);
  `

  // Execute via fetch to Supabase REST API (using service role)
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }

  // Try creating tables by inserting to verify they exist first
  // admin_users
  const { data: adminCheck, error: adminErr } = await sb.from('admin_users').select('id').limit(1)
  if (adminErr && adminErr.message.includes('does not exist')) {
    console.log('admin_users table does not exist - will create via raw SQL')
  } else if (!adminErr) {
    console.log('admin_users table already exists')
  }

  // support_messages
  const { data: msgCheck, error: msgErr } = await sb.from('support_messages').select('id').limit(1)
  if (msgErr && msgErr.message.includes('does not exist')) {
    console.log('support_messages table does not exist - will create via raw SQL')
  } else if (!msgErr) {
    console.log('support_messages table already exists')
  }

  // bet_history
  const { data: betCheck, error: betErr } = await sb.from('bet_history').select('id').limit(1)
  if (betErr && betErr.message.includes('does not exist')) {
    console.log('bet_history table does not exist - will create via raw SQL')
  } else if (!betErr) {
    console.log('bet_history table already exists')
  }

  // Provide SQL to run in Supabase SQL editor
  console.log('\n========================================')
  console.log('PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE SQL EDITOR:')
  console.log('Go to: https://supabase.com/dashboard/project/khixzltkmbwfdhtzpcjr/sql/new')
  console.log('========================================\n')

  const adminPasswordHash = hashPassword('Admin@WinX2024')
  
  console.log(`-- WinX Pro Complete Database Setup SQL
-- Run this in Supabase SQL Editor

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'super_admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin (username: admin, password: Admin@WinX2024)
INSERT INTO public.admin_users (username, password_hash, role, is_active)
VALUES ('admin', '${adminPasswordHash}', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. Support Messages Table (persistent chat)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  sender TEXT NOT NULL,
  text TEXT,
  image TEXT,
  audio TEXT,
  audio_duration INTEGER DEFAULT 0,
  admin_name TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_messages_user_key_idx ON public.support_messages(user_key);
CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages(created_at);

-- 3. Bet History Table
CREATE TABLE IF NOT EXISTS public.bet_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  game_id TEXT,
  game_name TEXT,
  bet_amount DECIMAL(12, 2) NOT NULL,
  win_amount DECIMAL(12, 2) DEFAULT 0,
  result TEXT NOT NULL,
  multiplier DECIMAL(10, 2) DEFAULT 1.0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bet_history_user_id_idx ON public.bet_history(user_id);
CREATE INDEX IF NOT EXISTS bet_history_created_at_idx ON public.bet_history(created_at);

-- 4. Enable RLS for new tables (service role can bypass RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

-- 5. Add policy so users can view their own bet history
CREATE POLICY IF NOT EXISTS "Users can view own bets" ON public.bet_history
  FOR SELECT USING (auth.uid() = user_id);

-- Done!`)

  console.log('\n========================================')
  console.log('Default Admin Credentials:')
  console.log('Username: admin')
  console.log('Password: Admin@WinX2024')
  console.log('Password Hash:', adminPasswordHash)
  console.log('========================================\n')
}

main().catch(console.error)
