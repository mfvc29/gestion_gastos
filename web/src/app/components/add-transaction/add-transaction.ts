import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { TransactionType } from '../../models/transaction.model';
import { Account, AccountType } from '../../models/account.model';

@Component({
  selector: 'app-add-transaction',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-transaction.html',
  styleUrl: './add-transaction.css',
})
export class AddTransaction implements OnInit {
  public txService = inject(TransactionsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  title = '';
  amount: number | null = null;
  date = new Date().toISOString().split('T')[0];
  type: TransactionType = TransactionType.expense;
  isCredit = false; // Left for compatibility but now driven by AccountType
  category = 'Otros';
  accountId = '';
  notes = '';
  addToCalendar = false;

  TransactionType = TransactionType;

  categories = [
    'Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Otros'
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['amount']) this.amount = parseFloat(params['amount']);
      if (params['desc']) this.title = params['desc'];
      if (params['type']) this.type = params['type'] as TransactionType;
    });

    if (this.txService.accounts().length > 0) {
      this.accountId = this.txService.accounts()[0].id;
    }
  }

  get availableAccounts(): Account[] {
    if (this.type === TransactionType.payment) {
      // Payment usually means paying a credit card from a debit account.
      // But let's simplify: which account is this transaction applied to?
      // A payment means paying off a credit card.
      return this.txService.creditAccounts();
    } else {
      return this.txService.accounts();
    }
  }

  async onSubmit() {
    if (!this.title || !this.amount || !this.accountId) return;

    const acc = this.txService.accounts().find(a => a.id === this.accountId);
    if (!acc) return;

    const isCreditCard = acc.type === AccountType.CREDIT;

    await this.txService.addTransaction(
      this.title,
      this.amount,
      new Date(this.date),
      this.type,
      isCreditCard,
      this.category,
      this.accountId,
      this.notes ? this.notes : undefined,
      this.addToCalendar
    );

    this.router.navigate(['/']);
  }
}
