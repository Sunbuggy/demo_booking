import { NextRequest, NextResponse } from 'next/server';
import { APIContracts } from 'authorizenet';
import axios from 'axios';
import { createMerchantAuthenticationType } from '../helpers/vegas-vsp-create-merchant-authentication-type';

export const dynamic = 'force-dynamic'; // Disable static optimization
export const revalidate = 0; // Disable cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isSettled = searchParams.get('isSettled');
  const first_date = searchParams.get('first_date');
  const last_date = searchParams.get('last_date');
  const transactionId = searchParams.get('transactionId');
  const chargeAmt = searchParams.get('chargeAmt');
  const invoiceNumber = searchParams.get('invoiceNumber');
  const fetchByTransId = searchParams.get('fetchByTransId');
  const headersList = new Headers();
  headersList.append('Cache-Control', 'no-cache, no-store, must-revalidate');
  headersList.append('Pragma', 'no-cache');
  headersList.append('Expires', '0');
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
    if (isSettled === 'true') {
      if (!first_date || !last_date)
        return NextResponse.json(
          { message: 'Please provide first_date and last_date' },
          { status: 400 }
        );

      if (new Date(first_date) > new Date(last_date))
        return NextResponse.json(
          { message: 'first_date should be less than last_date' },
          { status: 400 }
        );

      if (new Date(first_date) > new Date() || new Date(last_date) > new Date())
        return NextResponse.json(
          { message: 'first_date and last_date should be less than today' },
          { status: 400 }
        );

      if (
        new Date(last_date).getTime() - new Date(first_date).getTime() >
        30 * 24 * 60 * 60 * 1000
      )
        return NextResponse.json(
          { message: 'first_date and last_date should be less than 30 days' },
          { status: 400 }
        );

      const settledBatches = await getSettledBatchList(first_date, last_date);
      const batchIds = settledBatches.map(
        (batch: { batchId: string }) => batch.batchId
      );

      if (batchIds.length > 0) {
        const all_transactions = await Promise.all(
          batchIds.map(getTransactionList)
        );
        return NextResponse.json({ all_transactions });
      }
    } else {
      if (chargeAmt && transactionId) {
        const transactionDetails =
          await createCustomerProfileFromTransaction(transactionId);
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
          message: 'Successfully fetched transaction details',
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
          {
            headers: headersList
          }
        );
      }
    }
  } catch (error) {
    console.error('Error fetching unsettled transactions:', error);
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      {
        message: 'Failed to fetch unsettled transactions',
        error: errorMessage
      },
      {
        headers: headersList
      }
    );
  }
}

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
  // getRequest.setStatus(APIContracts.TransactionGroupStatusEnum.PENDINGAPPROVAL);
  getRequest.setPaging(paging);
  getRequest.setSorting(sorting);

  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.GetUnsettledTransactionListResponse(
    responseData
  );

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse.transactions?.transaction;
  } else {
    console.log('Failed to get unsettled transaction list');
    if (apiResponse.getMessages().getMessage() != null) {
      console.log(apiResponse.getMessages().getMessage()[0].getCode());
      console.log(apiResponse.getMessages().getMessage()[0].getText());
    }
    throw new Error(apiResponse.getMessages().getMessage());
  }
}

async function createCustomerProfileFromTransaction(transactionId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const createRequest =
    new APIContracts.CreateCustomerProfileFromTransactionRequest();
  createRequest.setTransId(transactionId);
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  // add customer profile

  // get only the first eleven characters that are numbers and letters
  const possible_letters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let randoms = '';
  for (let i = 0; i < 11; i++) {
    randoms += possible_letters.charAt(
      Math.floor(Math.random() * possible_letters.length)
    );
  }
  const customerProfile = new APIContracts.CustomerProfileBaseType();
  customerProfile.setMerchantCustomerId(randoms || '');

  // add customer profile to request
  createRequest.setCustomer(customerProfile);

  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    createRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.CreateCustomerProfileResponse(
    responseData
  );

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse;
  } else {
    console.log('Failed to create customer profile from transaction');
    if (apiResponse.getMessages().getMessage() != null) {
      console.log(apiResponse.getMessages().getMessage()[0].getCode());
      console.log(apiResponse.getMessages().getMessage()[0].getText());
    }
    throw new Error(apiResponse.getMessages().getMessage());
  }
}

