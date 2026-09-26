const CLIENT_ID = 'pwa_ci_k1qlq54hv4gw5pr0khux';
const CLIENT_SECRET = 'pwa_secret_zp5rai8z02zr3o5sebm1co6uxci58uca';
const TXN_ID = 'TXN-1790372662821-5KVGZ';

async function testStatus() {
  const urls = [
    `https://payin-pwa.directpay.pro/pay/status?client_id=${CLIENT_ID}&client_transaction_id=${TXN_ID}`,
    `https://payin-pwa.directpay.pro/api/status?client_id=${CLIENT_ID}&client_transaction_id=${TXN_ID}`,
    `https://payin-pwa.directpay.pro/pay/check?client_id=${CLIENT_ID}&client_transaction_id=${TXN_ID}`,
    `https://payin-pwa.directpay.pro/api/pay/status?client_id=${CLIENT_ID}&client_transaction_id=${TXN_ID}`,
    `https://payin-pwa.directpay.pro/pay/status/${TXN_ID}?client_id=${CLIENT_ID}`,
    `https://payin-pwa.directpay.pro/status?client_id=${CLIENT_ID}&client_transaction_id=${TXN_ID}`
  ];

  for (const url of urls) {
    try {
      console.log('Testing URL:', url);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      console.log('Status:', res.status, res.headers.get('content-type'));
      const text = await res.text();
      console.log('Response:', text.substring(0, 300));
    } catch (err) {
      console.error(err.message);
    }
  }
}

testStatus();
