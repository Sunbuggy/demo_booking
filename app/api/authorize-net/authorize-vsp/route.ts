// app/api/authorize-net/authorize-vsp/route.ts
// Authorize.Net API Route Handler (VSP Integration)
// This route handles multiple Authorize.Net operations:
// - Fetch unsettled transactions
// - Fetch settled batch lists and transaction details
// - Create customer profiles from existing transactions
// - Charge saved customer profiles
// - Fetch individual transaction details
// All communication is with Authorize.Net XML API via Axios
// No credit card data is handled — PCI compliant

import { NextRequest, NextResponse } from 'next/server';
import { APIContracts } from 'authorizenet';
import axios from 'axios';
import { createMerchantAuthenticationType } from '../helpers/vegas-vsp-create-merchant-authentication-type';

// Force dynamic rendering — no caching of responses
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

  // Prevent any caching of sensitive transaction data
  const headersList = new Headers();
  headersList.append('Cache-Control', 'no-cache, no-store, must-revalidate');
  headersList.append('Pragma', 'no-cache');
  headersList.append('Expires', '0');

  // Fetch single transaction details by ID
  if (fetchByTransId) {
    try {
      const transactionDetails = await getTrasactionDetails(transactionId!);
      if (transactionDetails) {
        return NextResponse.json({
          message: 'Successfully fetched transaction details',
          transactionDetails
        });
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch transaction details' },
        { status: 500 }
      );
    }
  }

  try {
    // Handle settled batch requests (historical data)
    if (isSettled === 'true') {
      if (!first_date || !last_date) {
        return NextResponse.json(
          { message: 'Please provide first_date and last_date' },
          { status: 400 }
        );
      }

      if (new Date(first_date) > new Date(last_date)) {
        return NextResponse.json(
          { message: 'first_date should be less than last_date' },
          { status: 400 }
        );
      }

      if (new Date(first_date) > new Date() || new Date(last_date) > new Date()) {
        return NextResponse.json(
          { message: 'first_date and last_date should be less than today' },
          { status: 400 }
        );
      }

      if (
        new Date(last_date).getTime() - new Date(first_date).getTime() >
        30 * 24 * 60 * 60 * 1000
      ) {
        return NextResponse.json(
          { message: 'first_date and last_date should be less than 30 days' },
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
    } else {
      // Handle unsettled transactions or saved profile charges
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
          message: 'Successfully charged customer profile',
          chargeResponse
        });
      }

      if (!transactionId) {
        const transactions = await getUnsettledTransactionList();
        return NextResponse.json(
          {
            message: 'Successfully fetched unsettled transactions',
            transactions
          },
          { headers: headersList }
        );
      }
    }
  } catch (error) {
    console.error('Error in Authorize.Net API route:', error);
    const errorMessage = (error as Error).message || 'Unknown error';
    return NextResponse.json(
      {
        message: 'API request failed',
        error: errorMessage
      },
      { headers: headersList, status: 500 }
    );
  }
}

// Fetch unsettled (pending) transactions from Authorize.Net
async function getUnsettledTransactionList() {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetUnsettledTransactionListRequest();
  const paging = new APIContracts.Paging();
  paging.setLimit(500);
  paging.setOffset(1);
  const sorting = new APIContracts.TransactionListSorting();
  sorting.setOrderBy(APIContracts.TransactionListOrderFieldEnum.ID);
  sorting.setOrderDescending(true);
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setPaging(paging);
  getRequest.setSorting(sorting);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetUnsettledTransactionListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactions?.transaction || [];
  } else {
    console.log('Failed to get unsettled transaction list');
    const messages = apiResponse.getMessages();
    if (messages && messages.getMessage()) {
      const messageArray = messages.getMessage();
      // Explicit type to satisfy TypeScript strict mode
      const errorText = messageArray.map((m: APIContracts.MessageType) => 
        `${m.getCode()}: ${m.getText()}`
      ).join('; ');
      console.error('Authorize.Net API Error:', errorText);
      throw new Error(`Authorize.Net Error: ${errorText}`);
    }
    throw new Error('Authorize.Net API returned an error with no message details');
  }
}

