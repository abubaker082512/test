import crypto from 'crypto';

/**
 * DirectPay API Helper
 * Reference: DirectPay Payment Landing Page API (Payin PWA) v1.0
 */

export function generateDirectPayChecksum(clientTransactionId, description, amountInPaisas, clientSecret) {
  const plainText = `DirectPay:${clientTransactionId}:${description}:${amountInPaisas}`;
  return crypto
    .createHmac('sha256', clientSecret)
    .update(plainText)
    .digest('hex');
}

export function buildDirectPayUrl({
  clientId,
  clientSecret,
  clientTransactionId,
  amountInPKR,
  description = 'Wallet Deposit',
  payerName,
  email,
  msisdn,
  currency = 'PKR',
  successRedirectUrl,
  failedRedirectUrl,
  baseUrl = 'https://payin-pwa.directpay.pro/pay'
}) {
  // Validate phone format: 11 digits starting with 03
  const cleanPhone = (msisdn || '').replace(/[^0-9]/g, '');
  if (!/^03\d{9}$/.test(cleanPhone)) {
    throw new Error('Invalid mobile number format. Must be 11 digits starting with 03 (e.g., 03001234567).');
  }

  // Convert PKR amount to paisas (1 PKR = 100 paisas)
  const amountInPaisas = Math.round(Number(amountInPKR) * 100).toString();

  // Validate amount limits (1000 to 5000000 paisas -> 10.00 to 50000.00 PKR)
  const paisasNum = parseInt(amountInPaisas, 10);
  if (isNaN(paisasNum) || paisasNum < 1000 || paisasNum > 5000000) {
    throw new Error('Amount must be between 10.00 and 50,000.00 PKR');
  }

  // Clean description (max 500 chars, no special characters)
  const cleanDescription = (description || 'Wallet Deposit')
    .replace(/[<>{}[]|~!@#$%^&*()_+=-`]/g, '')
    .substring(0, 500);

  // Generate HMAC-SHA256 checksum
  const checksum = generateDirectPayChecksum(clientTransactionId, cleanDescription, amountInPaisas, clientSecret);

  // Build the target payment URL
  const url = new URL(baseUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_transaction_id', clientTransactionId);
  url.searchParams.set('amount', amountInPaisas);
  url.searchParams.set('description', cleanDescription);
  url.searchParams.set('payer_name', (payerName || 'Player').trim());
  url.searchParams.set('email', (email || 'player@betpk.com').trim());
  url.searchParams.set('msisdn', cleanPhone);
  url.searchParams.set('checksum', checksum);
  url.searchParams.set('currency', currency);

  if (successRedirectUrl) {
    url.searchParams.set('success_redirect_url', successRedirectUrl);
  }
  if (failedRedirectUrl) {
    url.searchParams.set('failed_redirect_url', failedRedirectUrl);
  }

  return url.toString();
}
