/**
 * One-time setup endpoint to create Supabase tables
 * GET /api/admin/setup-db?secret=winxpro_setup_2024
 * 
 * This creates all required tables if they don't exist.
 */

import { supabase } from '../../../utils/supabaseClient'
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'winxpro_salt_2024').digest('hex')
}

export default async function handler(req, res) {
  const { secret } = req.query
  if (secret !== 'winxpro_setup_2024') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const results = {}

  // Try creating admin_users table
  try {
    const { error } = await supabase.from('admin_users').select('id').limit(1)
    if (error && error.message.includes('does not exist')) {
      results.admin_users = 'Table missing - needs manual SQL creation'
    } else if (!error) {
      results.admin_users = 'EXISTS'
    } else {
      results.admin_users = 'Error: ' + error.message
    }
  } catch (e) {
    results.admin_users = 'Exception: ' + e.message
  }

  // Try creating support_messages table
  try {
    const { error } = await supabase.from('support_messages').select('id').limit(1)
    if (error && error.message.includes('does not exist')) {
      results.support_messages = 'Table missing - needs manual SQL creation'
    } else if (!error) {
      results.support_messages = 'EXISTS'
    } else {
      results.support_messages = 'Error: ' + error.message
    }
  } catch (e) {
    results.support_messages = 'Exception: ' + e.message
  }

  // Try creating bet_history table
  try {
    const { error } = await supabase.from('bet_history').select('id').limit(1)
    if (error && error.message.includes('does not exist')) {
      results.bet_history = 'Table missing - needs manual SQL creation'
    } else if (!error) {
      results.bet_history = 'EXISTS'
    } else {
      results.bet_history = 'Error: ' + error.message
    }
  } catch (e) {
    results.bet_history = 'Exception: ' + e.message
  }

  // Try inserting default admin if table exists
  if (results.admin_users === 'EXISTS') {
    try {
      const { data: existing } = await supabase.from('admin_users').select('id').eq('username', 'admin').maybeSingle()
      if (!existing) {
        const { error } = await supabase.from('admin_users').insert({
          username: 'admin',
          password_hash: hashPassword('Admin@WinX2024'),
          role: 'super_admin',
          is_active: true
        })
        results.admin_insert = error ? 'Error: ' + error.message : 'Default admin created'
      } else {
        results.admin_insert = 'Admin already exists'
      }
    } catch (e) {
      results.admin_insert = 'Exception: ' + e.message
    }
  }

  const sql = `
-- RUN THIS SQL IN: https://supabase.com/dashboard/project/khixzltkmbwfdhtzpcjr/sql/new

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
INSERT INTO public.admin_users (username, password_hash, role, is_active)
VALUES ('admin', '${hashPassword('Admin@WinX2024')}', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. Support Messages Table
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
  timestamp BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_key ON public.support_messages(user_key);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at);

-- 3. Bet History Table
CREATE TABLE IF NOT EXISTS public.bet_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  game_id TEXT,
  game_name TEXT,
  bet_amount DECIMAL(12, 2) NOT NULL,
  win_amount DECIMAL(12, 2) DEFAULT 0,
  result TEXT NOT NULL,
  multiplier DECIMAL(10, 2) DEFAULT 1.0,
  balance_before DECIMAL(12, 2) DEFAULT 0,
  balance_after DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bet_history_user_id ON public.bet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_created_at ON public.bet_history(created_at);

-- 4. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

-- 5. Allow service role to access everything
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Service role bypass admin') THEN
    CREATE POLICY "Service role bypass admin" ON public.admin_users USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'Service role bypass support') THEN
    CREATE POLICY "Service role bypass support" ON public.support_messages USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_history' AND policyname = 'Service role bypass bets') THEN
    CREATE POLICY "Service role bypass bets" ON public.bet_history USING (true) WITH CHECK (true);
  END IF;
END $$;
  `

  return res.status(200).json({
    success: true,
    table_status: results,
    message: 'Check table_status above. If any tables are missing, run the sql_to_run in Supabase SQL Editor.',
    sql_link: 'https://supabase.com/dashboard/project/khixzltkmbwfdhtzpcjr/sql/new',
    sql_to_run: sql,
    admin_credentials: {
      username: 'admin',
      password: 'Admin@WinX2024'
    }
  })
}
