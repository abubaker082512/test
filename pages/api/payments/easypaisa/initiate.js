import { createClient } from '@supabase/supabase-js';
import { buildEasypaisaCheckoutData } from '../../../../utils/easypaisaClient';
import { addTransaction } from '../../../../utils/firebaseDb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    user_id,
    amountInPKR,
    mobileNumber,
    email,
    payment_method = 'MA_PAYMENT_METHOD' // 'MA_PAYMENT_METHOD' | 'CC_PAYMENT_METHOD' | 'OTC_PAYMENT_METHOD'
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  try {
    // 1. Fetch settings
    const { data: settings } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('id', 1)
      .single();

    const pkrRate = settings?.pkr_rate ? parseFloat(settings.pkr_rate) : 1.0;
    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    const storeId = settings?.easypaisa_store_id || process.env.EASYPAISA_STORE_ID || '43';
    const hashKey = settings?.easypaisa_hash_key || process.env.EASYPAISA_HASH_KEY || '1234567890123456';
    const isSandbox = settings?.easypaisa_sandbox || false;

    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');
    const postBackURL = `${host}/api/payments/easypaisa/callback`;

    const orderRefNum = `EP${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    // 2. Build EasyPay Form Payload
    const checkoutData = buildEasypaisaCheckoutData({
      amountInPKR: numAmount,
      orderRefNum,
      postBackURL,
      paymentMethod: payment_method,
      mobileNum: mobileNumber,
      emailAddr: email || 'player@winxpro.com',
      storeId,
      hashKey,
      isSandbox
    });

    // 3. Store pending transaction in Firestore & Supabase (non-blocking)
    try {
      addTransaction({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        notes: `EasyPaisa Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${orderRefNum} | Phone: ${mobileNumber}`,
        metadata: {
          orderRefNum,
          mobileNumber,
          paymentMethod: payment_method
        }
      }).catch(() => {});
    } catch (fErr) {}

    try {
      supabase.from('transactions').insert({
        user_id,
        type: 'deposit',
        amount: inGameAmount,
        status: 'pending',
        method: `EasyPaisa Direct (${payment_method === 'CC_PAYMENT_METHOD' ? 'Card' : 'Mobile Account'})`,
        tx_id: orderRefNum,
        notes: `EasyPaisa Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${orderRefNum} | Phone: ${mobileNumber}`
      }).then(() => {}).catch(() => {});
    } catch (dbErr) {}

    const hasConfiguredStore = Boolean(
      storeId && String(storeId).trim() !== '43' &&
      hashKey && String(hashKey).trim() !== '1234567890123456'
    );

    return res.status(200).json({
      success: true,
      hasConfiguredStore,
      actionUrl: checkoutData.actionUrl,
      fields: checkoutData.fields,
      orderRefNum,
      inGameAmount
    });

  } catch (err) {
    console.error('EasyPaisa initiate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate EasyPaisa transaction' });
  }
}
