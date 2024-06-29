import { APIContracts } from 'authorizenet';

export const createMerchantAuthenticationType = () => {
  const merchantAuthenticationType =
    new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(
    process.env.VEGAS_AUTHORIZE_NET_API_LOGIN_KEY ?? ''
  );
  merchantAuthenticationType.setTransactionKey(
    process.env.VEGAS_AUTHORIZE_NET_TRANSACTION_KEY ?? ''
  );

  return merchantAuthenticationType;
};
export const createMerchantAuthenticationTypeTest = () => {
  const merchantAuthenticationType =
    new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(
    process.env.NEXT_PUBLIC_SANDBOX_AUTHORIZE_NET_API_LOGIN_KEY ?? ''
  );
  merchantAuthenticationType.setTransactionKey(
    process.env.NEXT_PUBLIC_SANDBOX_AUTHORIZE_NET_TRANSACTION_KEY ?? ''
  );

  return merchantAuthenticationType;
};
