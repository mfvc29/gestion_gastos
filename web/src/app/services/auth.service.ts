import { Injectable, signal } from '@angular/core';
import { GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase.config';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user = signal<User | null>(null);
  public googleAccessToken = signal<string | null>(null);

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        this.googleAccessToken.set(credential.accessToken);
        // We can save this token somewhere if we need it for calendar across reloads
        // For security, usually you don't save access tokens to localStorage without encryption,
        // but for a simple personal app, we might keep it in memory.
      }
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error logging in with Google', error);
    }
  }

  async logout() {
    await signOut(auth);
    this.googleAccessToken.set(null);
    this.router.navigate(['/login']);
  }
}
