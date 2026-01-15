// app/api/authorize-net/helpers/vegas-create-merchant-authentication-type.ts
// Helper for creating Authorize.Net MerchantAuthenticationType for Vegas account
// Uses your existing env vars — no renaming required
// Adds safety checks to catch missing credentials early (prevents E00006 errors)

import { APIContracts } from 'authorizenet';

/**
 * Creates MerchantAuthenticationType for production Vegas Authorize.Net account
 * Uses VEGAS_AUTHORIZE_NET_API_LOGIN_KEY and VEGAS_AUTHORIZE_NET_TRANSACTION_KEY
 */
export const createMerchantAuthenticationType = () => {
  const loginId = process.env.VEGAS_AUTHORIZE_NET_API_LOGIN_KEY;
  const transactionKey = process.env.VEGAS_AUTHORIZE_NET_TRANSACTION_KEY;

  // Safety check — fail early with clear message if keys are missing
  if (!loginId || !transactionKey) {
    console.error('Vegas Authorize.Net credentials missing!');
    console.error('Required env vars:');
    console.error('  VEGAS_AUTHORIZE_NET_API_LOGIN_KEY =', loginId ? 'present' : 'MISSING');
    console.error('  VEGAS_AUTHORIZE_NET_TRANSACTION_KEY =', transactionKey ? 'present' : 'MISSING');
    throw new Error('Vegas Authorize.Net API credentials not configured in environment');
  }

  const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(loginId);
  merchantAuthenticationType.setTransactionKey(transactionKey);

  return merchantAuthenticationType;
};

/**
 * Creates MerchantAuthenticationType for sandbox/testing (if you use it)
 */
export const createMerchantAuthenticationTypeTest = () => {
  const loginId = process.env.NEXT_PUBLIC_SANDBOX_AUTHORIZE_NET_API_LOGIN_KEY;
  const transactionKey = process.env.NEXT_PUBLIC_SANDBOX_AUTHORIZE_NET_TRANSACTION_KEY;

  if (!loginId || !transactionKey) {
    console.error('Sandbox Authorize.Net credentials missing!');
    throw new Error('Sandbox Authorize.Net API credentials not configured');
  }

  const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(loginId);
  merchantAuthenticationType.setTransactionKey(transactionKey);

  return merchantAuthenticationType;
};