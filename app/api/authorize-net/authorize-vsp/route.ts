// app/api/authorize-net/authorize-vsp/route.ts
// Authorize.Net API Route Handler (VSP Integration)
// This route provides endpoints for:
// - Fetching unsettled transactions
// - Fetching settled batch lists and transaction details
// - Creating customer profiles from existing transactions
// - Charging saved customer profiles
// - Fetching individual transaction details
// All communication is via Authorize.Net XML API using Axios
// No credit card data is processed — fully PCI compliant

import { NextRequest, NextResponse } from 'next/server';
import { APIContracts } from 'authorizenet';
import axios from 'axios';
import { createMerchantAuthenticationType } from '../helpers/vegas-vsp-create-merchant-authentication-type';

// Force dynamic rendering and disable all caching — critical for real-time transaction data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isSettled = searchParams.get('isSettled');
  const first_date = searchParams.get('first_date');
  const last_date = searchParams.get('last_date');
  const transactionId = searchParams.get('transactionId');
  const chargeAmt = searchParams.get('chargeAmt');
  const invoiceNumber = searchParams.get('invoiceNumber');
  const fetchByTransId = searchParams.get('fetchByTransId');

  // Prevent browser/proxy caching of sensitive financial data
  const headersList = new Headers();
  headersList.append('Cache-Control', 'no-cache, no-store, must-revalidate');
  headersList.append('Pragma', 'no-cache');
  headersList.append('Expires', '0');

  // Fetch single transaction details by transaction ID
  if (fetchByTransId) {
    try {
      const transactionDetails = await getTrasactionDetails(transactionId!);
      if (transactionDetails) {
        return NextResponse.json({
          message: 'Successfully fetched transaction details',
          transactionDetails
        });
      }
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction details' },
        { status: 500 }
      );
    }
  }

  try {
    // Handle settled (batched) transactions — historical reporting
    if (isSettled === 'true') {
      if (!first_date || !last_date) {
        return NextResponse.json(
          { message: 'Missing dates' },
          { status: 400 }
        );
      }

      const settledBatches = await getSettledBatchList(first_date, last_date);
      const batchIds = settledBatches.map((batch: any) => batch.batchId);

      if (batchIds.length > 0) {
        const all_transactions = await Promise.all(
          batchIds.map(getTransactionList)
        );
        return NextResponse.json({ all_transactions });
      }
      return NextResponse.json({ all_transactions: [] });
    } else {
      // Handle unsettled transactions or charge operations
      if (chargeAmt && transactionId) {
        const transactionDetails = await createCustomerProfileFromTransaction(transactionId);
        const profileId = transactionDetails.customerProfileId;
        const paymentProfileId =
          transactionDetails.customerPaymentProfileIdList.numericString[0].valueOf();

        const chargeResponse = await chargeCustomerProfile(
          profileId,
          paymentProfileId,
          chargeAmt,
          invoiceNumber!
        );
        return NextResponse.json({
          message: 'Successfully charged profile',
          chargeResponse
        });
      }

      // Default: fetch unsettled (pending) transactions
      if (!transactionId) {
        const transactions = await getUnsettledTransactionList();
        return NextResponse.json({ transactions }, { headers: headersList });
      }
    }
  } catch (error) {
    console.error('Route Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error' },
      { headers: headersList, status: 500 }
    );
  }
}

// Fetch unsettled (pending) transactions from Authorize.Net
async function getUnsettledTransactionList() {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetUnsettledTransactionListRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetUnsettledTransactionListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactions?.transaction || [];
  } else {
    const messages = apiResponse.getMessages();
    const messageArray = messages.getMessage() || [];
    const errorText = messageArray.map((m: any) => `${m.getCode()}: ${m.getText()}`).join('; ');
    throw new Error(errorText || 'Unknown Authorize.Net error');
  }
}

// Create a customer profile from an existing transaction (for future charges)
async function createCustomerProfileFromTransaction(transactionId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const createRequest = new APIContracts.CreateCustomerProfileFromTransactionRequest();
  createRequest.setTransId(transactionId);
  createRequest.setMerchantAuthentication(merchantAuthenticationType);

  // Generate random merchant customer ID
  const randomId = 'CUST_' + Math.random().toString(36).substr(2, 9);
  const customerProfile = new APIContracts.CustomerProfileBaseType();
  customerProfile.setMerchantCustomerId(randomId);
  createRequest.setCustomer(customerProfile);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    createRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.CreateCustomerProfileResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse;
  } else {
    const messageArray = apiResponse.getMessages().getMessage() || [];
    const errorText = messageArray.map((m: any) => `${m.getCode()}: ${m.getText()}`).join('; ');
    throw new Error(errorText || 'Failed to create customer profile');
  }
}

// Charge a saved customer profile
async function chargeCustomerProfile(
  customerProfileId: string,
  customerPaymentProfileId: string,
  amount: string,
  invoiceNumber: string
) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);

  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequestType.setAmount(amount);

  const profile = new APIContracts.CustomerProfilePaymentType();
  profile.setCustomerProfileId(customerProfileId);
  profile.setPaymentProfile(
    new APIContracts.PaymentProfile({ paymentProfileId: customerPaymentProfileId })
  );
  transactionRequestType.setProfile(profile);

  createRequest.setTransactionRequest(transactionRequestType);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    createRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.CreateTransactionResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactionResponse;
  } else {
    const messageArray = apiResponse.getMessages().getMessage() || [];
    const errorText = messageArray.map((m: any) => `${m.getCode()}: ${m.getText()}`).join('; ');
    throw new Error(errorText || 'Failed to charge profile');
  }
}

// Fetch details for a single transaction
async function getTrasactionDetails(transactionId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetTransactionDetailsRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setTransId(transactionId);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetTransactionDetailsResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transaction;
  }
  return null;
}

// Fetch settled batch list for date range
async function getSettledBatchList(first: string, last: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetSettledBatchListRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setFirstSettlementDate(new Date(first));
  getRequest.setLastSettlementDate(new Date(last));

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetSettledBatchListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.batchList?.batch || [];
  } else {
    const messageArray = apiResponse.getMessages().getMessage() || [];
    const errorText = messageArray.map((m: any) => `${m.getCode()}: ${m.getText()}`).join('; ');
    throw new Error(errorText || 'Failed to fetch settled batches');
  }
}

// Fetch transaction list for a specific batch
async function getTransactionList(batchId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetTransactionListRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setBatchId(batchId);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetTransactionListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactions?.transaction || [];
  } else {
    const messageArray = apiResponse.getMessages().getMessage() || [];
    const errorText = messageArray.map((m: any) => `${m.getCode()}: ${m.getText()}`).join('; ');
    throw new Error(errorText || 'Failed to fetch transaction list');
  }
}