// Create a customer profile from an existing transaction
async function createCustomerProfileFromTransaction(transactionId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const createRequest = new APIContracts.CreateCustomerProfileFromTransactionRequest();
  createRequest.setTransId(transactionId);
  createRequest.setMerchantAuthentication(merchantAuthenticationType);

  // Generate a random merchant customer ID (11 alphanumeric chars)
  const possible_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randoms = '';
  for (let i = 0; i < 11; i++) {
    randoms += possible_letters.charAt(Math.floor(Math.random() * possible_letters.length));
  }
  const customerProfile = new APIContracts.CustomerProfileBaseType();
  customerProfile.setMerchantCustomerId(randoms || '');

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
    console.log('Failed to create customer profile from transaction');
    const messages = apiResponse.getMessages();
    if (messages && messages.getMessage()) {
      const messageArray = messages.getMessage();
      const errorText = messageArray.map((m: APIContracts.MessageType) => 
        `${m.getCode()}: ${m.getText()}`
      ).join('; ');
      console.error('Authorize.Net API Error:', errorText);
      throw new Error(`Authorize.Net Error: ${errorText}`);
    }
    throw new Error('Authorize.Net API returned an error with no message details');
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
  createRequest.setRefId(invoiceNumber);
  createRequest.setTransactionRequest(
    createTransactionRequest(customerProfileId, customerPaymentProfileId, amount, invoiceNumber)
  );

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    createRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.CreateTransactionResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactionResponse;
  } else {
    console.log('Failed to charge customer profile');
    const messages = apiResponse.getMessages();
    if (messages && messages.getMessage()) {
      const messageArray = messages.getMessage();
      const errorText = messageArray.map((m: APIContracts.MessageType) => 
        `${m.getCode()}: ${m.getText()}`
      ).join('; ');
      console.error('Authorize.Net API Error:', errorText);
      throw new Error(`Authorize.Net Error: ${errorText}`);
    }
    throw new Error('Authorize.Net API returned an error with no message details');
  }
}

// Build the transaction request for charging a profile
function createTransactionRequest(
  customerProfileId: string,
  customerPaymentProfileId: string,
  amount: string,
  invoiceNumber: string
) {
  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  
  const order = new APIContracts.OrderType();
  let finalInvoiceNumber = invoiceNumber;
  if (invoiceNumber.startsWith('ADD_CHARGE_')) {
    const changedInvoiceNumber = invoiceNumber.split('_')[2];
    if (changedInvoiceNumber) {
      finalInvoiceNumber = changedInvoiceNumber;
    }
  }
  order.setInvoiceNumber('ADD_CHARGE_' + finalInvoiceNumber);
  transactionRequestType.setOrder(order);
  
  transactionRequestType.setAmount(amount);
  
  const profile = new APIContracts.CustomerProfilePaymentType();
  profile.setCustomerProfileId(customerProfileId);
  profile.setPaymentProfile(
    new APIContracts.PaymentProfile({ paymentProfileId: customerPaymentProfileId })
  );
  
  transactionRequestType.setProfile(profile);
  
  return transactionRequestType;
}

// Fetch details for a single transaction by ID
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
  } else {
    console.log('Failed to get transaction details');
    return null;
  }
}

// Fetch settled batch list for a date range
async function getSettledBatchList(first_date: string, last_date: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetSettledBatchListRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setIncludeStatistics(true);
  getRequest.setFirstSettlementDate(new Date(first_date));
  getRequest.setLastSettlementDate(new Date(last_date));

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetSettledBatchListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.batchList.batch || [];
  } else {
    console.log('Failed to get settled batch list');
    const messages = apiResponse.getMessages();
    if (messages && messages.getMessage()) {
      const messageArray = messages.getMessage();
      const errorText = messageArray.map((m: APIContracts.MessageType) => 
        `${m.getCode()}: ${m.getText()}`
      ).join('; ');
      console.error('Authorize.Net API Error:', errorText);
      throw new Error(`Authorize.Net Error: ${errorText}`);
    }
    throw new Error('Authorize.Net API returned an error with no message details');
  }
}

// Fetch transaction list for a specific batch
async function getTransactionList(batchId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetTransactionListRequest();
  const paging = new APIContracts.Paging();
  const sorting = new APIContracts.TransactionListSorting();
  sorting.setOrderBy(APIContracts.TransactionListOrderFieldEnum.ID);
  sorting.setOrderDescending(true);
  paging.setLimit(500);
  paging.setOffset(1);
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setBatchId(batchId);
  getRequest.setPaging(paging);
  getRequest.setSorting(sorting);

  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const apiResponse = new APIContracts.GetTransactionListResponse(response.data);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    return apiResponse.transactions?.transaction || [];
  } else {
    console.log('Failed to get transaction list');
    const messages = apiResponse.getMessages();
    if (messages && messages.getMessage()) {
      const messageArray = messages.getMessage();
      const errorText = messageArray.map((m: APIContracts.MessageType) => 
        `${m.getCode()}: ${m.getText()}`
      ).join('; ');
      console.error('Authorize.Net API Error:', errorText);
      throw new Error(`Authorize.Net Error: ${errorText}`);
    }
    throw new Error('Authorize.Net API returned an error with no message details');
  }
}