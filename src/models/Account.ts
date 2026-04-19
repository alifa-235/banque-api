// models/Account.ts
export enum AccountType {
  SAVINGS = 'épargne',
  CURRENT = 'courant'
}

export enum TransactionType {
  DEPOSIT = 'dépôt',
  WITHDRAWAL = 'retrait',
  TRANSFER = 'virement'
}

export interface IAccount {
  id: string;
  accountNumber: string;
  clientName: string;
  clientEmail: string;
  type: AccountType;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: Date;
}