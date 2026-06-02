import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0, 'Amount must be non-negative'],
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Please specify transaction type'],
      index: true,
    },
    category: {
      type: String,
      enum: ['Food', 'Transport', 'Bills', 'Shopping', 'Salary', 'Entertainment', 'Others'],
      default: 'Others',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    merchant: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
      default: Date.now,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    aiCategorized: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
