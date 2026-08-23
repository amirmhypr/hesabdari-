import React, { useEffect } from 'react';
import {
  LayoutDashboard, Truck, Fuel, ReceiptText, CreditCard,
  Building2, FileText, HandCoins, BarChart3, PieChart,
  Target, Sparkles, FileSpreadsheet, X, ChevronLeft, Send,
  HelpCircle, ShieldCheck, Smartphone
} from 'lucide-react';
import { GoogleSheetsSyncStatus, NavTab, TelegramConfig } from '../types';
import { toPersianDigits } from '../utils/jalali';

export interface SidebarProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onTabChange?: (tab: NavTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  waybillsCount?: number;
  fuelCount?: number;
  transactionsCount?: number;
  installmentsCount?: number;
  chequesCount?: number;
  debtsCount?: number;
  goalsCount?: number;
  isSheetsConnected?: boolean;
  sheetsSync?: GoogleSheetsSyncStatus;
  onOpenGoogleSheets?: () => void;
  onOpenAndroidInstall?: () => void;
  telegramConfig?: TelegramConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  onTabChange,
  isOpenMobile = false,
  onCloseMobile = () => {},
  waybillsCount = 0,
  fuelCount = 0,
  transactionsCount = 0,
  installmentsCount = 0,
  chequesCount = 0,
  debtsCount = 0,
  goalsCount = 0,
  isSheetsConnected,
  sheetsSync,
  onOpenGoogleSheets,
  onOpenAndroidInstall,
  telegramConfig,
}) => {
  const active = currentTab || activeTab || 'dashboard';
  const isConnected = isSheetsConnected ?? Boolean(sheetsSync?.isConnected);
  const isTelegramConnected = Boolean(telegramConfig?.isConnected);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const handleSelect = (tabId: NavTab | 'sheets' | 'android') => {
    if (tabId === 'sheets') {
      if (onOpenGoogleSheets) {
        onOpenGoogleSheets();
      }
    } else if (tabId === 'android') {
      if (onOpenAndroidInstall) {
        onOpenAndroidInstall();
      }
    } else {
      if (onSelectTab) {
        onSelectTab(tabId as NavTab);
      }
      if (onTabChange) {
        onTabChange(tabId as NavTab);
      }
    }
    if (isOpenMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const navSections = [
    {
      title: 'ناوگان و باربری',
      items: [
        {
          id: 'dashboard' as NavTab,
          label: 'داشبورد و آمار کل',
          icon: LayoutDashboard,
        },
        {
          id: 'waybills' as NavTab,
          label: 'بارنامه‌ها و سرویس‌ها',
          icon: Truck,
          badge: waybillsCount > 0 ? toPersianDigits(waybillsCount) : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'fuel' as NavTab,
          label: 'سوخت و گازوئیل',
          icon: Fuel,
          badge: fuelCount > 0 ? toPersianDigits(fuelCount) : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
      ],
    },
    {
      title: 'دفاتر مالی و حساب‌ها',
      items: [
        {
          id: 'transactions' as NavTab,
          label: 'تراکنش‌ها و ریزحساب',
          icon: ReceiptText,
          badge: transactionsCount > 0 ? toPersianDigits(transactionsCount) : undefined,
        },
        {
          id: 'accounts' as NavTab,
          label: 'کارت‌ها و حساب‌ها',
          icon: CreditCard,
        },
        {
          id: 'installments' as NavTab,
          label: 'وام‌ها و اقساط خودرو',
          icon: Building2,
          badge: installmentsCount > 0 ? toPersianDigits(installmentsCount) : undefined,
          badgeColor: 'bg-indigo-100 text-indigo-800',
        },
        {
          id: 'cheques' as NavTab,
          label: 'دفتر چک‌های صیادی',
          icon: FileText,
          badge: chequesCount > 0 ? toPersianDigits(chequesCount) : undefined,
          badgeColor: 'bg-teal-100 text-teal-800',
        },
        {
          id: 'debts' as NavTab,
          label: 'بدهی‌ها و طلبکاری‌ها',
          icon: HandCoins,
          badge: debtsCount > 0 ? toPersianDigits(debtsCount) : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
      ],
    },
    {
      title: 'اتصالات و گزارشات هوشمند',
      items: [
        {
          id: 'telegram' as NavTab,
          label: 'ارتباط با تلگرام (ربات)',
          icon: Send,
          badge: isTelegramConnected ? 'متصل' : 'تنظیم',
          badgeColor: isTelegramConnected ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-slate-100 text-slate-500',
          highlight: !isTelegramConnected,
        },
        {
          id: 'android' as any,
          label: 'نسخه اندروید (نصب)',
          icon: Smartphone,
          badge: 'PWA / APK',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
        },
        {
          id: 'reports' as NavTab,
          label: 'گزارش سود و زیان (P&L)',
          icon: BarChart3,
        },
        {
          id: 'budgets' as NavTab,
          label: 'بودجه‌بندی هوشمند',
          icon: PieChart,
        },
        {
          id: 'goals' as NavTab,
          label: 'اهداف و پس‌انداز',
          icon: Target,
          badge: goalsCount > 0 ? toPersianDigits(goalsCount) : undefined,
        },
        {
          id: 'ai' as NavTab,
          label: 'دستیار و هوش مصنوعی',
          icon: Sparkles,
        },
        {
          id: 'sheets' as any,
          label: 'Google Sheets و اکسل',
          icon: FileSpreadsheet,
          badge: isConnected ? 'متصل' : 'آفلاین',
          badgeColor: isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500',
        },
      ],
    },
  ];

  const renderNavList = () => (
    <nav className="space-y-4">
      {navSections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-1">
            {section.title}
          </span>

          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-black'
                    : item.highlight && item.id === 'telegram'
                    ? 'bg-sky-50 text-sky-700 hover:bg-sky-100/80 border border-sky-200/50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : item.id === 'telegram'
                        ? 'text-sky-600'
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate text-right">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside
        id="desktop-app-sidebar"
        className="w-64 shrink-0 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs hidden lg:flex flex-col justify-between self-start sticky top-20 z-30 max-h-[calc(100vh-6rem)] overflow-hidden"
      >
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-4 select-none">
          {renderNavList()}
        </div>

        {/* Bottom Status Card */}
        <div className="pt-3 mt-3 border-t border-slate-100 shrink-0">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-black text-slate-800 block text-[11px]">حسابداری امیر</span>
              <span className="text-[10px] text-slate-400">سامانه هوشمند ناوگان</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-700 font-bold">آنلاین</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile & Tablet Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-over Drawer Panel */}
          <div
            id="mobile-app-drawer"
            className="relative z-50 w-72 sm:w-80 bg-white h-full shadow-2xl flex flex-col justify-between p-4 border-l border-slate-200 overflow-hidden animate-slide-in-right"
            dir="rtl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm shadow-emerald-600/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">حسابداری امیر</h3>
                  <p className="text-[10px] text-slate-400">منوی ناوبری و بخش‌های برنامه</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-mobile-drawer"
                onClick={onCloseMobile}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {renderNavList()}
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-slate-100 shrink-0 space-y-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-slate-800 block text-[11px]">حسابداری امیر</span>
                  <span className="text-[10px] text-slate-400">ورژن بارنامه و ناوگان</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>فعال</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
