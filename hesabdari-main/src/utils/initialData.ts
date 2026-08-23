import {
  BankAccount, Category, Transaction, Budget,
  DebtLoan, SavingsGoal, GoogleSheetsSyncStatus, AIAdvisorData,
  Waybill, FuelRecord, TruckInstallmentLoan, SayadCheque, TelegramConfig
} from '../types';
import { getTodayJalali } from './jalali';

const today = getTodayJalali();

// 1. Raw / Clean Initial State (بدون تراکنش و حساب بانکی پیش‌فرض)
export const INITIAL_ACCOUNTS: BankAccount[] = [];

export const INITIAL_CATEGORIES: Category[] = [
  // Expense Categories (مخارج ناوگان و خودرو سنگین)
  {
    id: 'cat-fuel',
    name: 'سوخت و گازوئیل',
    type: 'expense',
    icon: 'Fuel',
    color: '#f59e0b',
    subcategories: ['گازوئیل سهمیه‌ای (۶۰۰ تومان)', 'گازوئیل آزاد (۳۰۰۰ تومان)', 'ادبلو (AdBlue)', 'روغن موتور و فیلترها'],
  },
  {
    id: 'cat-repairs',
    name: 'تعمیرات و لوازم یدکی',
    type: 'expense',
    icon: 'Wrench',
    color: '#ef4444',
    subcategories: ['تعویض لاستیک و تیوب', 'مکانیکی و موتوری', 'لنت و سیستم ترمز', 'برق و دیاگ', 'جلوبندی و زیربندی'],
  },
  {
    id: 'cat-toll',
    name: 'عوارض، پارکینگ و باسکول',
    type: 'expense',
    icon: 'Receipt',
    color: '#6366f1',
    subcategories: ['عوارض آزادراه و الکترونیکی', 'توزین و باسکول', 'پارکینگ و بارانداز', 'باربندی، چادر و سیم بکسل'],
  },
  {
    id: 'cat-insurance',
    name: 'بیمه، معاینه و عوارض سالانه',
    type: 'expense',
    icon: 'Shield',
    color: '#0ea5e9',
    subcategories: ['بیمه شخص ثالث کشنده', 'بیمه بدنه', 'معاینه فنی', 'کارت سلامت و هوشمند راننده'],
  },
  {
    id: 'cat-driver-exp',
    name: 'مخارج روزانه و راه راننده',
    type: 'expense',
    icon: 'Utensils',
    color: '#10b981',
    subcategories: ['غذا و رستوران جاده', 'خرید خوراک و تنقلات', 'استراحتگاه و حمام'],
  },
  {
    id: 'cat-fine',
    name: 'جرایم رانندگی و پلیس راه',
    type: 'expense',
    icon: 'AlertTriangle',
    color: '#dc2626',
  },
  {
    id: 'cat-housing',
    name: 'مخارج خانواده و مسکن',
    type: 'expense',
    icon: 'Home',
    color: '#8b5cf6',
    subcategories: ['اجاره‌بها و اقساط مسکن', 'قبوض آب، برق، گاز و تلفن', 'خرید مایحتاج منزل'],
  },
  {
    id: 'cat-other-exp',
    name: 'سایر مخارج متفرقه',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748b',
  },

  // Income Categories (درآمدهای حمل بار و ناوگان)
  {
    id: 'cat-freight',
    name: 'کرایه بارنامه و حمل بار',
    type: 'income',
    icon: 'Truck',
    color: '#10b981',
    subcategories: ['صافی کرایه سرویس', 'پیش‌کرایه (بیعانه)', 'پس‌کرایه (تسویه پایانه)', 'حق توقف و اضافه تناژ'],
  },
  {
    id: 'cat-bonus',
    name: 'پاداش و انعام تخلیه سریع',
    type: 'income',
    icon: 'Gift',
    color: '#0ea5e9',
  },
  {
    id: 'cat-investment',
    name: 'سایر درآمدها و سود بانکی',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8b5cf6',
  },
];

