// components/ClientApplePayLoader.tsx
'use client';

import { useEffect } from 'react';

export default function ClientApplePayLoader() {
  useEffect(() => {
    // Load Apple Pay SDK only once
    if (!document.getElementById('apple-pay-script')) {
      const script = document.createElement('script');
      script.id = 'apple-pay-script';
      script.src = 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null; // Renders nothing
}