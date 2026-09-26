const CLIENT_ID = 'pwa_ci_k1qlq54hv4gw5pr0khux';
const CLIENT_SECRET = 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';

async function testEndpoints() {
  const endpoints = [
    `https://payin-pwa.directpay.pro/pay/status?client_id=${CLIENT_ID}`,
    `https://payin-pwa.directpay.pro/pay/transactions?client_id=${CLIENT_ID}`,
    `https://payin-pwa.directpay.pro/api/v1/transactions?client_id=${CLIENT_ID}`,
    `https://payin-pwa.directpay.pro/api/transactions?client_id=${CLIENT_ID}`,
    `https://portal.directpay.pro/api/transactions?client_id=${CLIENT_ID}`
  ];

  for (const url of endpoints) {
    try {
      console.log('Testing URL:', url);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      console.log('Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response body:', text.substring(0, 300));
    } catch (err) {
      console.error('Err:', err.message);
    }
  }
}

testEndpoints();
