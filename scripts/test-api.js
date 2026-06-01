// Lightweight API smoke tests for local verification
const fetch = (typeof globalThis.fetch === 'function') ? globalThis.fetch : null;
if (!fetch) {
  console.error('Fetch API is not available in this Node environment. Use Node 18+ or install node-fetch.');
  process.exit(1);
}

async function test() {
  const base = 'http://localhost:3000/api/rapid';
  try {
    let r = await fetch(`${base}/getAllProviders`);
    console.log('GET providers ->', r.status);
    console.log(await r.text());

    r = await fetch(`${base}/getAllGamesByProvider?provider=SPRIBE`);
    console.log('GET games by provider ->', r.status);
    console.log(await r.text());

    const payload = {
      username: 'demo_user',
      gameId: 'g1',
      lang: 'en',
      money: 0,
      home_url: 'https://betnex.co',
      platform: 1,
      currency: 'INR'
    };
    r = await fetch(`${base}/getGameUrl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('POST GetGameUrl ->', r.status);
    console.log(await r.text());
  } catch (e) {
    console.error('API test error', e);
  }
}
test();
