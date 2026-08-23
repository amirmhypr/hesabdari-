import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownLeft,
  Calendar, ChevronLeft, Sparkles, MessageSquare, AlertCircle, Plus,
  CreditCard, ChevronRight, Truck, Fuel, FileText, Building2, Send,
  BarChart3, CheckCircle2, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie
} from 'recharts';
import { BankAccount, Budget, CurrencyType, DebtLoan, Transaction, AIAdvisorData, SavingsGoal, NavTab, TelegramConfig } from '../types';
import { formatMoney, toPersianDigits } from '../utils/jalali';

interface DashboardViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: DebtLoan[];
  goals?: SavingsGoal[];
  currency: CurrencyType;
  aiAdvisor?: AIAdvisorData | null;
  telegramConfig?: TelegramConfig;
  onNavigateTab: (tab: NavTab) => void;
  onQuickAddTx: () => void;
  onQuickSMS?: (smsText: string) => void;
  onSelectTransaction?: (t: Transaction) => void;
  onOpenGoogleSheets?: () => void;
  waybillsCount?: number;
  fuelCount?: number;
  chequesCount?: number;
  installmentsCount?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  budgets,
  debts,
  goals,
  currency,
  aiAdvisor,
  telegramConfig,
  onNavigateTab,
  onQuickAddTx,
  onQuickSMS,
  onSelectTransaction,
  onOpenGoogleSheets,
  waybillsCount = 0,
  fuelCount = 0,
  chequesCount = 0,
  installmentsCount = 0,
}) => {
  const [smsInput, setSmsInput] = useState('');
  const [isProcessingSMS, setIsProcessingSMS] = useState(false);

  // Financial Calculations
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category Distribution for Chart
  const categoryMap: { [key: string]: number } = {};
  expenseTransactions.forEach((t) => {
    categoryMap[t.categoryName] = (categoryMap[t.categoryName] || 0) + t.amount;
  });

  const categoryChartData = Object.keys(categoryMap).map((catName, idx) => {
    const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#0ea5e9', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];
    return {
      name: catName,
      value: categoryMap[catName],
      color: COLORS[idx % COLORS.length],
    };
  }).sort((a, b) => b.value - a.value).slice(0, 6);

  // Monthly Cashflow data
  const cashflowData = [
    { month: 'اردیبهشت', income: 0, expense: 0 },
    { month: 'خرداد', income: 0, expense: 0 },
    { month: 'تیر', income: 0, expense: 0 },
    { month: 'ماه جاری', income: totalIncome, expense: totalExpense },
  ];

  const pendingDebts = debts.filter(d => d.status === 'active');

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsInput.trim()) return;
    setIsProcessingSMS(true);
    if (onQuickSMS) onQuickSMS(smsInput);
    setSmsInput('');
    setIsProcessingSMS(false);
  };

  const isCleanState = accounts.length === 0 && transactions.length === 0 && waybillsCount === 0;

  return (
    <div className="space-y-6">
      {/* Quick Navigation Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('waybills')}
          className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">بارنامه‌ها</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {waybillsCount > 0 ? `${toPersianDigits(waybillsCount)} سرویس` : 'ثبت سرویس'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('fuel')}
          className="p-3.5 rounded-2xl bg-white hover:bg-amber-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">سوخت و گازوئیل</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {fuelCount > 0 ? `${toPersianDigits(fuelCount)} باک` : 'ثبت مصرف'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('cheques')}
          className="p-3.5 rounded-2xl bg-white hover:bg-teal-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">چک‌های صیادی</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {chequesCount > 0 ? `${toPersianDigits(chequesCount)} چک` : 'دفتر صیاد'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('installments')}
          className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">اقساط و وام</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {installmentsCount > 0 ? `${toPersianDigits(installmentsCount)} وام` : 'لیزینگ خودرو'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('telegram')}
          className="p-3.5 rounded-2xl bg-white hover:bg-sky-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">ربات تلگرام</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {telegramConfig?.isConnected ? 'متصل و فعال' : 'اتصال به تلگرام'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="p-3.5 rounded-2xl bg-white hover:bg-violet-50/70 border border-slate-200/80 shadow-2xs flex items-center gap-3 transition-all cursor-pointer text-right group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">سود و زیان (P&L)</span>
            <span className="text-[10px] text-slate-400 font-medium">صافی ناوگان</span>
          </div>
        </button>
      </div>

      {/* Clean / Raw State Banner (When database is empty) */}
      {isCleanState && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سامانه حسابداری امیر در حالت خام و آماده بهره‌برداری است</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              به سامانه هوشمند مدیریت مالی و ناوگان خوش آمدید
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              برای شروع، می‌توانید کارت‌های بانکی، اولین بارنامه، سوخت‌گیری یا اتصال به ربات تلگرام را با کلیک روی گزینه‌های زیر تنظیم نمایید:
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>افزودن کارت بانکی / حساب</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('waybills')}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>ثبت اولین بارنامه</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('telegram')}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>اتصال به ربات تلگرام</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">موجودی کل دارایی‌ها</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {formatMoney(totalBalance, currency)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>در {toPersianDigits(accounts.length)} حساب و کارت</span>
            <button
              type="button"
              onClick={() => onNavigateTab('accounts')}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              کارت‌ها
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مجموع درآمد ماه</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-teal-600 tracking-tight">
            {formatMoney(totalIncome, currency)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-teal-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{toPersianDigits(incomeTransactions.length)} فقره دریافتی</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مجموع هزینه‌های ماه</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-600 tracking-tight">
            {formatMoney(totalExpense, currency)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-700 font-medium">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{toPersianDigits(expenseTransactions.length)} مورد خرج‌کرد</span>
          </div>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">پس‌انداز و نرخ ذخیره</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight">
            {formatMoney(netSavings, currency)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>نرخ پس‌انداز:</span>
            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full font-bold">
              {toPersianDigits(savingsRate)}٪
            </span>
          </div>
        </div>
      </div>

      {/* 2. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">روند درآمد و هزینه</h3>
              <p className="text-xs text-slate-500">جریان ورودی و خروجی نقدی ناوگان</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">درآمد</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">هزینه</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [`${(Number(value)).toLocaleString('en-US')} تومان`, '']}
                  labelStyle={{ fontFamily: 'Vazirmatn', fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontFamily: 'Vazirmatn' }}
                />
                <Bar dataKey="income" name="درآمد" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="هزینه" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Donut Chart (1 Col) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">سهم هزینه‌ها</h3>
              <p className="text-xs text-slate-500">تفکیک مخارج به تفکیک دسته</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              بودجه‌بندی
            </button>
          </div>

          {categoryChartData.length > 0 ? (
            <>
              <div className="h-52 w-full relative" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toLocaleString('en-US')} تومان`, '']}
                      contentStyle={{ borderRadius: '12px', fontFamily: 'Vazirmatn' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                {categoryChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatMoney(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400 p-4 space-y-2">
              <PieChart className="w-8 h-8 text-slate-300" />
              <p className="text-xs">هنوز هزینه‌ای برای رسم نمودار ثبت نشده است.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bank Accounts & Quick SMS Parser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Cards */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">کارت‌ها و حساب‌های بانکی</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('accounts')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              مدیریت حساب‌ها
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${acc.color} text-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {acc.bankName}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{acc.name}</h4>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-xs font-black">
                      💳
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/70 font-mono tracking-widest dir-ltr text-right mb-1">
                      {acc.cardNumber || '**** **** ****'}
                    </div>
                    <div className="text-base font-black text-white">
                      {formatMoney(acc.balance, currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">هیچ کارت یا حسابی هنوز تعریف نشده است.</p>
              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                + افزودن کارت بانکی جدید
              </button>
            </div>
          )}
        </div>

        {/* Quick Bank SMS Parser Widget */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">ثبت سریع از پیامک بانکی</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              متن پیامک واریز یا برداشت از بانک را اینجا بچسبانید تا هوش مصنوعی خودکار ثبت کند:
            </p>

            <form onSubmit={handleSmsSubmit} className="space-y-3">
              <textarea
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                placeholder="مثال: برداشت مبلغ ۲۵۰،۰۰۰ ریال از کارت ۶۱۰۴... مانده: ۱۲،۵۰۰،۰۰۰ ریال..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isProcessingSMS || !smsInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isProcessingSMS ? 'در حال پردازش...' : 'تبدیل خودکار به تراکنش'}
              </button>
            </form>
          </div>

          {/* Pending debts reminder pill */}
          {pendingDebts.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-800 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{toPersianDigits(pendingDebts.length)} چک یا بدهی نزدیک سررسید</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('debts')}
                className="text-[11px] font-bold text-amber-900 underline cursor-pointer"
              >
                مشاهده
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Transactions Section */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">آخرین تراکنش‌ها</h3>
            <p className="text-xs text-slate-500">ریز ورودی‌ها و خروجی‌های مالی اخیر</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQuickAddTx}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold px-2 py-1 cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 6).map((tx) => {
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const account = accounts.find((a) => a.id === tx.accountId);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 rounded-2xl px-2.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500'
                          : isExpense
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isExpense ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 rotate-45" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tx.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium">{tx.categoryName}</span>
                        <span>•</span>
                        <span>{account?.name || 'حساب نامشخص'}</span>
                        <span>•</span>
                        <span>{tx.jalaliDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div
                      className={`text-sm sm:text-base font-black ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatMoney(tx.amount, currency)}
                    </div>
                    {tx.payeeOrPayer && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {tx.payeeOrPayer}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">هیچ تراکنشی هنوز ثبت نشده است.</p>
          </div>
        )}
      </div>
    </div>
  );
};
