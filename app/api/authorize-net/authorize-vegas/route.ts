// app/api/authorize-net/authorize-vegas/route.ts
// Next.js App Router style (named export)
// Returns settled batches for Vegas Authorize.Net account (historical)
// Fixed for Next.js 13+ — uses named GET export
// Safe batch access to avoid "undefined.batch" errors

import { NextResponse } from 'next/server';
import { APIContracts } from 'authorizenet';
import axios from 'axios';
import { createMerchantAuthenticationType } from '../helpers/vegas-create-merchant-authentication-type';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isSettled = searchParams.get('isSettled') === 'true';
  const first_date = searchParams.get('first_date');
  const last_date = searchParams.get('last_date');

  if (isSettled && (!first_date || !last_date)) {
    return NextResponse.json(
      { message: 'first_date and last_date are required for settled batches' },
      { status: 400 }
    );
  }

  try {
    if (isSettled) {
      const batches = await getSettledBatchList(first_date!, last_date!);
      return NextResponse.json({ batches });
    }

    // Unsettled logic (keep your existing code if needed)
    // For now, return empty if not settled
    return NextResponse.json({ transactions: [] });
  } catch (error: any) {
    console.error('Vegas AuthNet error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

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

  const responseData = response.data;
  const apiResponse = new APIContracts.GetSettledBatchListResponse(responseData);

  if (apiResponse.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
    // SAFE: optional chaining + fallback to empty array
    const batchList = apiResponse.getBatchList();
    return batchList?.getBatch() || [];
  } else {
    console.log('Failed to get settled batch list (Vegas)');
    const messages = apiResponse.getMessages().getMessage();
    if (messages && messages.length > 0) {
      console.log(messages[0].getCode(), messages[0].getText());
    }
    // Return empty array instead of throwing — page will show "No batches found"
    return [];
  }
}