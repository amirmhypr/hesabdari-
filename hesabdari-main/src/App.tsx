import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { DebtsView } from './components/DebtsView';
import { GoalsView } from './components/GoalsView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { WaybillsView } from './components/WaybillsView';
import { FuelView } from './components/FuelView';
import { InstallmentsView } from './components/InstallmentsView';
import { ChequesView } from './components/ChequesView';
import { ReportsView } from './components/ReportsView';
import { TelegramView } from './components/TelegramView';
import { TransactionModal } from './components/TransactionModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AndroidInstallModal } from './components/AndroidInstallModal';

import {
  BankAccount, Category, Transaction, Budget, DebtLoan,
  SavingsGoal, GoogleSheetsSyncStatus, AIAdvisorData, CurrencyType, NavTab,
  Waybill, FuelRecord, TruckInstallmentLoan, SayadCheque, TelegramConfig
} from './types';
import {
  loadInitialAppState, saveAppState, generateCSVReport, resetAllDataToClean
} from './utils/storage';
import {
  INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS,
  INITIAL_WAYBILLS, INITIAL_FUEL_RECORDS, INITIAL_INSTALLMENT_LOANS,
  INITIAL_CHEQUES, INITIAL_BUDGETS, INITIAL_DEBTS, INITIAL_GOALS,
  INITIAL_TELEGRAM_CONFIG, SAMPLE_DEMO_ACCOUNTS, SAMPLE_DEMO_WAYBILLS
} from './utils/initialData';
import {
  sendTelegramMessage,
  formatWaybillForTelegram,
  formatFuelForTelegram,
  formatChequeAlertForTelegram,
  formatInstallmentAlertForTelegram
} from './services/telegramService';
import { getTodayJalali } from './utils/jalali';

