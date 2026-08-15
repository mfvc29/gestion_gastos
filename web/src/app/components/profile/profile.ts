import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { AccountType } from '../../models/account.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  public txService = inject(TransactionsService);
  public auth = inject(AuthService);
  private router = inject(Router);

  AccountType = AccountType;

  newName: string = '';
  newBank: string = 'BCP';
  newType: AccountType = AccountType.DEBIT;
  newBalance: number | null = null;
  newCreditLimit: number | null = null;

  banks = ['BCP', 'Interbank', 'BBVA', 'Bipay', 'Otro'];

  async addAccount() {
    if (!this.newName || this.newBalance === null) return;
    
    await this.txService.addAccount(
      this.newName,
      this.newBank,
      this.newType,
      this.newBalance,
      this.newType === AccountType.CREDIT ? (this.newCreditLimit || 0) : undefined
    );

    this.newName = '';
    this.newBalance = null;
    this.newCreditLimit = null;
  }

  async deleteAccount(id: string) {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      await this.txService.deleteAccount(id);
    }
  }

  async logout() {
    await this.auth.logout();
  }
}
