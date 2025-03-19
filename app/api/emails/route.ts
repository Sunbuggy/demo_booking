import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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
    // Hardcoded date range with known emails
    const startDate = '2025/02/14';
    const endDate = '2025/02/20'; // Use valid end date format

    // Construct query with explicit timezone handling
    const query = `to:sbvegas@sunbuggyfunrentals.com`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5, // Reduced from 10 to limit the number of emails fetched
      q: query,
    });

    const messages = response.data.messages || [];

    // Process ALL found messages (remove date filtering)
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        return {
          id: message.id!,
          internalDate: Number(msg.data.internalDate),
        };
      })
    );

    // Process images from ALL messages
    const images = [];
    for (const message of messagesWithDetails) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'raw',
      });

      const parsed = await simpleParser(
        Buffer.from(msg.data.raw!, 'base64').toString('binary')
      );

      if (parsed.attachments) {
        // Limit the number of attachments returned
        const imageAttachments = parsed.attachments
          .filter((a) => a.contentType?.startsWith('image/'))
          .slice(0, 2); // Limit to 2 images per email

        images.push(
          ...imageAttachments.map((a) => ({
            filename: a.filename,
            data: `data:${a.contentType};base64,${a.content.toString('base64')}`,
          }))
        );
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Full error details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch emails',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}