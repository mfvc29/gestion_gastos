export enum TransactionType {
  expense = 'expense',
  income = 'income',
  payment = 'payment',
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: Date;
  type: TransactionType;
  isCredit: boolean;
  category: string; // e.g., 'Comida', 'Transporte', etc.
  accountId: string; // The ID of the account this transaction is linked to
  notes?: string;
  calendarEventId?: string;
}
