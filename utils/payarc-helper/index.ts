// /utils/payarc-helper/index.ts

export interface PayArcChargeRequest {
  amount: number; // Amount in dollars
  currency?: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  metadata: {
    reservationId: number;
    invoiceNumber: string;
    [key: string]: any;
  };
  hosted_page?: {
    type: string;
    callback_url: string;
    cancel_url: string;
  };
}

export interface PayArcChargeResponse {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  hosted_page?: {
    url: string;
    expires_at: number;
  };
  metadata: Record<string, any>;
  transaction_id?: string;
}

export interface PayArcErrorResponse {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

export interface PayArcHostedPageRequest {
  amount: number;
  invoice_number: string;
  customer_email: string;
  customer_first_name?: string;
  customer_last_name?: string;
  metadata?: Record<string, any>;
}

export interface PayArcTransaction {
  transaction_id: string;
  status: 'approved' | 'declined' | 'pending';
  amount: number;
  authorization_code?: string;
  created_at: string;
}

class PayArcClient {
  private baseUrl: string;
  private secretKey: string;
  private apiKey: string;
  private clientId: string;
  private merchantId: string;

  constructor() {
    this.baseUrl = process.env.PAYARC_API_URL || 'https://api.payarc.net/v1';
    this.secretKey = process.env.PAYARC_SECRET_KEY || '';
    this.apiKey = process.env.PAYARC_API_KEY || '';
    this.clientId = process.env.PAYARC_CLIENT_ID || '';
    this.merchantId = process.env.PAYARC_MERCHANT_ID || '';
    
    if (!this.secretKey) {
      throw new Error('PAYARC_SECRET_KEY is not configured');
    }
    if (!this.apiKey) {
      throw new Error('PAYARC_API_KEY is not configured');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Authorization-Key': this.apiKey,
      'Content-Type': 'application/json',
      'Client-Id': this.clientId,
    };
  }

  /**
   * Create a payment charge and generate hosted payment page URL
   */
  async createCharge(chargeData: PayArcChargeRequest): Promise<PayArcChargeResponse> {
    const payload = {
      amount: Math.round(chargeData.amount * 100), // Convert dollars to cents
      currency: chargeData.currency || 'USD',
      customer: chargeData.customer,
      metadata: chargeData.metadata,
      capture: true,
      hosted_page: {
        type: 'payment',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payarc/callback`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel`,
      }
    };

    const response = await fetch(`${this.baseUrl}/charges`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('PayArc createCharge response:', { status: response.status, data });

    if (!response.ok) {
      const error = data as PayArcErrorResponse;
      throw new Error(`PayArc API Error: ${error.error?.message || JSON.stringify(error)} (Status: ${response.status})`);
    }

    return data as PayArcChargeResponse;
  }

  /**
   * Alternative: Create hosted page directly (simpler method)
   */
  async createHostedPage(hostedPageData: PayArcHostedPageRequest): Promise<{ url: string; page_id: string }> {
    const payload = {
      merchant_id: this.merchantId,
      amount: Math.round(hostedPageData.amount * 100),
      currency: 'USD',
      invoice_number: hostedPageData.invoice_number,
      customer_email: hostedPageData.customer_email,
      customer_first_name: hostedPageData.customer_first_name,
      customer_last_name: hostedPageData.customer_last_name,
      metadata: {
        ...hostedPageData.metadata,
        app_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payarc/callback`
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel`,
    };

    const response = await fetch(`${this.baseUrl}/hosted-pages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('PayArc createHostedPage response:', { status: response.status, data });

    if (!response.ok) {
      const error = data as PayArcErrorResponse;
      throw new Error(`PayArc Hosted Page Error: ${error.error?.message || JSON.stringify(error)}`);
    }

    return {
      url: data.hosted_page_url,
      page_id: data.page_id
    };
  }

  /**
   * Retrieve charge details by ID
   */
  async getCharge(chargeId: string): Promise<PayArcChargeResponse> {
    const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as PayArcErrorResponse;
      throw new Error(`PayArc API Error: ${error.error?.message || JSON.stringify(error)}`);
    }

    return data as PayArcChargeResponse;
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(transactionId: string): Promise<PayArcTransaction> {
    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to verify transaction: ${JSON.stringify(data)}`);
    }

    return {
      transaction_id: data.transaction_id,
      status: data.status.toLowerCase(),
      amount: data.amount / 100, // Convert cents to dollars
      authorization_code: data.authorization_code,
      created_at: data.created_at,
    };
  }
}

export const payarcClient = new PayArcClient();