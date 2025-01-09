import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { updateAuditLog } from '@/utils/supabase/queries';

// Initialize Supabase client
const supabase = createClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    // Parse the incoming event data
    const { tableName, action, row } = req.body;

    if (!tableName || !action || !row) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate that the table is either "qr_history" or "vehicle_tag"
    const validTables = ['qr_history', 'vehicle_tag'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // Insert an audit log entry
    const auditLog = {
      action,
      table_name: tableName,
      row: JSON.stringify(row),
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditLog)
      .select();

    if (error) {
      console.error('Error inserting audit log:', error);
      return res.status(500).json({ error: 'Failed to insert audit log' });
    }

    return res.status(200).json({ message: 'Audit log added', auditLog: data });
  } catch (err) {
    console.error('Error in handler:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
