const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
const https = require('https')

const SUPABASE_URL = 'https://khixzltkmbwfdhtzpcjr.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXh6bHRrbWJ3ZmRodHpwY2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU2OTYxMSwiZXhwIjoyMTAwMTQ1NjExfQ.V4PvAc4uaogq8jzuPB5kx81XLNCSfNBf66yRNOV2qsc'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'winxpro_salt_2024').digest('hex')
}

// Use supabase-js to insert via raw pg  
// Since we can't run DDL via REST, we'll use Supabase's SQL query endpoint
async function runRawSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const urlObj = new URL(SUPABASE_URL + '/pg')
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const adminPasswordHash = hashPassword('Admin@WinX2024')
  console.log('Admin password hash:', adminPasswordHash)
  
  // Check existing tables
  const { data: tables } = await sb.from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  if (tables) {
    console.log('Existing public tables:', tables.map(t => t.table_name))
  }

  // Try pg endpoint
  const pgResult = await runRawSQL('SELECT current_database()')
  console.log('PG endpoint result:', pgResult)

  // Output the SQL for user to run
  console.log('\n\n========= SQL TO RUN IN SUPABASE SQL EDITOR =========')
  console.log(`https://supabase.com/dashboard/project/khixzltkmbwfdhtzpcjr/sql/new`)
  console.log('\n')
  console.log(`-- WinX Pro Complete Setup
-- Run all of this in the Supabase SQL Editor

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

-- 5. Allow service role to do everything (bypass RLS)
CREATE POLICY IF NOT EXISTS "Service role bypass" ON public.admin_users
  USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role bypass" ON public.support_messages  
  USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role bypass" ON public.bet_history
  USING (true) WITH CHECK (true);
`)
  console.log('\n========= END SQL =========\n')
}

main().catch(console.error)
