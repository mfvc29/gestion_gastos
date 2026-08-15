import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface ScannedExpense {
  id: string;
  amount: number;
  description: string;
  bank: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GmailService {
  private auth = inject(AuthService);

  async scanRecentExpenses(): Promise<ScannedExpense[]> {
    const token = this.auth.googleAccessToken();
    if (!token) {
      console.warn('No Google token found. Did you login with Google?');
      return [];
    }

    // Query for last 1 day from Interbank or BCP
    const query = encodeURIComponent('(from:servicioalcliente@netinterbank.com.pe OR from:notificaciones@notificacionesbcp.com.pe) newer_than:1d');
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Failed to fetch messages', await response.text());
        return [];
      }
      
      const data = await response.json();
      if (!data.messages) return [];

      const expenses: ScannedExpense[] = [];

      // Fetch details for up to 10 latest messages
      for (const msg of data.messages.slice(0, 10)) {
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const msgRes = await fetch(msgUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();
        
        const parsed = this.parseEmail(msgData);
        if (parsed) {
          expenses.push(parsed);
        }
      }

      return expenses;

    } catch (err) {
      console.error('Error scanning gmail:', err);
      return [];
    }
  }

  private parseEmail(msgData: any): ScannedExpense | null {
    try {
      let bodyData = '';
      
      // Gmail payload can be multipart or simple
      if (msgData.payload.parts) {
        // Try to find plain text part or fallback
        const part = msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain') || msgData.payload.parts[0];
        if (part.body && part.body.data) {
          bodyData = part.body.data;
        } else if (part.parts) {
          const subpart = part.parts.find((p: any) => p.mimeType === 'text/plain') || part.parts[0];
          bodyData = subpart?.body?.data || '';
        }
      } else if (msgData.payload.body && msgData.payload.body.data) {
        bodyData = msgData.payload.body.data;
      }

      if (!bodyData) return null;

      // Decode base64url
      const base64 = bodyData.replace(/-/g, '+').replace(/_/g, '/');
      const decodedBody = decodeURIComponent(escape(window.atob(base64)));
      const snippet = msgData.snippet || '';

      const headers = msgData.payload.headers;
      const fromHeader = headers.find((h: any) => h.name === 'From')?.value || '';
      
      const isInterbank = fromHeader.includes('servicioalcliente@netinterbank.com.pe');
      const isBCP = fromHeader.includes('notificaciones@notificacionesbcp.com.pe');

      if (isInterbank) {
        const amountMatch = decodedBody.match(/Monto y moneda[\s\S]{1,50}?S\/\s*([\d.,]+)/i) || snippet.match(/S\/\s*([\d.,]+)/i);
        const destMatch = decodedBody.match(/Destinatario[\s\S]{1,10}?\n\n?([^\n]+)/i) || decodedBody.match(/Destinatario\s+([A-Za-z0-9 ]+)/i);
        
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(',', ''));
          const description = destMatch ? destMatch[1].trim() : 'Transferencia Interbank';
          return {
            id: msgData.id,
            amount,
            description: `Interbank: ${description}`,
            bank: 'Interbank',
            date: new Date(parseInt(msgData.internalDate))
          };
        }
      } else if (isBCP) {
        const amountMatch = decodedBody.match(/Monto pagado[\s\S]{1,50}?S\/\s*([\d.,]+)/i) || snippet.match(/S\/\s*([\d.,]+)/i);
        const destMatch = decodedBody.match(/Pagado a[\s\S]{1,10}?\n\n?([^\n]+)/i) || decodedBody.match(/Operación realizada[\s\S]{1,10}?\n\n?([^\n]+)/i) || decodedBody.match(/Pagado a\s+([A-Za-z0-9 ]+)/i);
        
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(',', ''));
          const description = destMatch ? destMatch[1].trim() : 'Pago BCP';
          // Filter out asterisks or HTML tags
          const cleanDesc = description.replace(/<[^>]*>?/gm, '').replace(/\*/g, '').trim();
          return {
            id: msgData.id,
            amount,
            description: `BCP: ${cleanDesc.substring(0, 30)}`,
            bank: 'BCP',
            date: new Date(parseInt(msgData.internalDate))
          };
        }
      }

      return null;
    } catch (e) {
      console.error('Failed parsing email', e);
      return null;
    }
  }
}
