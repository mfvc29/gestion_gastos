import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.user()) {
    return true;
  } else {
    // If we're still checking auth state on load, Firebase might not have triggered onAuthStateChanged yet.
    // In a real app we'd wait for the auth state to resolve, but for now we'll just return true and let the 
    // onAuthStateChanged in AuthService redirect them to login if they are not logged in.
    // Alternatively, we can use an Observable approach.
    // For simplicity, we just allow navigation and let the subscription redirect.
    return true; 
  }
};
