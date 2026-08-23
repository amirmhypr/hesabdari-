export type TransactionType = 'income' | 'expense' | 'transfer';
export type CurrencyType = 'toman' | 'rial' | 'usd';
export type NavTab =
  | 'dashboard'
  | 'waybills'
  | 'fuel'
  | 'transactions'
  | 'accounts'
  | 'installments'
  | 'cheques'
  | 'budgets'
  | 'debts'
  | 'goals'
  | 'reports'
  | 'ai'
  | 'telegram';

export interface TelegramConfig {
  isConnected: boolean;
  botToken: string;
  chatId: string;
  channelUsername?: string;
  driverName?: string;
  notifyOnNewWaybill: boolean;
  notifyOnFuel: boolean;
  notifyOnChequeDueDate: boolean;
  notifyOnInstallmentDueDate: boolean;
  notifyDailySummary: boolean;
  lastTestStatus?: 'success' | 'error' | null;
  lastTestMessage?: string;
  lastSyncedAt?: string | null;
}

export interface TelegramLog {
  id: string;
  type: 'waybill' | 'fuel' | 'cheque' | 'loan' | 'report' | 'test' | 'custom';
  title: string;
  message: string;
  status: 'sent' | 'failed';
  jalaliDate: string;
  time: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountType: 'card' | 'savings' | 'current' | 'cash' | 'gold' | 'crypto';
  cardNumber?: string;
  accountNumber?: string;
  iban?: string;
  balance: number;
  color: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  subcategories?: string[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  subCategory?: string;
  accountId: string;
  toAccountId?: string;
  transferFee?: number;
  jalaliDate: string;
  createdAt: string;
  payeeOrPayer?: string;
  receiptImage?: string;
  notes?: string;
  isWaybillIncome?: boolean;
  waybillId?: string;
}

export interface Waybill {
  id: string;
  waybillNumber: string;
  jalaliDate: string;
  origin: string;
  destination: string;
  cargoType: string;
  weightTon: number;
  shipperOrCompany: string;
  totalFreight: number;
  commission: number;
  netFare: number;
  advancePaid: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  deliveryStatus: 'delivered' | 'in_transit' | 'loading';
  receivingAccountId?: string;
  notes?: string;
  waybillImage?: string;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  jalaliDate: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelType: 'quota' | 'free';
  gasStationName: string;
  currentOdometer: number;
  accountId: string;
  notes?: string;
  createdAt: string;
}

export interface TruckInstallmentLoan {
  id: string;
  title: string;
  lenderName: string;
  totalLoanAmount: number;
  installmentCount: number;
  monthlyAmount: number;
  paidCount: number;
  nextDueDateJalali: string;
  dayOfMonth: number;
  status: 'active' | 'completed';
  accountId?: string;
  notes?: string;
  createdAt: string;
}

export interface SayadCheque {
  id: string;
  type: 'issued' | 'received'; // صادره / دریافتی
  chequeNumber: string;
  sayadId: string; // شناسه صیاد ۱۶ رقمی
  bankName: string;
  amount: number;
  drawerOrPayee: string; // صادرکننده یا دریافت‌کننده
  dueDateJalali: string;
  status: 'pending' | 'cleared' | 'bounced' | 'transferred';
  relatedType?: 'waybill' | 'repair' | 'installment' | 'other';
  relatedTitle?: string;
  image?: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  currentSpent: number;
  period: string; // e.g. 1405-06
}

export interface DebtLoan {
  id: string;
  type: 'debt' | 'loan';
  personName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  jalaliDueDate: string;
  status: 'active' | 'settled';
  notes?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
  color: string;
  isCompleted: boolean;
}

export interface GoogleSheetsSyncStatus {
  isConnected: boolean;
  userEmail: string | null;
  userPhoto: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
}

export interface AIAdvisorData {
  overallScore: number;
  summaryAnalysis: string;
  recommendations: string[];
  warnings?: string[];
  generatedAt?: string;
}
