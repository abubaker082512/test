import { createClient } from '@supabase/supabase-js';
import { buildDirectPayUrl } from '../../../../utils/directPayClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, amountInPKR, payer_name, email, msisdn, currency = 'PKR', payment_method = 'Easypaisa' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  if (!msisdn) {
    return res.status(400).json({ error: 'Mobile number is required (03xxxxxxxxx)' });
  }

  try {
    // 1. Fetch current exchange rate and DirectPay settings
    const { data: settings } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('id', 1)
      .single();

    const pkrRate = settings?.pkr_rate ? parseFloat(settings.pkr_rate) : 1.0;
    const clientId = settings?.directpay_client_id || process.env.DIRECTPAY_CLIENT_ID || 'pwa_ci_test123';
    const clientSecret = settings?.directpay_client_secret || process.env.DIRECTPAY_CLIENT_SECRET || 'your_secret_key';

    // Calculate in-game Pi points
    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    // 2. Generate unique client transaction ID (max 50 chars, alphanumeric with dashes)
    const clientTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 3. Determine host origin for redirect URLs
    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://test-eight-zeta-88.vercel.app');
    const successRedirectUrl = `${host}/wallet?directpay_status=success&txn_id=${encodeURIComponent(clientTransactionId)}&amount=${encodeURIComponent(inGameAmount)}`;
    const failedRedirectUrl = `${host}/wallet?directpay_status=failed&txn_id=${encodeURIComponent(clientTransactionId)}`;

    // 4. Build the DirectPay URL with Checksum
    const paymentUrl = buildDirectPayUrl({
      clientId,
      clientSecret,
      clientTransactionId,
      amountInPKR: numAmount,
      description: `BetPK Deposit via ${payment_method}: Pi ${inGameAmount}`,
      payerName: payer_name || 'Player',
      email: email || 'player@betpk.com',
      msisdn,
      currency,
      successRedirectUrl,
      failedRedirectUrl
    });

    // 5. Store pending deposit in transactions table
    const { error: dbError } = await supabase.from('transactions').insert({
      user_id,
      type: 'deposit',
      amount: inGameAmount,
      status: 'pending',
      method: `DirectPay (${payment_method})`,
      tx_id: clientTransactionId,
      notes: `DirectPay ${payment_method} Deposit: ${currency} ${numAmount.toFixed(2)} (Converted to Pi ${inGameAmount} at rate 1:${pkrRate}) | Phone: ${msisdn}`
    });

    if (dbError) {
      console.error('Failed to create pending transaction:', dbError);
      return res.status(500).json({ error: 'Database error creating transaction record' });
    }

    return res.status(200).json({
      success: true,
      paymentUrl,
      clientTransactionId,
      inGameAmount,
      currency
    });
  } catch (err) {
    console.error('DirectPay initiation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate DirectPay payment' });
  }
}
