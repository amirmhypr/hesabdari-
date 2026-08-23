import {
  BankAccount, Category, Transaction, Budget,
  DebtLoan, SavingsGoal, GoogleSheetsSyncStatus, AIAdvisorData, CurrencyType,
  Waybill, FuelRecord, TruckInstallmentLoan, SayadCheque, TelegramConfig
} from '../types';
import {
  INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS, INITIAL_DEBTS, INITIAL_GOALS,
  INITIAL_SYNC_STATUS, INITIAL_AI_ADVISOR,
  INITIAL_WAYBILLS, INITIAL_FUEL_RECORDS, INITIAL_INSTALLMENT_LOANS, INITIAL_CHEQUES,
  INITIAL_TELEGRAM_CONFIG, SAMPLE_DEMO_ACCOUNTS, SAMPLE_DEMO_WAYBILLS
} from './initialData';

const STORAGE_KEYS = {
  ACCOUNTS: 'hesabdari_amir_accounts_v1',
  CATEGORIES: 'hesabdari_amir_categories_v1',
  TRANSACTIONS: 'hesabdari_amir_transactions_v1',
  WAYBILLS: 'hesabdari_amir_waybills_v1',
  FUEL_RECORDS: 'hesabdari_amir_fuel_v1',
  INSTALLMENTS: 'hesabdari_amir_installments_v1',
  CHEQUES: 'hesabdari_amir_cheques_v1',
  BUDGETS: 'hesabdari_amir_budgets_v1',
  DEBTS: 'hesabdari_amir_debts_v1',
  GOALS: 'hesabdari_amir_goals_v1',
  SYNC_STATUS: 'hesabdari_amir_sync_v1',
  TELEGRAM_CONFIG: 'hesabdari_amir_telegram_v1',
  AI_ADVISOR: 'hesabdari_amir_ai_advisor_v1',
  CURRENCY: 'hesabdari_amir_currency_v1',
};

export interface AppStateData {
  accounts: BankAccount[];
  categories: Category[];
  transactions: Transaction[];
  waybills: Waybill[];
  fuelRecords: FuelRecord[];
  installments: TruckInstallmentLoan[];
  cheques: SayadCheque[];
  budgets: Budget[];
  debts: DebtLoan[];
  goals: SavingsGoal[];
  sheetsSync: GoogleSheetsSyncStatus;
  telegramConfig: TelegramConfig;
  aiAdvisor: AIAdvisorData;
  currency: CurrencyType;
}