export const INITIAL_WAYBILLS: Waybill[] = [];
export const INITIAL_FUEL_RECORDS: FuelRecord[] = [];
export const INITIAL_INSTALLMENT_LOANS: TruckInstallmentLoan[] = [];
export const INITIAL_CHEQUES: SayadCheque[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_DEBTS: DebtLoan[] = [];
export const INITIAL_GOALS: SavingsGoal[] = [];

export const INITIAL_SYNC_STATUS: GoogleSheetsSyncStatus = {
  isConnected: false,
  userEmail: null,
  userPhoto: null,
  spreadsheetId: null,
  spreadsheetUrl: null,
  lastSyncedAt: null,
};

export const INITIAL_TELEGRAM_CONFIG: TelegramConfig = {
  isConnected: false,
  botToken: '',
  chatId: '',
  channelUsername: '',
  driverName: '',
  notifyOnNewWaybill: true,
  notifyOnFuel: true,
  notifyOnChequeDueDate: true,
  notifyOnInstallmentDueDate: true,
  notifyDailySummary: false,
  lastTestStatus: null,
  lastTestMessage: '',
  lastSyncedAt: null,
};

export const INITIAL_AI_ADVISOR: AIAdvisorData = {
  overallScore: 100,
  summaryAnalysis: 'سامانه حسابداری امیر آماده ثبت اولین بارنامه، سوخت و کارت‌های بانکی شماست. با ثبت اولین اطلاعات، تحلیل‌های هوشمند فعال خواهند شد.',
  recommendations: [
    'برای شروع، کارت یا حساب‌های بانکی دریافت کرایه و پرداخت گازوئیل را ثبت فرمایید.',
    'بارنامه‌های جدید و سوخت‌گیری‌ها را منظم ثبت کنید تا تراز سود و زیان (P&L) ناوگان دقیق محاسبه شود.',
    'برای دریافت آنی گزارشات، ربات تلگرام را در تب اتصال به تلگرام فعال فرمایید.',
  ],
  warnings: [],
  generatedAt: today.formatted,
};

// 2. Sample Demo Data (اختیاری جهت بررسی و آزمایش در صورت تمایل کاربر)
export const SAMPLE_DEMO_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-demo-1',
    name: 'کارت اصلی دریافت کرایه‌ها',
    bankName: 'بانک ملی ایران',
    accountType: 'card',
    cardNumber: '۶۰۳۷-۹۹۷۴-۵۵۱۱-۲۲۴۴',
    iban: 'IR990170000000112233445566',
    balance: 55000000,
    color: 'from-blue-600 to-indigo-700',
    createdAt: today.formatted,
  },
  {
    id: 'acc-demo-2',
    name: 'کارت گازوئیل و سوخت جاده',
    bankName: 'بانک ملت',
    accountType: 'card',
    cardNumber: '۶۱۰۴-۳۳۷۸-۹۹۵۴-۱۲۰۳',
    iban: 'IR140120000000001234567890',
    balance: 15000000,
    color: 'from-amber-600 to-orange-700',
    createdAt: today.formatted,
  },
];

export const SAMPLE_DEMO_WAYBILLS: Waybill[] = [
  {
    id: 'wb-demo-1',
    waybillNumber: '۹۸۴۵۱۲۰۳',
    jalaliDate: today.formatted,
    origin: 'بندرعباس (اسکله شهید رجایی)',
    destination: 'تهران (شورآباد)',
    cargoType: 'لوازم یدکی کانتینری',
    weightTon: 24.5,
    shipperOrCompany: 'شرکت حمل‌ونقل خلیج فارس',
    totalFreight: 36000000,
    commission: 3600000,
    netFare: 32400000,
    advancePaid: 15000000,
    remainingAmount: 17400000,
    paymentStatus: 'partial',
    deliveryStatus: 'in_transit',
    receivingAccountId: 'acc-demo-1',
    notes: 'تحویل بارنامه فردا در انبار مقصد - بیعانه دریافت شد',
    createdAt: new Date().toISOString(),
  },
];
