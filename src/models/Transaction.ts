// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'depot',
  WITHDRAWAL = 'retrait',
  TRANSFER = 'virement'
}

export interface ITransaction extends Document {
  accountId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  fromAccountId?: mongoose.Types.ObjectId;
  toAccountId?: mongoose.Types.ObjectId;
  date: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index pour les requêtes fréquentes
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ accountId: 1, type: 1 });
TransactionSchema.index({ date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);