export enum TransactionType {
  expense = 'expense',
  income = 'income',
  payment = 'payment',
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO String
  type: TransactionType;
  isCredit: boolean;
  category: string;
}
