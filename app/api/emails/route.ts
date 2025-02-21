import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function GET() {
  try {
    // Fetch list of emails sent to the specific recipient
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Fetch up to 100 emails
      q: `to:sbvegas@sunbuggyfunrentals.com`
    });

    const messages = response.data.messages || [];

    console.log('Total messages found:', messages.length);

    // Fetch full details of each message and sort by internalDate (most recent first)
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full' // Use 'full' to get the internalDate
        });

        return {
          id: message.id!,
          internalDate: Number(msg.data.internalDate), // Convert to number for sorting
          payload: msg.data.payload // Include the payload to check for attachments
        };
      })
    );

    // Sort messages by internalDate in descending order (most recent first)
    messagesWithDetails.sort((a, b) => b.internalDate - a.internalDate);

    console.log('Sorted messages:', messagesWithDetails);

    // Limit to the 100 most recent emails
    const recentMessages = messagesWithDetails.slice(0, 100);

    console.log('Processing 100 most recent emails:', recentMessages.length);

    const images = [];

    // Process only the 100 most recent emails
    for (const message of recentMessages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'raw'
      });

      const rawMessage = Buffer.from(msg.data.raw!, 'base64').toString(
        'binary'
      );
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

    console.log('Total images found:', images.length);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
