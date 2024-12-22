'use server';

import Mailjet from 'node-mailjet';

export async function sendEmail(
  subject: string,
  content: string,
  emailFrom: string,
  name: string
) {
  const mailjet = new Mailjet({
    apiKey: process.env.EMAIL_SERVER_USER,
    apiSecret: process.env.EMAIL_SERVER_PASSWORD
  });

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'cyberteam@sunbuggy.com',
          Name: 'Cyber Team'
        },
        To: [
          {
            Email: 'parts@sunbuggy.com',
            Name: 'Repairs Team'
          }
        ],
        Subject: `${subject} - ${emailFrom}`,
        TextPart: content,
        HTMLPart: content.replace(/\n/g, '<br>'),
        Headers: {
          'Reply-To': `${emailFrom}`
        }
      }
    ]
  });

  try {
    await request;
    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false };
  }
}