export function App() {
  // 1. Core State
  const [isLoaded, setIsLoaded] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtLoan[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [installments, setInstallments] = useState<TruckInstallmentLoan[]>([]);
  const [cheques, setCheques] = useState<SayadCheque[]>([]);

  const [sheetsSync, setSheetsSync] = useState<GoogleSheetsSyncStatus>({
    isConnected: false,
    userEmail: null,
    userPhoto: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    lastSyncedAt: null,
  });
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(INITIAL_TELEGRAM_CONFIG);
  const [aiAdvisor, setAiAdvisor] = useState<AIAdvisorData | null>(null);
  const [currency, setCurrency] = useState<CurrencyType>('toman');

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 3. Modals & Dialogs
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Capture Android PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handlePromptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsAndroidModalOpen(false);
      }
    }
  };

  // Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load from local storage on startup
  useEffect(() => {
    const data = loadInitialAppState();
    setAccounts(data.accounts || []);
    setCategories(data.categories || INITIAL_CATEGORIES);
    setTransactions(data.transactions || []);
    setBudgets(data.budgets || []);
    setDebts(data.debts || []);
    setGoals(data.goals || []);
    setWaybills(data.waybills || []);
    setFuelRecords(data.fuelRecords || []);
    setInstallments(data.installments || []);
    setCheques(data.cheques || []);
    setSheetsSync(data.sheetsSync || {
      isConnected: false,
      userEmail: null,
      userPhoto: null,
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSyncedAt: null,
    });
    setTelegramConfig(data.telegramConfig || INITIAL_TELEGRAM_CONFIG);
    setAiAdvisor(data.aiAdvisor || null);
    setCurrency(data.currency || 'toman');
    setIsLoaded(true);
  }, []);

  // Save to local storage on any state update
  useEffect(() => {
    if (!isLoaded) return;
    saveAppState({
      accounts,
      categories,
      transactions,
      budgets,
      debts,
      goals,
      waybills,
      fuelRecords,
      installments,
      cheques,
      sheetsSync,
      telegramConfig,
      aiAdvisor,
      currency,
    });
  }, [
    accounts, categories, transactions, budgets, debts,
    goals, waybills, fuelRecords, installments, cheques,
    sheetsSync, telegramConfig, aiAdvisor, currency, isLoaded
  ]);

  // Recalculate budget currentSpent when transactions change
  useEffect(() => {
    if (!isLoaded) return;
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, currentSpent: spent };
      })
    );
  }, [transactions, isLoaded]);

  // Adjust account balance helper
  const adjustAccountBalance = (accId: string, delta: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, balance: acc.balance + delta } : acc))
    );
  };

  // --- Transactions Handlers ---
  const handleSaveTransaction = (savedTx: Transaction) => {
    setTransactions((prev) => {
      const exists = prev.find((t) => t.id === savedTx.id);
      if (exists) {
        // Revert old transaction's impact on account
        if (exists.type === 'expense') {
          adjustAccountBalance(exists.accountId, exists.amount);
        } else if (exists.type === 'income') {
          adjustAccountBalance(exists.accountId, -exists.amount);
        } else if (exists.type === 'transfer' && exists.toAccountId) {
          adjustAccountBalance(exists.accountId, exists.amount + (exists.transferFee || 0));
          adjustAccountBalance(exists.toAccountId, -exists.amount);
        }

        return prev.map((t) => (t.id === savedTx.id ? savedTx : t));
      }
      return [savedTx, ...prev];
    });

    // Apply new transaction's impact on account
    if (savedTx.type === 'expense') {
      adjustAccountBalance(savedTx.accountId, -savedTx.amount);
    } else if (savedTx.type === 'income') {
      adjustAccountBalance(savedTx.accountId, savedTx.amount);
    } else if (savedTx.type === 'transfer' && savedTx.toAccountId) {
      const totalOut = savedTx.amount + (savedTx.transferFee || 0);
      adjustAccountBalance(savedTx.accountId, -totalOut);
      adjustAccountBalance(savedTx.toAccountId, savedTx.amount);
    }

    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setConfirmState({
      isOpen: true,
      title: 'حذف تراکنش مالی',
      message: `آیا از حذف تراکنش «${tx.title}» به مبلغ ${tx.amount.toLocaleString('fa-IR')} تومان مطمئن هستید؟ موجودی حساب مربوطه اصلاح خواهد شد.`,
      onConfirm: () => {
        // Revert balance
        if (tx.type === 'expense') {
          adjustAccountBalance(tx.accountId, tx.amount);
        } else if (tx.type === 'income') {
          adjustAccountBalance(tx.accountId, -tx.amount);
        } else if (tx.type === 'transfer' && tx.toAccountId) {
          adjustAccountBalance(tx.accountId, tx.amount + (tx.transferFee || 0));
          adjustAccountBalance(tx.toAccountId, -tx.amount);
        }

        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Waybills Handlers ---
  const handleSaveWaybill = (waybill: Waybill) => {
    const isNew = !waybills.some((w) => w.id === waybill.id);

    setWaybills((prev) => {
      const exists = prev.find((w) => w.id === waybill.id);
      if (exists) {
        return prev.map((w) => (w.id === waybill.id ? waybill : w));
      }
      return [waybill, ...prev];
    });

    // If advance payment was received, optionally record income if new
    if (waybill.advancePaid > 0 && waybill.receivingAccountId) {
      const advanceTx: Transaction = {
        id: `tx-wb-adv-${waybill.id}`,
        type: 'income',
        title: `پیش‌کرایه بارنامه ${waybill.waybillNumber} (${waybill.cargoType})`,
        amount: waybill.advancePaid,
        categoryId: 'cat-freight',
        categoryName: 'کرایه بارنامه و حمل بار',
        subCategory: 'پیش‌کرایه (بیعانه)',
        accountId: waybill.receivingAccountId,
        jalaliDate: waybill.jalaliDate,
        notes: `مبدا: ${waybill.origin} به مقصد: ${waybill.destination}`,
        createdAt: new Date().toISOString(),
      };
      const existingAdv = transactions.find((t) => t.id === `tx-wb-adv-${waybill.id}`);
      if (!existingAdv) {
        handleSaveTransaction(advanceTx);
      }
    }

    // Auto-notify Telegram if enabled
    if (isNew && telegramConfig.isConnected && telegramConfig.notifyOnNewWaybill) {
      const tgMsg = formatWaybillForTelegram(waybill, currency);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, tgMsg).catch((err) =>
        console.error('Failed to dispatch waybill to Telegram:', err)
      );
    }
  };

  const handleDeleteWaybill = (id: string) => {
    const wb = waybills.find((w) => w.id === id);
    if (!wb) return;

    setConfirmState({
      isOpen: true,
      title: 'حذف بارنامه',
      message: `آیا از حذف بارنامه شماره «${wb.waybillNumber}» (${wb.cargoType}) اطمینان دارید؟`,
      onConfirm: () => {
        setWaybills((prev) => prev.filter((w) => w.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Fuel Records Handlers ---
  const handleSaveFuelRecord = (fuel: FuelRecord) => {
    const isNew = !fuelRecords.some((f) => f.id === fuel.id);

    setFuelRecords((prev) => {
      const exists = prev.find((f) => f.id === fuel.id);
      if (exists) {
        return prev.map((f) => (f.id === fuel.id ? fuel : f));
      }
      return [fuel, ...prev];
    });

    // Deduct fuel cost from selected account if new
    if (fuel.accountId && fuel.totalCost > 0) {
      const fuelTx: Transaction = {
        id: `tx-fuel-${fuel.id}`,
        type: 'expense',
        title: `سوخت‌گیری گازوئیل (${fuel.liters} لیتر - ${fuel.gasStationName || 'جایگاه'})`,
        amount: fuel.totalCost,
        categoryId: 'cat-fuel',
        categoryName: 'سوخت و گازوئیل',
        subCategory: fuel.fuelType === 'quota' ? 'گازوئیل سهمیه‌ای (۶۰۰ تومان)' : 'گازوئیل آزاد (۳۰۰۰ تومان)',
        accountId: fuel.accountId,
        jalaliDate: fuel.jalaliDate,
        notes: `کیلومتر: ${fuel.currentOdometer || '-'} | جایگاه: ${fuel.gasStationName || '-'}`,
        createdAt: new Date().toISOString(),
      };
      const existingTx = transactions.find((t) => t.id === `tx-fuel-${fuel.id}`);
      if (!existingTx) {
        handleSaveTransaction(fuelTx);
      }
    }

    // Auto-notify Telegram if enabled
    if (isNew && telegramConfig.isConnected && telegramConfig.notifyOnFuel) {
      const tgMsg = formatFuelForTelegram(fuel, currency);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, tgMsg).catch((err) =>
        console.error('Failed to dispatch fuel to Telegram:', err)
      );
    }
  };

  const handleDeleteFuelRecord = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف سابقه سوخت‌گیری',
      message: 'آیا از حذف این رکورد سوخت‌گیری اطمینان دارید؟',
      onConfirm: () => {
        setFuelRecords((prev) => prev.filter((f) => f.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Bank Accounts Handlers ---
  const handleSaveAccount = (account: BankAccount) => {
    setAccounts((prev) => {
      const exists = prev.find((a) => a.id === account.id);
      if (exists) {
        return prev.map((a) => (a.id === account.id ? account : a));
      }
      return [...prev, account];
    });
  };

  const handleDeleteAccount = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;

    setConfirmState({
      isOpen: true,
      title: 'حذف حساب بانکی',
      message: `آیا از حذف حساب «${acc.name}» اطمینان دارید؟`,
      onConfirm: () => {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleExecuteTransfer = (fromId: string, toId: string, amount: number, fee: number, notes: string) => {
    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    const today = getTodayJalali();
    const transferTx: Transaction = {
      id: `tx-tr-${Date.now()}`,
      type: 'transfer',
      title: `انتقال وجه از ${fromAcc.name} به ${toAcc.name}`,
      amount,
      categoryId: 'cat-transfer',
      categoryName: 'انتقال بین‌بانکی',
      accountId: fromId,
      toAccountId: toId,
      transferFee: fee,
      jalaliDate: today.formatted,
      createdAt: new Date().toISOString(),
      notes: notes || `کارت به کارت بین‌بانکی (${fromAcc.bankName} به ${toAcc.bankName})`,
    };

    handleSaveTransaction(transferTx);
  };

  // --- Installments Handlers ---
  const handleSaveInstallment = (loan: TruckInstallmentLoan) => {
    const isNew = !installments.some((l) => l.id === loan.id);

    setInstallments((prev) => {
      const exists = prev.find((l) => l.id === loan.id);
      if (exists) {
        return prev.map((l) => (l.id === loan.id ? loan : l));
      }
      return [loan, ...prev];
    });

    if (isNew && telegramConfig.isConnected && telegramConfig.notifyOnInstallmentDueDate) {
      const tgMsg = formatInstallmentAlertForTelegram(loan, currency);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, tgMsg).catch(console.error);
    }
  };

  const handleDeleteInstallment = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف تسهیلات / وام',
      message: 'آیا از حذف این وام و اقساط آن اطمینان دارید؟',
      onConfirm: () => {
        setInstallments((prev) => prev.filter((l) => l.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handlePayInstallmentMonth = (loanId: string) => {
    const loan = installments.find((l) => l.id === loanId);
    if (!loan || loan.paidCount >= loan.installmentCount) return;

    const today = getTodayJalali();
    const newPaidCount = loan.paidCount + 1;
    const isCompleted = newPaidCount >= loan.installmentCount;

    setInstallments((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              paidCount: newPaidCount,
              status: isCompleted ? 'completed' : 'active',
            }
          : l
      )
    );

    // Register expense transaction
    const installmentTx: Transaction = {
      id: `tx-inst-${loanId}-${newPaidCount}`,
      type: 'expense',
      title: `پرداخت قسط ${newPaidCount} از ${loan.installmentCount} (${loan.title})`,
      amount: loan.monthlyAmount,
      categoryId: 'cat-installments',
      categoryName: 'اقساط و تسهیلات خودرو',
      accountId: loan.accountId || accounts[0]?.id || 'acc-1',
      jalaliDate: today.formatted,
      notes: `پرداخت قسط ماهانه به ${loan.lenderName}`,
      createdAt: new Date().toISOString(),
    };

    handleSaveTransaction(installmentTx);
  };

  // --- Cheques Handlers ---
  const handleSaveCheque = (cheque: SayadCheque) => {
    const isNew = !cheques.some((c) => c.id === cheque.id);

    setCheques((prev) => {
      const exists = prev.find((c) => c.id === cheque.id);
      if (exists) {
        return prev.map((c) => (c.id === cheque.id ? cheque : c));
      }
      return [cheque, ...prev];
    });

    if (isNew && telegramConfig.isConnected && telegramConfig.notifyOnChequeDueDate) {
      const tgMsg = formatChequeAlertForTelegram(cheque, currency);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, tgMsg).catch(console.error);
    }
  };

  const handleDeleteCheque = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف چک صیادی',
      message: 'آیا از حذف این چک صیادی اطمینان دارید؟',
      onConfirm: () => {
        setCheques((prev) => prev.filter((c) => c.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleClearCheque = (chequeId: string, targetAccountId: string) => {
    const chq = cheques.find((c) => c.id === chequeId);
    if (!chq) return;

    setCheques((prev) =>
      prev.map((c) => (c.id === chequeId ? { ...c, status: 'cleared' } : c))
    );

    const today = getTodayJalali();
    const isReceived = chq.type === 'received';

    const clearTx: Transaction = {
      id: `tx-chq-clear-${chq.id}`,
      type: isReceived ? 'income' : 'expense',
      title: `وصول چک صیادی ${chq.chequeNumber} (${chq.drawerOrPayee})`,
      amount: chq.amount,
      categoryId: isReceived ? 'cat-freight' : 'cat-repairs',
      categoryName: isReceived ? 'کرایه بارنامه و حمل بار' : 'تعمیرات و لوازم یدکی',
      accountId: targetAccountId,
      jalaliDate: today.formatted,
      notes: `شناسه صیاد: ${chq.sayadId} | بانک ${chq.bankName}`,
      createdAt: new Date().toISOString(),
    };

    handleSaveTransaction(clearTx);
  };

  // --- Budgets, Debts & Goals Handlers ---
  const handleSaveBudget = (b: Budget) => {
    setBudgets((prev) => {
      const exists = prev.find((item) => item.id === b.id);
      if (exists) return prev.map((item) => (item.id === b.id ? b : item));
      return [...prev, b];
    });
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSaveDebt = (d: DebtLoan) => {
    setDebts((prev) => {
      const exists = prev.find((item) => item.id === d.id);
      if (exists) return prev.map((item) => (item.id === d.id ? d : item));
      return [...prev, d];
    });
  };

  const handleDeleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSettleDebt = (debtId: string) => {
    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? { ...d, paidAmount: d.amount, status: 'settled' }
          : d
      )
    );
  };

  const handleSaveGoal = (g: SavingsGoal) => {
    setGoals((prev) => {
      const exists = prev.find((item) => item.id === g.id);
      if (exists) return prev.map((item) => (item.id === g.id ? g : item));
      return [...prev, g];
    });
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddFundsToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = g.currentAmount + amount;
          return {
            ...g,
            currentAmount: updated,
            isCompleted: updated >= g.targetAmount,
          };
        }
        return g;
      })
    );
  };

  // --- Reset & Demo Data Handlers ---
  const handleResetDataToClean = () => {
    setConfirmState({
      isOpen: true,
      title: 'پاکسازی و شروع کاملاً خام (حسابداری امیر)',
      message: 'آیا می‌خواهید کلیه تراکنش‌ها، کارت‌های بانکی، بارنامه‌ها و رکوردها پاکسازی شوند و برنامه کاملاً خام آماده ثبت اطلاعات جدید شما گردد؟',
      onConfirm: () => {
        resetAllDataToClean();
        setAccounts([]);
        setTransactions([]);
        setWaybills([]);
        setFuelRecords([]);
        setInstallments([]);
        setCheques([]);
        setBudgets([]);
        setDebts([]);
        setGoals([]);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleLoadSampleDemo = () => {
    setAccounts(SAMPLE_DEMO_ACCOUNTS);
    setWaybills(SAMPLE_DEMO_WAYBILLS);
    setCurrentTab('dashboard');
  };

  // --- AI Advisor Handlers ---
  const handleRefreshAIAdvisor = async () => {
    setIsLoadingAI(true);
    try {
      const totalFreight = waybills.reduce((sum, w) => sum + w.netFare, 0);
      const totalFuel = fuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
      const pendingChequesSum = cheques.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounts,
          transactions,
          waybills,
          fuelRecords,
          cheques,
          totalFreight,
          totalFuel,
          pendingChequesSum,
        }),
      });

      if (res.ok) {
        const advisorResult = await res.json();
        setAiAdvisor(advisorResult);
      }
    } catch (err) {
      console.error('AI Advisor error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleScanReceipt = async (base64Image: string) => {
    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Scan receipt error:', err);
      return null;
    }
  };

  const handleParseSMS = async (smsText: string) => {
    try {
      const res = await fetch('/api/ai/parse-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsText }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Parse SMS error:', err);
      return null;
    }
  };

  const handleApplyAITransaction = (extracted: any) => {
    const tx: Transaction = {
      id: `tx-ai-${Date.now()}`,
      type: extracted.type || 'expense',
      title: extracted.title || 'تراکنش استخراج شده با هوش مصنوعی',
      amount: extracted.amount || 0,
      categoryId: extracted.categoryId || 'cat-fuel',
      categoryName: extracted.categoryName || 'سایر هزینه‌ها',
      subCategory: extracted.subCategory || undefined,
      accountId: accounts[0]?.id || 'acc-1',
      jalaliDate: extracted.jalaliDate || getTodayJalali().formatted,
      payeeOrPayer: extracted.merchantOrPayee || undefined,
      receiptImage: extracted.receiptImage || undefined,
      notes: extracted.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    handleSaveTransaction(tx);
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = generateCSVReport(transactions, accounts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hesabdari-amir-${getTodayJalali().formatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickAddTransaction={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        onOpenAIAdvisor={() => setCurrentTab('ai')}
        onOpenAndroidInstall={() => setIsAndroidModalOpen(true)}
        isSheetsConnected={Boolean(sheetsSync?.isConnected)}
        telegramConfig={telegramConfig}
        currency={currency}
        onToggleCurrency={() => setCurrency((prev) => (prev === 'toman' ? 'rial' : 'toman'))}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onResetDataToClean={handleResetDataToClean}
        onLoadSampleDemo={handleLoadSampleDemo}
      />

      {/* Main App Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8 pb-24 lg:pb-8 gap-6">
        {/* Desktop & Mobile Drawer Structural Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          waybillsCount={waybills.length}
          fuelCount={fuelRecords.length}
          transactionsCount={transactions.length}
          installmentsCount={installments.filter((i) => i.status === 'active').length}
          chequesCount={cheques.filter((c) => c.status === 'pending').length}
          debtsCount={debts.filter((d) => d.status === 'active').length}
          goalsCount={goals.length}
          isSheetsConnected={Boolean(sheetsSync?.isConnected)}
          sheetsSync={sheetsSync}
          telegramConfig={telegramConfig}
          onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
          onOpenAndroidInstall={() => setIsAndroidModalOpen(true)}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 w-full min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              budgets={budgets}
              debts={debts}
              goals={goals}
              currency={currency}
              aiAdvisor={aiAdvisor}
              telegramConfig={telegramConfig}
              onNavigateTab={setCurrentTab}
              onQuickAddTx={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
              waybillsCount={waybills.length}
              fuelCount={fuelRecords.length}
              chequesCount={cheques.filter((c) => c.status === 'pending').length}
              installmentsCount={installments.filter((i) => i.status === 'active').length}
            />
          )}

          {currentTab === 'waybills' && (
            <WaybillsView
              waybills={waybills}
              accounts={accounts}
              currency={currency}
              onSaveWaybill={handleSaveWaybill}
              onDeleteWaybill={handleDeleteWaybill}
            />
          )}

          {currentTab === 'fuel' && (
            <FuelView
              fuelRecords={fuelRecords}
              accounts={accounts}
              currency={currency}
              onSaveFuelRecord={handleSaveFuelRecord}
              onDeleteFuelRecord={handleDeleteFuelRecord}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              currency={currency}
              onAddTransaction={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onExportCSV={handleExportCSV}
              onOpenAIParser={() => setCurrentTab('ai')}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              transactions={transactions}
              currency={currency}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransfer={handleExecuteTransfer}
            />
          )}

          {currentTab === 'installments' && (
            <InstallmentsView
              installments={installments}
              accounts={accounts}
              currency={currency}
              onSaveInstallment={handleSaveInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              onPayInstallmentMonth={handlePayInstallmentMonth}
            />
          )}

          {currentTab === 'cheques' && (
            <ChequesView
              cheques={cheques}
              accounts={accounts}
              currency={currency}
              onSaveCheque={handleSaveCheque}
              onDeleteCheque={handleDeleteCheque}
              onClearCheque={handleClearCheque}
            />
          )}

          {currentTab === 'telegram' && (
            <TelegramView
              config={telegramConfig}
              onSaveConfig={setTelegramConfig}
              waybills={waybills}
              fuelRecords={fuelRecords}
              cheques={cheques}
              installments={installments}
              transactions={transactions}
              currency={currency}
              onSaveWaybill={handleSaveWaybill}
              onSaveFuelRecord={handleSaveFuelRecord}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              waybills={waybills}
              fuelRecords={fuelRecords}
              transactions={transactions}
              accounts={accounts}
              currency={currency}
              onExportCSV={handleExportCSV}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              categories={categories}
              currency={currency}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {currentTab === 'debts' && (
            <DebtsView
              debts={debts}
              currency={currency}
              onSaveDebt={handleSaveDebt}
              onDeleteDebt={handleDeleteDebt}
              onSettleDebt={handleSettleDebt}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsView
              goals={goals}
              currency={currency}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddFundsToGoal={handleAddFundsToGoal}
            />
          )}

          {currentTab === 'ai' && (
            <AIAdvisorView
              advisorData={aiAdvisor}
              isLoadingAdvisor={isLoadingAI}
              onRefreshAdvisor={handleRefreshAIAdvisor}
              onScanReceipt={handleScanReceipt}
              onParseSMS={handleParseSMS}
              onApplyParsedTransaction={handleApplyAITransaction}
              currency={currency}
              transactions={transactions}
              accounts={accounts}
              categories={categories}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        waybillsCount={waybills.length}
        transactionsCount={transactions.length}
      />

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        accounts={accounts}
        categories={categories}
        onScanReceipt={handleScanReceipt}
        currency={currency}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        syncStatus={sheetsSync}
        onUpdateSyncStatus={setSheetsSync}
        transactions={transactions}
        accounts={accounts}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Android PWA / APK Install Helper Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onPromptInstall={handlePromptInstall}
      />
    </div>
  );
}

export default App;
