import React, { useState } from 'react';
import {
  Send, Bot, CheckCircle2, XCircle, RefreshCw, Sparkles,
  Share2, BellRing, ShieldCheck, AlertCircle, Info, ExternalLink,
  MessageSquare, FileText, Truck, Fuel, Building2, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { TelegramConfig, Waybill, FuelRecord, SayadCheque, TruckInstallmentLoan, CurrencyType, Transaction } from '../types';
import {
  sendTelegramMessage,
  formatWaybillForTelegram,
  formatFuelForTelegram,
  formatChequeAlertForTelegram,
  formatInstallmentAlertForTelegram,
  formatProfitLossForTelegram,
  createTelegramShareUrl,
  parseTelegramCommandText
} from '../services/telegramService';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

interface TelegramViewProps {
  config: TelegramConfig;
  onSaveConfig: (newConfig: TelegramConfig) => void;
  waybills: Waybill[];
  fuelRecords: FuelRecord[];
  cheques: SayadCheque[];
  installments: TruckInstallmentLoan[];
  transactions: Transaction[];
  currency: CurrencyType;
  onSaveWaybill?: (waybill: Waybill) => void;
  onSaveFuelRecord?: (fuel: FuelRecord) => void;
}

export const TelegramView: React.FC<TelegramViewProps> = ({
  config,
  onSaveConfig,
  waybills,
  fuelRecords,
  cheques,
  installments,
  transactions,
  currency,
  onSaveWaybill,
  onSaveFuelRecord,
}) => {
  const [formData, setFormData] = useState<TelegramConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'dispatch' | 'simulator' | 'guide'>('settings');

  // Simulator state
  const [incomingText, setIncomingText] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Quick Dispatch Status
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setTestResult({
      success: true,
      message: 'تنظیمات تلگرام با موفقیت در حافظه سامانه ذخیره گردید.',
    });
  };

  const handleTestConnection = async () => {
    if (!formData.botToken || !formData.chatId) {
      setTestResult({
        success: false,
        message: 'لطفاً ابتدا توکن ربات (Bot Token) و شناسه چت (Chat ID) را وارد فرمایید.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const today = getTodayJalali();
    const testMsg = `🚀 <b>اتصال موفق ربات تلگرام | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
✅ ارتباط نرم‌افزار حسابداری ناوگان و رانندگان با این چت تلگرام برقرار شد.
👤 <b>نام کاربر:</b> ${formData.driverName || 'مدیر ناوگان'}
📅 <b>تاریخ و زمان:</b> ${today.dayName} ${today.formatted}
🤖 <b>وضعیت ربات:</b> فعال و آماده دریافت گزارشات، بارنامه‌ها و هشدارهای سررسید.
━━━━━━━━━━━━━━━━━
💡 <i>حسابداری امیر - سامانه هوشمند مدیریت مالی و ناوگان</i>`;

    const res = await sendTelegramMessage(formData.botToken, formData.chatId, testMsg);
    setIsTesting(false);

    if (res.success) {
      const updated = {
        ...formData,
        isConnected: true,
        lastTestStatus: 'success' as const,
        lastTestMessage: 'پیام تست با موفقیت ارسال شد.',
        lastSyncedAt: today.formatted,
      };
      setFormData(updated);
      onSaveConfig(updated);
      setTestResult({
        success: true,
        message: 'پیام آزمایشی با موفقیت به تلگرام شما ارسال شد! اتصال ربات فعال است.',
      });
    } else {
      setTestResult({
        success: false,
        message: `خطا در ارسال پیام: ${res.error || 'پاسخی از تلگرام دریافت نشد.'}`,
      });
    }
  };

  // Quick Send Handlers
  const handleSendProfitLossReport = async () => {
    if (!formData.botToken || !formData.chatId) {
      alert('لطفاً ابتدا توکن ربات و شناسه چت را در تب تنظیمات وارد نمایید.');
      return;
    }

    const totalRevenue = waybills.reduce((sum, w) => sum + w.netFare, 0) +
      transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const fuelCost = fuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
    const commissions = waybills.reduce((sum, w) => sum + w.commission, 0);
    const maintenanceCost = transactions.filter(t => t.categoryId === 'cat-repairs').reduce((sum, t) => sum + t.amount, 0);
    const tollAndOtherCost = transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-repairs' && t.categoryId !== 'cat-fuel').reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = fuelCost + commissions + maintenanceCost + tollAndOtherCost;
    const netProfit = totalRevenue - totalExpenses;

    const reportMsg = formatProfitLossForTelegram(
      {
        totalRevenue,
        fuelCost,
        commissions,
        maintenanceCost,
        tollAndOtherCost,
        totalExpenses,
        netProfit,
        waybillsCount: waybills.length,
      },
      currency
    );

    setDispatchStatus('در حال ارسال گزارش مالی به تلگرام...');
    const res = await sendTelegramMessage(formData.botToken, formData.chatId, reportMsg);
    if (res.success) {
      setDispatchStatus('✅ گزارش مالی با موفقیت به تلگرام ارسال شد!');
    } else {
      setDispatchStatus(`❌ خطا در ارسال: ${res.error}`);
    }
    setTimeout(() => setDispatchStatus(null), 6000);
  };

  const handleSendChequesAlert = async () => {
    const pendingCheques = cheques.filter(c => c.status === 'pending');
    if (pendingCheques.length === 0) {
      alert('هیچ چک صیادی در وضعیت انتظار برای ارسال وجود ندارد.');
      return;
    }

    setDispatchStatus('در حال ارسال هشدارهای چک صیادی...');
    let sentCount = 0;
    for (const chq of pendingCheques.slice(0, 3)) {
      const msg = formatChequeAlertForTelegram(chq, currency);
      const res = await sendTelegramMessage(formData.botToken, formData.chatId, msg);
      if (res.success) sentCount++;
    }

    setDispatchStatus(`✅ ${toPersianDigits(sentCount)} فقره هشدار چک صیادی به تلگرام ارسال گردید.`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  const handleSendLoansAlert = async () => {
    const activeLoans = installments.filter(l => l.status === 'active');
    if (activeLoans.length === 0) {
      alert('هیچ وام فعالی ثبت نشده است.');
      return;
    }

    setDispatchStatus('در حال ارسال یادآوری اقساط...');
    let sentCount = 0;
    for (const loan of activeLoans) {
      const msg = formatInstallmentAlertForTelegram(loan, currency);
      const res = await sendTelegramMessage(formData.botToken, formData.chatId, msg);
      if (res.success) sentCount++;
    }

    setDispatchStatus(`✅ یادآوری اقساط به تلگرام ارسال شد (${toPersianDigits(sentCount)} تسهیلات).`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  const handleSimulateText = () => {
    if (!incomingText.trim()) return;
    const parsed = parseTelegramCommandText(incomingText);
    setParsedResult(parsed);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Send className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  اتصال و همگام‌سازی با ربات تلگرام
                </h2>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  formData.isConnected
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                    : 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                }`}>
                  {formData.isConnected ? 'ربات متصل و فعال' : 'نیازمند تنظیم و اتصال'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
                ارسال خودکار گزارش بارنامه‌ها، سوخت، هشدار سررسید چک‌های صیادی و اقساط ماهانه به چت یا کانال تلگرام راننده و مدیر ناوگان.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !formData.botToken}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-sky-50 text-xs sm:text-sm font-black shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'در حال ارسال تست...' : 'تست اتصال ربات'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>تنظیمات توکن و شناسه چت</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dispatch'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>ارسال مستقیم گزارشات به تلگرام</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ثبت هوشمند از پیام تلگرام</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'guide'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>راهنمای ساخت ربات با BotFather</span>
        </button>
      </div>

      {/* Dispatch Status Alert */}
      {dispatchStatus && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm font-bold animate-fade-in flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{dispatchStatus}</span>
        </div>
      )}

      {/* Test Result Alert */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 ${
          testResult.success
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* TAB 1: Settings Form */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">پیکربندی ربات تلگرام اختصاصی</h3>
                <p className="text-xs text-slate-500">توکن ارائه‌شده توسط BotFather و شناسه چت مقصد را وارد نمایید.</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  توکن ربات تلگرام (Bot Token) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={formData.botToken}
                    onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                    placeholder="مثال: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  این توکن پس از ارسال دستور <code>/newbot</code> در ربات @BotFather تلگرام به شما داده می‌شود.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    شناسه چت یا کانال (Chat ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.chatId}
                    onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                    placeholder="مثال: 123456789 یا @MyFleetChannel"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    شناسه کاربری شما از طریق ربات <code>@userinfobot</code> قابل دریافت است.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نام راننده یا ناوگان (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={formData.driverName || ''}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    placeholder="مثال: راننده اف‌اچ ۵۰۰ - امیر"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-blue-600" />
                  اعلان‌های خودکار در تلگرام
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnNewWaybill}
                      onChange={(e) => setFormData({ ...formData, notifyOnNewWaybill: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">ارسال خودکار بارنامه پس از ثبت</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnFuel}
                      onChange={(e) => setFormData({ ...formData, notifyOnFuel: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">ارسال فاکتور سوخت‌گیری گازوئیل</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnChequeDueDate}
                      onChange={(e) => setFormData({ ...formData, notifyOnChequeDueDate: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">هشدار سررسید چک‌های صیادی</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnInstallmentDueDate}
                      onChange={(e) => setFormData({ ...formData, notifyOnInstallmentDueDate: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-700">یادآوری اقساط لیزینگ و وام</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
                >
                  ذخیره تنظیمات تلگرام
                </button>
              </div>
            </form>
          </div>

          {/* Quick Help Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold">امنیت و حریم خصوصی تلگرام</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ارتباط ربات با استفاده از پروتکل رمزنگاری رسمی Telegram Bot API انجام شده و کلیه توکن‌ها صرفاً در مرورگر خود شما ذخیره می‌شوند.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                لینک‌های پرکاربرد تلگرام
              </h4>
              <div className="space-y-2 text-xs">
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-700 font-bold transition-colors"
                >
                  <span>ربات ساخت ربات (@BotFather)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-700 font-bold transition-colors"
                >
                  <span>دریافت Chat ID من (@userinfobot)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Direct Dispatch */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Profit & Loss Report */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">گزارش سود و زیان (P&L)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ارسال تراز مالی کامل شامل کل کرایه‌ها، کمیسیون‌ها، هزینه سوخت و سود خالص به تلگرام.
              </p>
            </div>
            <button
              onClick={handleSendProfitLossReport}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              ارسال تراز مالی به تلگرام
            </button>
          </div>

          {/* Card 2: Cheques Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <BellRing className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">هشدار سررسید چک‌های صیادی</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ارسال شناسه ۱۶ رقمی صیاد و موعد وصول چک‌های دریافتی یا صادره به تلگرام.
              </p>
            </div>
            <button
              onClick={handleSendChequesAlert}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              ارسال چک‌های در انتظار
            </button>
          </div>

          {/* Card 3: Loans & Installments Alert */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">یادآوری اقساط لیزینگ خودرو</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ارسال مبالغ قسط ماه، روز سررسید و مانده بدهی تسهیلات به تلگرام راننده.
              </p>
            </div>
            <button
              onClick={handleSendLoansAlert}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              ارسال موعد اقساط به تلگرام
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Message Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">ثبت سریع اطلاعات از پیام تلگرام</h3>
              <p className="text-xs text-slate-500">
                متن پیام ارسال‌شده در گروه، کانال یا چت تلگرام را اینجا وارد نمایید تا به بارنامه یا سوخت تبدیل شود.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              rows={4}
              value={incomingText}
              onChange={(e) => setIncomingText(e.target.value)}
              placeholder="مثال ۱: سوخت‌گیری ۳۵۰ لیتر گازوئیل سهمیه‌ای ۲۱۰ هزار تومان جایگاه سیرجان کیلومتر ۳۴۲۵۰۰&#10;مثال ۲: بارنامه بندر به تهران کرایه ۳۶ میلیون بیعانه ۱۵ میلیون تناژ ۲۴ تن"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateText}
                disabled={!incomingText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                تجزیه و استخراج اطلاعات
              </button>

              <button
                onClick={() => {
                  setIncomingText('سوخت‌گیری ۳۵۰ لیتر گازوئیل ۲۱۰ هزار تومان جایگاه سیرجان کیلومتر ۳۴۲۵۰۰');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                نمونه سوخت
              </button>

              <button
                onClick={() => {
                  setIncomingText('بارنامه بندرعباس به تهران کرایه ۳۶ میلیون بیعانه ۱۵ میلیون تناژ ۲۴ تن');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                نمونه بارنامه
              </button>
            </div>

            {parsedResult && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">نتیجه پردازش:</span>
                  <span className="text-xs font-bold text-blue-600">{parsedResult.explanation}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono dir-ltr text-left overflow-x-auto">
                  <pre>{JSON.stringify(parsedResult.parsedData, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BotFather Step-by-Step Guide */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">آموزش گام به گام ساخت ربات تلگرام در ۱ دقیقه</h3>
            <p className="text-xs text-slate-500">برای اتصال رایگان و نامحدود، این ۳ مرحله ساده را انجام دهید:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                ۱
              </span>
              <h4 className="text-sm font-bold text-slate-900">ساخت ربات با BotFather</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                در تلگرام به آیدی <code>@BotFather</code> پیام دهید و دستور <code>/newbot</code> را بفرستید. یک نام و یک آیدی با پسوند bot برای آن تعیین فرمایید.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                ۲
              </span>
              <h4 className="text-sm font-bold text-slate-900">کپی کردن HTTP API Token</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ربات بات‌فادر یک متن طولانی مانند <code>123456:ABC-DEF...</code> به شما می‌دهد. آن را کپی کرده و در فیلد <b>Bot Token</b> برنامه بچسبانید.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                ۳
              </span>
              <h4 className="text-sm font-bold text-slate-900">دریافت Chat ID</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                به ربات <code>@userinfobot</code> یک پیام ارسال کنید تا عدد شناسه عددی شما (Id) را نمایش دهد. سپس دکمه <b>تست اتصال</b> را بزنید.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
