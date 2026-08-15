import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { Transaction, TransactionType } from '../models/transaction.model';
import { Account, AccountType } from '../models/account.model';
import { FirestoreService } from './firestore.service';
import { CalendarService } from './calendar.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private firestore = inject(FirestoreService);
  private calendar = inject(CalendarService);

  public transactions = signal<Transaction[]>([]);
  public accounts = signal<Account[]>([]);

  // Derived signals
  public debitAccounts = computed(() => this.accounts().filter(a => a.type === AccountType.DEBIT || a.type === AccountType.VAULT));
  public creditAccounts = computed(() => this.accounts().filter(a => a.type === AccountType.CREDIT));

  public totalBalance = computed(() => {
    // Current available money = Sum of Debit/Vault initial balances
    // + Income to those accounts - Expense from those accounts - Payments to credit from those accounts
    // Actually, balance is dynamically computed here, OR we can store currentBalance in Account.
    // It's safer to compute from initialBalance + transactions if we wanted history, but 
    // for simplicity and sync, let's assume `account.balance` is updated on every transaction.
    return this.debitAccounts().reduce((sum, acc) => sum + acc.balance, 0);
  });

  public totalDebt = computed(() => {
    return this.creditAccounts().reduce((sum, acc) => sum + acc.balance, 0);
  });

  public projectedBalance = computed(() => {
    return this.totalBalance() - this.totalDebt();
  });

  // Current Month Expenses
  public currentMonthExpenses = computed(() => {
    const txs = this.transactions();
    const now = new Date();
    return txs
      .filter(tx => tx.type === TransactionType.expense && 
                    tx.date.getFullYear() === now.getFullYear() && 
                    tx.date.getMonth() === now.getMonth())
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  private unsubscribeAccounts: (() => void) | null = null;
  private unsubscribeTransactions: (() => void) | null = null;

  constructor() {
    // Automatically load data when auth is ready
    effect(() => {
      // Re-subscribe if needed
      if (this.unsubscribeAccounts) this.unsubscribeAccounts();
      if (this.unsubscribeTransactions) this.unsubscribeTransactions();

      this.unsubscribeAccounts = this.firestore.subscribeToAccounts((accs) => {
        this.accounts.set(accs);
      });

      this.unsubscribeTransactions = this.firestore.subscribeToTransactions((txs) => {
        this.transactions.set(txs);
      });
    });
  }

  // Add Account
  async addAccount(name: string, bank: string, type: AccountType, balance: number, creditLimit?: number) {
    const newAccount: any = {
      id: crypto.randomUUID(),
      name,
      bank,
      type,
      balance,
    };
    if (creditLimit !== undefined && creditLimit !== null) {
      newAccount.creditLimit = creditLimit;
    }
    await this.firestore.saveAccount(newAccount as Account);
  }

  async updateAccountBalance(accountId: string, newBalance: number) {
    const account = this.accounts().find(a => a.id === accountId);
    if (account) {
      account.balance = newBalance;
      await this.firestore.saveAccount(account);
    }
  }

  async deleteAccount(accountId: string) {
    await this.firestore.deleteAccount(accountId);
  }

  // Add Transaction
  async addTransaction(
    title: string, 
    amount: number, 
    date: Date, 
    type: TransactionType, 
    isCredit: boolean, 
    category: string,
    accountId: string,
    notes?: string,
    addToCalendar?: boolean
  ) {
    let eventId: string | undefined = undefined;
    if (addToCalendar && notes) {
      const id = await this.calendar.addEventToCalendar(title, notes, date);
      if (id) eventId = id;
    }

    const newTx: any = {
      id: crypto.randomUUID(),
      title,
      amount,
      date,
      type,
      isCredit,
      category,
      accountId
    };
    
    if (notes !== undefined && notes !== null && notes !== '') {
      newTx.notes = notes;
    }
    if (eventId !== undefined && eventId !== null) {
      newTx.calendarEventId = eventId;
    }

    await this.firestore.saveTransaction(newTx as Transaction);

    // Update account balances
    const account = this.accounts().find(a => a.id === accountId);
    if (account) {
      let updatedBalance = account.balance;
      if (type === TransactionType.income) {
        updatedBalance += amount;
      } else if (type === TransactionType.expense) {
        if (account.type === AccountType.CREDIT) {
          // Expense on credit increases debt (balance)
          updatedBalance += amount;
        } else {
          // Expense on debit decreases available money
          updatedBalance -= amount;
        }
      } else if (type === TransactionType.payment) {
        // Payment on credit card decreases debt
        updatedBalance -= amount;
      }
      
      await this.updateAccountBalance(account.id, updatedBalance);
    }
  }

  async deleteTransaction(txId: string) {
    // Reverse the balance impact
    const tx = this.transactions().find(t => t.id === txId);
    if (tx) {
      const account = this.accounts().find(a => a.id === tx.accountId);
      if (account) {
        let updatedBalance = account.balance;
        if (tx.type === TransactionType.income) {
          updatedBalance -= tx.amount;
        } else if (tx.type === TransactionType.expense) {
          if (account.type === AccountType.CREDIT) {
            updatedBalance -= tx.amount;
          } else {
            updatedBalance += tx.amount;
          }
        } else if (tx.type === TransactionType.payment) {
          updatedBalance += tx.amount;
        }
        await this.updateAccountBalance(account.id, updatedBalance);
      }
      await this.firestore.deleteTransaction(txId);
    }
  }
}