export function loadInitialAppState(): AppStateData {
  try {
    const rawAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const rawCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const rawTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const rawWaybills = localStorage.getItem(STORAGE_KEYS.WAYBILLS);
    const rawFuel = localStorage.getItem(STORAGE_KEYS.FUEL_RECORDS);
    const rawInstallments = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    const rawCheques = localStorage.getItem(STORAGE_KEYS.CHEQUES);
    const rawBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    const rawDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawSync = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    const rawTelegram = localStorage.getItem(STORAGE_KEYS.TELEGRAM_CONFIG);
    const rawAi = localStorage.getItem(STORAGE_KEYS.AI_ADVISOR);
    const rawCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);

    let parsedSync: Partial<GoogleSheetsSyncStatus> | null = null;
    if (rawSync) {
      try {
        parsedSync = JSON.parse(rawSync);
      } catch {
        parsedSync = null;
      }
    }

    const safeSync: GoogleSheetsSyncStatus = {
      isConnected: Boolean(parsedSync?.isConnected),
      userEmail: parsedSync?.userEmail ?? null,
      userPhoto: parsedSync?.userPhoto ?? null,
      spreadsheetId: parsedSync?.spreadsheetId ?? null,
      spreadsheetUrl: parsedSync?.spreadsheetUrl ?? null,
      lastSyncedAt: parsedSync?.lastSyncedAt ?? null,
    };

    let safeTelegram = INITIAL_TELEGRAM_CONFIG;
    if (rawTelegram) {
      try {
        safeTelegram = { ...INITIAL_TELEGRAM_CONFIG, ...JSON.parse(rawTelegram) };
      } catch {
        safeTelegram = INITIAL_TELEGRAM_CONFIG;
      }
    }

    return {
      accounts: rawAccounts !== null ? JSON.parse(rawAccounts) : INITIAL_ACCOUNTS,
      categories: rawCategories !== null ? JSON.parse(rawCategories) : INITIAL_CATEGORIES,
      transactions: rawTransactions !== null ? JSON.parse(rawTransactions) : INITIAL_TRANSACTIONS,
      waybills: rawWaybills !== null ? JSON.parse(rawWaybills) : INITIAL_WAYBILLS,
      fuelRecords: rawFuel !== null ? JSON.parse(rawFuel) : INITIAL_FUEL_RECORDS,
      installments: rawInstallments !== null ? JSON.parse(rawInstallments) : INITIAL_INSTALLMENT_LOANS,
      cheques: rawCheques !== null ? JSON.parse(rawCheques) : INITIAL_CHEQUES,
      budgets: rawBudgets !== null ? JSON.parse(rawBudgets) : INITIAL_BUDGETS,
      debts: rawDebts !== null ? JSON.parse(rawDebts) : INITIAL_DEBTS,
      goals: rawGoals !== null ? JSON.parse(rawGoals) : INITIAL_GOALS,
      sheetsSync: safeSync,
      telegramConfig: safeTelegram,
      aiAdvisor: rawAi !== null ? JSON.parse(rawAi) : INITIAL_AI_ADVISOR,
      currency: (rawCurrency as CurrencyType) || 'toman',
    };
  } catch (error) {
    console.error('Error loading data from localStorage', error);
    return {
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: INITIAL_TRANSACTIONS,
      waybills: INITIAL_WAYBILLS,
      fuelRecords: INITIAL_FUEL_RECORDS,
      installments: INITIAL_INSTALLMENT_LOANS,
      cheques: INITIAL_CHEQUES,
      budgets: INITIAL_BUDGETS,
      debts: INITIAL_DEBTS,
      goals: INITIAL_GOALS,
      sheetsSync: INITIAL_SYNC_STATUS,
      telegramConfig: INITIAL_TELEGRAM_CONFIG,
      aiAdvisor: INITIAL_AI_ADVISOR,
      currency: 'toman',
    };
  }
}

export function saveAppState(state: Partial<AppStateData>): void {
  try {
    if (state.accounts !== undefined) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
    if (state.categories !== undefined) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    if (state.transactions !== undefined) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    if (state.waybills !== undefined) localStorage.setItem(STORAGE_KEYS.WAYBILLS, JSON.stringify(state.waybills));
    if (state.fuelRecords !== undefined) localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify(state.fuelRecords));
    if (state.installments !== undefined) localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(state.installments));
    if (state.cheques !== undefined) localStorage.setItem(STORAGE_KEYS.CHEQUES, JSON.stringify(state.cheques));
    if (state.budgets !== undefined) localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
    if (state.debts !== undefined) localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(state.debts));
    if (state.goals !== undefined) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
    if (state.sheetsSync !== undefined) localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(state.sheetsSync));
    if (state.telegramConfig !== undefined) localStorage.setItem(STORAGE_KEYS.TELEGRAM_CONFIG, JSON.stringify(state.telegramConfig));
    if (state.aiAdvisor !== undefined) localStorage.setItem(STORAGE_KEYS.AI_ADVISOR, JSON.stringify(state.aiAdvisor));
    if (state.currency !== undefined) localStorage.setItem(STORAGE_KEYS.CURRENCY, state.currency);
  } catch (error) {
    console.error('Error saving data to localStorage', error);
  }
}

export function resetAllDataToClean(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function generateCSVReport(
  transactions: Transaction[],
  accounts: BankAccount[]
): string {
  const headers = ['شناسه', 'نوع', 'عنوان', 'مبلغ (تومان)', 'دسته‌بندی', 'حساب بانکی', 'طرف حساب', 'تاریخ شمسی', 'توضیحات'];
  const rows = transactions.map((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const typeLabel = t.type === 'income' ? 'درآمد / کرایه' : t.type === 'expense' ? 'هزینه' : 'انتقال';
    return [
      t.id,
      typeLabel,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(acc?.name || '').replace(/"/g, '""')}"`,
      `"${(t.payeeOrPayer || '').replace(/"/g, '""')}"`,
      t.jalaliDate,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