async function chargeCustomerProfile(
  customerProfileId: string,
  customerPaymentProfileId: string,
  amount: string,
  invoiceNumber: string
) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  // add invoice number to my transaction
  createRequest.setRefId(invoiceNumber);
  createRequest.setTransactionRequest(
    createTransactionRequest(
      customerProfileId,
      customerPaymentProfileId,
      amount,
      invoiceNumber
    )
  );

  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    createRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.CreateTransactionResponse(responseData);

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse.transactionResponse;
  } else {
    console.log('Failed to charge customer profile');
    if (apiResponse.getMessages().getMessage() != null) {
      console.log(apiResponse.getMessages().getMessage()[0].getCode());
      console.log(apiResponse.getMessages().getMessage()[0].getText());
    }
    throw new Error(apiResponse.getMessages().getMessage());
  }
}

function createTransactionRequest(
  customerProfileId: string,
  customerPaymentProfileId: string,
  amount: string,
  invoiceNumber: string
) {
  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  const order = new APIContracts.OrderType();
  let finalInvoiceNumber = invoiceNumber; // Default to the original invoice number
  // if invoicenumber starts with ADD_CHARGE then get rid of ADD_CHARGE and use the rest of the string as the invoice number
  if (invoiceNumber.startsWith('ADD_CHARGE_')) {
    const changedInvoiceNumber = invoiceNumber.split('_')[2];
    if (changedInvoiceNumber) {
      finalInvoiceNumber = changedInvoiceNumber; // Update the invoice number if conditions are met
    }
  }

  order.setInvoiceNumber('ADD_CHARGE_' + finalInvoiceNumber);
  transactionRequestType.setOrder(order);
  transactionRequestType.setAmount(amount);
  const profile = new APIContracts.CustomerProfilePaymentType();
  profile.setCustomerProfileId(customerProfileId);
  profile.setPaymentProfile(
    new APIContracts.PaymentProfile({
      paymentProfileId: customerPaymentProfileId
    })
  );

  transactionRequestType.setProfile(profile);

  return transactionRequestType;
}

async function getTrasactionDetails(transactionId: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetTransactionDetailsRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setTransId(transactionId);

  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.GetTransactionDetailsResponse(
    responseData
  );

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse.transaction;
  } else {
    console.log('Failed to get transaction details');
    return null;
    // if (apiResponse.getMessages().getMessage() != null) {
    //   console.log(apiResponse.getMessages().getMessage()[0].getCode());
    //   console.log(apiResponse.getMessages().getMessage()[0].getText());
    // }
    // throw new Error(apiResponse.getMessages().getMessage());
  }
}

async function getSettledBatchList(first_date: string, last_date: string) {
  const merchantAuthenticationType = createMerchantAuthenticationType();
  const getRequest = new APIContracts.GetSettledBatchListRequest();
  const paging = new APIContracts.Paging();
  paging.setLimit(500);
  paging.setOffset(1);
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setIncludeStatistics(true);
  getRequest.setFirstSettlementDate(new Date(first_date));
  getRequest.setLastSettlementDate(new Date(last_date));
  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.GetSettledBatchListResponse(
    responseData
  );

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse.batchList.batch;
  } else {
    console.log('Failed to get settled batch list');
    if (apiResponse.getMessages().getMessage() != null) {
      console.log(apiResponse.getMessages().getMessage()[0].getCode());
      console.log(apiResponse.getMessages().getMessage()[0].getText());
    }
    throw new Error(apiResponse.getMessages().getMessage());
  }
}

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

  // Use Axios to make the request
  const response = await axios.post(
    'https://api.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.GetTransactionListResponse(responseData);

  if (
    apiResponse.getMessages().getResultCode() ===
    APIContracts.MessageTypeEnum.OK
  ) {
    return apiResponse.transactions?.transaction;
  } else {
    console.log('Failed to get transaction list');
    if (apiResponse.getMessages().getMessage() != null) {
      console.log(apiResponse.getMessages().getMessage()[0].getCode());
      console.log(apiResponse.getMessages().getMessage()[0].getText());
    }
    throw new Error(apiResponse.getMessages().getMessage());
  }
}
