import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { TransactionType } from '../../models/transaction.model';
import { AccountType } from '../../models/account.model';
import { GmailService, ScannedExpense } from '../../services/gmail.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public txService = inject(TransactionsService);
  public auth = inject(AuthService);
  public gmail = inject(GmailService);
  private router = inject(Router);
  TransactionType = TransactionType;
  AccountType = AccountType;

  public scannedExpenses = signal<ScannedExpense[]>([]);
  public isScanning = signal(false);

  async scanEmails() {
    this.isScanning.set(true);
    const results = await this.gmail.scanRecentExpenses();
    this.scannedExpenses.set(results);
    this.isScanning.set(false);
  }

  addScannedExpense(expense: ScannedExpense) {
    this.router.navigate(['/add'], { 
      queryParams: { 
        amount: expense.amount, 
        desc: expense.description, 
        type: TransactionType.expense 
      } 
    });
    // Remove it from the list visually
    this.scannedExpenses.update(list => list.filter(e => e.id !== expense.id));
  }

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
