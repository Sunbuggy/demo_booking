/**
 * @file /lib/dns/verification-service.ts
 * @description Helper to programmatically verify SunBuggy's SPF and DKIM health.
 */

import { promises as dns } from 'node:dns';

interface DNSStatus {
  valid: boolean;
  records: string[];
  error?: string;
}

/**
 * Verifies the consolidated SPF record on the root domain.
 */
export async function verifySPF(domain: string = 'sunbuggy.com'): Promise<DNSStatus> {
  try {
    // resolveTxt returns a 2D array: each record is an array of strings
    const txtRecords = await dns.resolveTxt(domain);
    
    // Filter for the record starting with v=spf1
    const spfRecords = txtRecords
      .map(record => record.join(''))
      .filter(row => row.startsWith('v=spf1'));

    if (spfRecords.length === 0) {
      return { valid: false, records: [], error: 'No SPF record found.' };
    }

    if (spfRecords.length > 1) {
      return { valid: false, records: spfRecords, error: 'Multiple SPF records detected (Conflict).' };
    }

    // Impact Analysis: Ensure all required SunBuggy services are present
    const record = spfRecords[0];
    const hasGoogle = record.includes('_spf.google.com');
    const hasResend = record.includes('amazonses.com');

    return {
      valid: hasGoogle && hasResend,
      records: spfRecords,
      error: !(hasGoogle && hasResend) ? 'Missing required mail service inclusions.' : undefined
    };
  } catch (error: any) {
    return { valid: false, records: [], error: error.message };
  }
}

/**
 * Verifies the DKIM record for a specific selector.
 * Defaulting to 'resend' for our new scheduling service.
 */
export async function verifyDKIM(
  selector: string = 'resend', 
  domain: string = 'sunbuggy.com'
): Promise<DNSStatus> {
  try {
    // DKIM records live at selector._domainkey.domain
    const dkimHost = `${selector}._domainkey.${domain}`;
    const txtRecords = await dns.resolveTxt(dkimHost);
    
    const records = txtRecords.map(r => r.join(''));
    const isValid = records.some(r => r.includes('v=DKIM1') || r.includes('p='));

    return {
      valid: isValid,
      records: records
    };
  } catch (error: any) {
    return { valid: false, records: [], error: `DKIM lookup failed: ${error.code}` };
  }
}