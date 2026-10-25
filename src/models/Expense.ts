import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseCategory =
  | "kitchen"
  | "groceries"
  | "electricity"
  | "building_rent"
  | "maintenance"
  | "repairs"
  | "salaries"
  | "cleaning"
  | "water"
  | "internet"
  | "miscellaneous";

export interface IExpense extends Document {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date;
  paymentMethod: "upi" | "bank_transfer" | "cash" | "card" | "cheque";
  paidBy?: string;
  vendor?: string;
  description?: string;
  receiptKey?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "kitchen",
        "groceries",
        "electricity",
        "building_rent",
        "maintenance",
        "repairs",
        "salaries",
        "cleaning",
        "water",
        "internet",
        "miscellaneous",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    expenseDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ["upi", "bank_transfer", "cash", "card", "cheque"],
      default: "upi",
    },
    paidBy: { type: String, trim: true },
    vendor: { type: String, trim: true },
    description: { type: String, trim: true },
    receiptKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ expenseDate: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
