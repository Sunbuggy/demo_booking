import { APIContracts } from 'authorizenet';
import axios from 'axios';
import { createMerchantAuthenticationTypeTest } from '../helpers/vegas-create-merchant-authentication-type';
import { NextRequest, NextResponse } from 'next/server';

const url =
  process.env.NODE_ENV === 'production'
    ? 'https://book.sunbuggy.com'
    : 'http://127.0.0.1:3000';

async function fetchFormToken(
  amt: number,
  invoiceNumber: string,
  fname: string,
  lname: string,
  phone: string,
  lastpage: string
) {
  const merchantAuthenticationType = createMerchantAuthenticationTypeTest();
  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequestType.setAmount(amt);
  const customerAddress = new APIContracts.CustomerAddressType();
  const customer = new APIContracts.CustomerType();
  customer.setPhoneNumber(phone);
  customerAddress.setFirstName(fname);
  customerAddress.setLastName(lname);
  customerAddress.setPhoneNumber(phone);
  const orderType = new APIContracts.OrderType();
  orderType.setInvoiceNumber(invoiceNumber);
  transactionRequestType.setOrder(orderType);
  transactionRequestType.setBillTo(customerAddress);

  const setting1 = new APIContracts.SettingType();
  setting1.setSettingName('hostedPaymentButtonOptions');
  setting1.setSettingValue(`{"text": "Pay $${amt}"}`);

  const setting2 = new APIContracts.SettingType();
  setting2.setSettingName('hostedPaymentOrderOptions');
  setting2.setSettingValue('{"show": false}');

  const setting4 = new APIContracts.SettingType();
  setting4.setSettingName('hostedPaymentReturnOptions');
  setting4.setSettingValue(
    `{"showReceipt": true, "url": "${url}", "urlText": "Continue", "cancelUrl": "${url}/${lastpage}", "cancelUrlText": "Cancel"}`
  );

  const settingList = [setting1, setting2, setting4];

  const arrList = new APIContracts.ArrayOfSetting();
  arrList.setSetting(settingList);

  const getRequest = new APIContracts.GetHostedPaymentPageRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setTransactionRequest(transactionRequestType);
  getRequest.setHostedPaymentSettings(arrList);

  const response = await axios.post(
    'https://apitest.authorize.net/xml/v1/request.api',
    getRequest.getJSON(),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const responseData = response.data;
  const apiResponse = new APIContracts.GetHostedPaymentPageResponse(
    responseData
  );
  try {
    if (
      apiResponse.getMessages().getResultCode() ===
      APIContracts.MessageTypeEnum.OK
    ) {
      return apiResponse.getToken();
    } else {
      const errorMessage = apiResponse.getMessages();
      console.log('Failed to get transaction details:', errorMessage);
      return null;
    }
  } catch (error) {
    console.error(
      'An error occurred while getting transaction details:',
      error
    );
    return null;
  }
}

// Named export for GET method
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const amt = searchParams.get('amt') as string;
  const invoiceNumber = searchParams.get('invoiceNumber') as string;
  const fname = searchParams.get('fname') as string;
  const lname = searchParams.get('lname') as string;
  const phone = searchParams.get('phone') as string;
  const lastpage = searchParams.get('lastpage') as string;
  try {
    const formToken = await fetchFormToken(
      Number(amt),
      invoiceNumber,
      fname,
      lname,
      phone,
      lastpage
    );
    return NextResponse.json({ formToken }, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
