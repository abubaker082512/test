const CLIENT_ID = 'pwa_ci_k1qlq54hv4gw5pr0khux';
const CLIENT_SECRET = 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';
const TXN_ID = 'TXN-1790372662821-5KVGZ';

async function testPost() {
  const routes = [
    'https://payin-pwa.directpay.pro/api/verify',
    'https://payin-pwa.directpay.pro/api/inquire',
    'https://payin-pwa.directpay.pro/api/check-status',
    'https://payin-pwa.directpay.pro/api/payment-status',
    'https://payin-pwa.directpay.pro/api/pay',
    'https://payin-pwa.directpay.pro/api/transaction',
    'https://payin-pwa.directpay.pro/api/transactions'
  ];

  for (const url of routes) {
    try {
      console.log('Testing POST:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, client_transaction_id: TXN_ID })
      });
      console.log('Status:', res.status, res.headers.get('content-type'));
      const text = await res.text();
      console.log('Response:', text.substring(0, 300));
    } catch (err) {
      console.error(err.message);
    }
  }
}

testPost();
