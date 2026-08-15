import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { TransactionType } from '../../models/transaction.model';
import { AccountType } from '../../models/account.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public txService = inject(TransactionsService);
  public auth = inject(AuthService);
  TransactionType = TransactionType;
  AccountType = AccountType;

  getFirstName(): string {
    const user = this.auth.user();
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Invitado';
  }

  getAccountName(accountId: string): string {
    const acc = this.txService.accounts().find(a => a.id === accountId);
    return acc ? acc.name : 'Desconocida';
  }

  async deleteTx(id: string) {
    if (confirm('¿Eliminar este movimiento?')) {
      await this.txService.deleteTransaction(id);
    }
  }
}
