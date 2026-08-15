export enum AccountType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  VAULT = 'VAULT',
}

export interface Account {
  id: string;
  name: string; // e.g., 'BCP Yape', 'Interbank Bóveda Viaje', 'BCP Qore'
  bank: string; // e.g., 'BCP', 'Interbank', 'BBVA', 'Bipay'
  type: AccountType;
  balance: number; // For Debit/Vault: available money. For Credit: current debt.
  creditLimit?: number; // Only for CREDIT
}
