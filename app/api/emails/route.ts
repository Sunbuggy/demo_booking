import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function GET() {
  try {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 25,
    });

    const images = [];
    
    for (const message of data.messages || []) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'raw'
      });

      const rawMessage = Buffer.from(msg.data.raw!, 'base64').toString('binary');
      const parsed = await simpleParser(rawMessage);

      if (parsed.attachments) {
        for (const attachment of parsed.attachments) {
          if (attachment.contentType?.startsWith('image/')) {
            images.push({
              filename: attachment.filename,
              data: `data:${attachment.contentType};base64,${attachment.content.toString('base64')}`
            });
          }
        }
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}