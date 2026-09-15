import { createClient } from '@supabase/supabase-js';
import { initiateJazzCashPayment } from '../../../../utils/jazzcashClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, amountInPKR, mobileNumber, payer_name = 'Player' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User authentication required' });
  }

  const numAmount = parseFloat(amountInPKR);
  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between 10.00 and 50,000.00 PKR' });
  }

  if (!mobileNumber) {
    return res.status(400).json({ error: 'JazzCash Mobile Account number is required (03xxxxxxxxx)' });
  }

  try {
    // 1. Fetch current exchange rate and settings
    const { data: settings } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('id', 1)
      .single();

    const pkrRate = settings?.pkr_rate ? parseFloat(settings.pkr_rate) : 1.0;
    const inGameAmount = parseFloat((numAmount * pkrRate).toFixed(2));

    const merchantId = settings?.jazzcash_merchant_id || process.env.JAZZCASH_MERCHANT_ID || '74584985';
    const password = settings?.jazzcash_password || process.env.JAZZCASH_PASSWORD || 'qo38057jbm';
    const integritySalt = settings?.jazzcash_integrity_salt || process.env.JAZZCASH_INTEGRITY_SALT || 'z35f76uo0m';

    const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://winxpro.com');
    const returnUrl = `${host}/api/payments/jazzcash/callback`;

    // 2. Call JazzCash MWallet REST API v1.1
    const result = await initiateJazzCashPayment({
      amountInPKR: numAmount,
      mobileNumber,
      description: `WinX Pro Wallet Deposit: Pi ${inGameAmount}`,
      returnUrl,
      merchantId,
      password,
      integritySalt
    });

    const txnRefNo = result.txnRefNo;

    // 3. Insert transaction record
    const { data: txRecord, error: dbErr } = await supabase.from('transactions').insert({
      user_id,
      type: 'deposit',
      amount: inGameAmount,
      status: result.success ? 'completed' : 'pending',
      method: 'JazzCash Direct (MWallet)',
      tx_id: txnRefNo,
      notes: `JazzCash Direct Deposit: PKR ${numAmount.toFixed(2)} (Pi ${inGameAmount}) | Ref: ${txnRefNo} | Phone: ${mobileNumber} | Code: ${result.responseCode} - ${result.responseMessage}`
    }).select().single();

    // 4. If transaction was instantly successful, credit wallet
    if (result.success) {
      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user_id).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: wallet.balance + inGameAmount }).eq('user_id', user_id);
      } else {
        await supabase.from('wallets').insert({ user_id, balance: inGameAmount });
      }
    }

    return res.status(200).json({
      success: result.success,
      isPending: result.isPending || !result.success,
      responseCode: result.responseCode,
      responseMessage: result.responseMessage,
      txnRefNo,
      inGameAmount,
      credited: result.success
    });

  } catch (err) {
    console.error('JazzCash initiate error:', err);
    return res.status(500).json({ error: err.message || 'JazzCash transaction initiation failed' });
  }
}
