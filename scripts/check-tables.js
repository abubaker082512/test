const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
const https = require('https')

const SUPABASE_URL = 'https://khixzltkmbwfdhtzpcjr.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXh6bHRrbWJ3ZmRodHpwY2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU2OTYxMSwiZXhwIjoyMTAwMTQ1NjExfQ.V4PvAc4uaogq8jzuPB5kx81XLNCSfNBf66yRNOV2qsc'

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'winxpro_salt_2024').digest('hex')
}

async function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec`)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
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
  
  // Try to create tables via Supabase pg_query
  const sql = `
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

-- Insert default admin
INSERT INTO public.admin_users (username, password_hash, role, is_active)
VALUES ('admin', '${adminPasswordHash}', 'super_admin', true)
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
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_messages_user_key_idx ON public.support_messages(user_key);
CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages(created_at);

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
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bet_history_user_id_idx ON public.bet_history(user_id);
CREATE INDEX IF NOT EXISTS bet_history_created_at_idx ON public.bet_history(created_at);
  `

  // Try using the supabase client's rpc function
  const { data, error } = await sb.rpc('exec', { query: sql })
  if (error) {
    console.log('RPC exec failed:', error.message)
  } else {
    console.log('SQL executed successfully:', data)
  }

  // Verify tables
  const checks = ['admin_users', 'support_messages', 'bet_history']
  for (const table of checks) {
    const { data: d, error: e } = await sb.from(table).select('*').limit(1)
    if (e) {
      console.log(`Table ${table}: MISSING - ${e.message}`)
    } else {
      console.log(`Table ${table}: EXISTS (${d?.length || 0} rows)`)
    }
  }
}

main().catch(console.error)
