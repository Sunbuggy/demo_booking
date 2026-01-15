/**
 * @file /app/actions/health-actions.ts
 * @description Server Action to bridge DNS verification with the React UI.
 */
'use server'

import { verifySPF, verifyDKIM } from '@/lib/dns/verification-service';

export async function getInfrastructureStatus() {
  // Execute checks in parallel for performance
  const [spf, dkim] = await Promise.all([
    verifySPF('sunbuggy.com'),
    verifyDKIM('resend', 'sunbuggy.com')
  ]);

  return {
    spf,
    dkim,
    lastChecked: new Date().toLocaleTimeString()
  };
}