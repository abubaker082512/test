const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const API_URL = process.env.SOFTAGGREGATOR_API_URL || 'https://api.softaggregator.com/api/v1';
const API_LOGIN = process.env.SOFTAGGREGATOR_API_LOGIN || '88006ae8-42e8-49ee-b657-278536dd288b';
const API_PASSWORD = process.env.SOFTAGGREGATOR_API_PASSWORD || 'fdbb58e1dd5cde4bc2924224';

const FEATURED_PROVIDERS = [
  'jili', 'pgsoft', 'spribe', 'pragmaticplay', 'hacksawgaming',
  'nolimitcity', 'playngo', 'kagaming', 'relaxgaming', 'greentube', 'egt', 'netent'
];

function mapGame(g, p) {
  return {
    id: g.id_hash,
    id_hash: g.id_hash,
    name: g.name,
    title: g.name,
    provider: p,
    provider_name: g.provider_name || g.provider,
    game_type: g.game_type || 'slots',
    image: g.image || g.image_portrait || g.image_square || '',
    image_portrait: g.image_portrait || g.image || g.image_square || '',
    image_square: g.image_square || g.image || g.image_portrait || ''
  };
}

async function run() {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_login: API_LOGIN, api_password: API_PASSWORD, method: 'getGameList' })
  });
  const data = await res.json();
  const liveGames = data.response;

  // Print live hashes for key aliases
  const lookupNames = ['aviator', 'super ace', 'super ace deluxe', 'fortune gems', 'fortune gems 2', 'fortune gems 3', 'mahjong ways', 'mahjong ways 2', 'gates of olympus', 'fortune tiger', 'fortune rabbit', 'fortune ox'];
  console.log('--- LIVE ALIAS HASHES ---');
  for (const target of lookupNames) {
    const exact = liveGames.find(g => String(g.name || '').toLowerCase() === target)
      || liveGames.find(g => String(g.name || '').toLowerCase().includes(target));
    if (exact) console.log(`${target}: ${exact.id_hash} (${exact.name} - ${exact.provider})`);
  }

  const byProvider = {};
  for (const p of FEATURED_PROVIDERS) byProvider[p] = [];

  for (const g of liveGames) {
    const p = String(g.provider || 'other').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (byProvider[p] && byProvider[p].length < 48) {
      byProvider[p].push(mapGame(g, p));
    }
  }

  const hotKeywords = [
    'aviator', 'super ace', 'fortune gems', 'money coming', 'mahjong ways',
    'gates of olympus', 'sweet bonanza', 'fortune tiger', 'fortune rabbit',
    'fortune ox', 'boxing king', 'golden empire', 'mines', 'plinko',
    'sugar rush', 'big bass', 'book of dead', 'starlight princess'
  ];
  const hots = [];
  const hotSeen = new Set();
  for (const kw of hotKeywords) {
    for (const g of liveGames) {
      if (hots.length >= 24) break;
      const n = String(g.name || '').toLowerCase();
      if (n.includes(kw) && !hotSeen.has(g.id_hash)) {
        hotSeen.add(g.id_hash);
        const p = String(g.provider || 'other').toLowerCase().replace(/[^a-z0-9]/g, '');
        hots.push(mapGame(g, p));
      }
    }
  }

  const catalog = {
    updated_at: new Date().toISOString(),
    total_live_games: liveGames.length,
    hots,
    ...byProvider
  };

  const outPath = path.join(process.cwd(), 'data', 'softaggregator_catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n✅ Saved lean 100%-live catalog (${sizeKb} KB) across ${FEATURED_PROVIDERS.length} featured providers + ${hots.length} Hots.`);
}

run().catch(e => { console.error(e); process.exit(1); });
