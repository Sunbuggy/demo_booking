import { ImapFlow } from 'imapflow';

interface Email {
  subject: string;
  from: string; 
  body: string;
}

export class ImapService {
  private client: ImapFlow;

  constructor(private readonly username: string, private readonly password: string) {
    this.client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: this.username,
        pass: this.password
      }
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async fetchEmails(): Promise<Email[]> {
    const emails: Email[] = [];
    try {
      await this.connect();
      await this.client.mailboxOpen('INBOX');

      const lock = await this.client.getMailboxLock();
      try {
        const messages = await this.client.fetch('1:10', { source: true });
        for await (let message of messages) {
          const email: Email = {
            subject: this.decodeHeader(message.subject),
            from: message.from.text,
            body: this.extractBody(message.body)
          };
          emails.push(email);
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      await this.client.logout();
    }
    return emails;
  }

  private decodeHeader(header: string): string {
    return header.split(' ').map(part => {
      const decoded = Buffer.from(part, 'base64').toString('utf-8');
      return decoded.replace(/=\?.*?\?B\?/g, '').replace(/\?=/g, '');
    }).join(' ');
  }

  private extractBody(body: ImapFlow.FetchMessageBody): string {
    if (body?.html) {
      return body.html;
    } else if (body?.text) {
      return body.text;
    }
    return '';
  }
}