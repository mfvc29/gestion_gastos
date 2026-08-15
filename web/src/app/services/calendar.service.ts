import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private auth = inject(AuthService);

  async addEventToCalendar(title: string, notes: string, date: Date): Promise<string | null> {
    const token = this.auth.googleAccessToken();
    if (!token) {
      console.warn('No Google Access Token available for Calendar API');
      return null;
    }

    const start = new Date(date);
    start.setHours(9, 0, 0); // Default to 9 AM
    const end = new Date(start);
    end.setHours(10, 0, 0); // 1 hour duration

    const event = {
      summary: title,
      description: notes,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        const data = await response.json();
        return data.id; // Return the created event ID
      } else {
        console.error('Error creating calendar event:', await response.text());
        return null;
      }
    } catch (err) {
      console.error('Exception creating calendar event:', err);
      return null;
    }
  }
}
