import axios from 'axios';

export interface PaymentSessionRequest {
  amount: number;
  currency: string;
  order_id: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  return_url: string;
  cancel_url: string;
}

export interface PaymentSessionResponse {
  session_id: string;
  hpp_url: string;
  transaction_id: string;
}

export interface PaymentVerificationRequest {
  session_id: string;
  transaction_id: string;
}

export interface PaymentVerificationResponse {
  status: 'success' | 'failed' | 'pending';
  transaction_id: string;
  amount: number;
  currency: string;
  customer_email: string;
  timestamp: string;
}

class PayArcClient {
  private baseURL: string;
  private merchantId: string;
  private secretKey: string;
  private publicKey: string;
  private hppURL: string;

  constructor() {
    this.baseURL = process.env.PAYARC_API_URL || 'https://api.payarc.com/v1';
    this.merchantId = process.env.PAYARC_MERCHANT_ID || '';
    this.secretKey = process.env.PAYARC_SECRET_KEY || '';
    this.publicKey = process.env.PAYARC_PUBLIC_KEY || '';
    this.hppURL = process.env.PAYARC_HPP_URL || 'https://hpp.payarc.com/hostedpayment';
    
    if (!this.merchantId || !this.secretKey) {
      throw new Error('PayArc credentials are not configured');
    }
  }

  private getAuthHeader(): string {
    const token = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${token}`;
  }

  async createPaymentSession(data: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/hostedpayments/sessions`,
        {
          merchant_id: this.merchantId,
          amount: Math.round(data.amount * 100), // Convert to cents
          currency: data.currency.toUpperCase(),
          order_id: data.order_id,
          customer_email: data.customer_email,
          customer_first_name: data.customer_first_name,
          customer_last_name: data.customer_last_name,
          billing_address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US'
          },
          return_url: data.return_url,
          cancel_url: data.cancel_url,
          metadata: {
            source: 'nextjs_app'
          }
        },
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        session_id: response.data.session_id,
        hpp_url: response.data.hpp_url,
        transaction_id: response.data.transaction_id
      };
    } catch (error) {
      console.error('PayArc session creation error:', error);
      throw error;
    }
  }

  async verifyPayment(data: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions/${data.transaction_id}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: response.data.transaction_status.toLowerCase(),
        transaction_id: response.data.transaction_id,
        amount: response.data.amount / 100, // Convert from cents
        currency: response.data.currency,
        customer_email: response.data.customer_email,
        timestamp: response.data.created_at
      };
    } catch (error) {
      console.error('PayArc verification error:', error);
      throw error;
    }
  }

  getHPPUrl(sessionId: string): string {
    return `${this.hppURL}?session_id=${sessionId}`;
  }
}

export const payarcClient = new PayArcClient();