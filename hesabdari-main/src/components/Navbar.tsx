import React, { useState, useRef, useEffect } from 'react';
import {
  Truck, Plus, Sparkles, FileSpreadsheet,
  Coins, Menu, Send, RotateCcw, Database, Check,
  Smartphone, MoreHorizontal, ChevronDown
} from 'lucide-react';
import { CurrencyType, NavTab, TelegramConfig } from '../types';
import { getTodayJalali } from '../utils/jalali';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onQuickAddTransaction: () => void;
  onOpenGoogleSheets: () => void;
  onOpenAIAdvisor: () => void;
  onOpenAndroidInstall?: () => void;
  isSheetsConnected: boolean;
  telegramConfig?: TelegramConfig;
  currency: CurrencyType;
  onToggleCurrency: () => void;
  onToggleMobileSidebar: () => void;
  onResetDataToClean?: () => void;
  onLoadSampleDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onQuickAddTransaction,
  onOpenGoogleSheets,
  onOpenAIAdvisor,
  onOpenAndroidInstall,
  isSheetsConnected,
  telegramConfig,
  currency,
  onToggleCurrency,
  onToggleMobileSidebar,
  onResetDataToClean,
  onLoadSampleDemo,
}) => {
  const today = getTodayJalali();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Right side in RTL: Brand & Mobile Sidebar Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            id="btn-open-sidebar-mobile"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            title="منوی ناوبری و بخش‌ها"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                  حسابداری امیر
                </h1>
                <span className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  نسخه ناوگان
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                {today.dayName} {today.formatted}
              </p>
            </div>
          </div>
        </div>

        {/* Left side in RTL: Streamlined Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Currency Toggle (Always Available) */}
          <button
            type="button"
            id="btn-toggle-currency"
            onClick={onToggleCurrency}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="تغییر واحد پول (تومان / ریال)"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-bold">{currency === 'toman' ? 'تومان' : 'ریال'}</span>
          </button>

          {/* Android App Button (Visible on sm screens and above) */}
          <button
            type="button"
            id="btn-navbar-android"
            onClick={onOpenAndroidInstall}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            title="نصب نسخه اندروید و اپلیکیشن گوشی"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>نسخه اندروید</span>
          </button>

          {/* Telegram Status (Visible on md screens and above) */}
          <button
            type="button"
            id="btn-navbar-telegram"
            onClick={() => onSelectTab('telegram')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
              currentTab === 'telegram'
                ? 'bg-sky-600 text-white border-sky-600'
                : telegramConfig?.isConnected
                ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="ارتباط با ربات تلگرام"
          >
            <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>{telegramConfig?.isConnected ? 'تلگرام فعال' : 'اتصال تلگرام'}</span>
          </button>

          {/* AI Advisor (Visible on lg screens and above) */}
          <button
            type="button"
            id="btn-navbar-ai"
            onClick={onOpenAIAdvisor}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
              currentTab === 'ai'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>هوش مصنوعی</span>
          </button>

          {/* More Tools & Settings Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="btn-navbar-more-options"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                showMoreMenu ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="ابزارها و تنظیمات بیشتر"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in divide-y divide-slate-100"
                dir="rtl"
              >
                {/* Mobile / Tablet Extra Links */}
                <div className="py-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (onOpenAndroidInstall) onOpenAndroidInstall();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>نصب نسخه اندروید</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">PWA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenGoogleSheets();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>اتصال به Google Sheets</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isSheetsConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isSheetsConnected ? 'متصل' : 'آفلاین'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onSelectTab('telegram');
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-500" />
                      <span>ربات تلگرام</span>
                    </div>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-md font-bold">
                      {telegramConfig?.isConnected ? 'فعال' : 'تنظیم'}
                    </span>
                  </button>
                </div>

                {/* Data Clean / Demo Setup */}
                <div className="py-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 px-2 block mb-0.5">مدیریت داده‌ها</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (onLoadSampleDemo) onLoadSampleDemo();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>بارگذاری داده‌های نمونه تستی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (onResetDataToClean) onResetDataToClean();
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>پاکسازی داده‌ها (حالت خام)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button: Add Transaction / Expense */}
          <button
            type="button"
            id="btn-quick-add-transaction"
            onClick={onQuickAddTransaction}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ثبت هزینه / درآمد</span>
            <span className="sm:hidden">ثبت جدید</span>
          </button>

        </div>
      </div>
    </header>
  );
};
