import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface ScannedExpense {
  id: string;
  amount: number;
  description: string;
  bank: string;
  date: Date;
  operationCode?: string;
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

    // Query for last 2 days from Interbank or BCP
    const query = encodeURIComponent('(from:servicioalcliente@netinterbank.com.pe OR from:notificaciones@notificacionesbcp.com.pe) newer_than:2d');
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
      
      // Prefer HTML to ensure we see the full tables
      if (msgData.payload.parts) {
        const part = msgData.payload.parts.find((p: any) => p.mimeType === 'text/html') || msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain') || msgData.payload.parts[0];
        if (part.body && part.body.data) {
          bodyData = part.body.data;
        } else if (part.parts) {
          const subpart = part.parts.find((p: any) => p.mimeType === 'text/html') || part.parts.find((p: any) => p.mimeType === 'text/plain') || part.parts[0];
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

      // 1. Strip all HTML tags
      // 2. Replace &nbsp; with space
      // 3. Collapse multiple spaces/newlines into a single space
      let cleanBody = decodedBody
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (isInterbank) {
        console.log("Interbank Clean Body:", cleanBody);
        
        // Find amount: "Monto y moneda S/ 1.00" or just "S/ 1.00"
        const noSpacesBody = cleanBody.replace(/\s+/g, '');
        const amountMatch = noSpacesBody.match(/S\/([\d.,]+)/i);
        
        // Find Destinatario
        const destMatch = cleanBody.match(/Destinatario\s+(.+?)(?:\s+Destino|\s+Monto|\s+Fecha|$)/i);
        
        // Find Código de operación
        const opCodeMatch = cleanBody.match(/Código de operación\s+(\d+)/i);
        const operationCode = opCodeMatch ? opCodeMatch[1] : undefined;

        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(',', ''));
          const description = destMatch ? destMatch[1].trim() : 'Transferencia Interbank';
          return {
            id: msgData.id,
            amount,
            description: `Interbank: ${description}`,
            bank: 'Interbank',
            date: new Date(parseInt(msgData.internalDate)),
            operationCode
          };
        }
      } else if (isBCP) {
        console.log("BCP Clean Body:", cleanBody);
        
        // Find amount
        const noSpacesBody = cleanBody.replace(/\s+/g, '');
        const amountMatch = noSpacesBody.match(/S\/([\d.,]+)/i);
        
        // Find Destinatario
        const destMatch = cleanBody.match(/Pagado a\s+(.+?)(?:\s+Tipo|\s+Desde|\s+Moneda|$)/i) || 
                          cleanBody.match(/Operación realizada\s+(.+?)(?:\s+Fecha|\s+Pagado|$)/i);
        
        // Find Número de operación
        const opCodeMatch = cleanBody.match(/Número de operación\s+(\d+)/i);
        const operationCode = opCodeMatch ? opCodeMatch[1] : undefined;

        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(',', ''));
          const description = destMatch ? destMatch[1].trim() : 'Pago BCP';
          const cleanDesc = description.replace(/<[^>]*>?/gm, '').replace(/\*/g, '').trim();
          return {
            id: msgData.id,
            amount,
            description: `BCP: ${cleanDesc.substring(0, 30)}`,
            bank: 'BCP',
            date: new Date(parseInt(msgData.internalDate)),
            operationCode
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
