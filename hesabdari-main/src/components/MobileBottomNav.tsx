import React from 'react';
import {
  LayoutDashboard, Truck, Fuel, ReceiptText, Menu, Send
} from 'lucide-react';
import { NavTab } from '../types';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileSidebar: () => void;
  waybillsCount?: number;
  transactionsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileSidebar,
  waybillsCount = 0,
  transactionsCount = 0,
}) => {
  const items = [
    {
      id: 'dashboard' as NavTab,
      label: 'داشبورد',
      icon: LayoutDashboard,
    },
    {
      id: 'waybills' as NavTab,
      label: 'بارنامه‌ها',
      icon: Truck,
      badge: waybillsCount > 0 ? waybillsCount : undefined,
    },
    {
      id: 'fuel' as NavTab,
      label: 'سوخت',
      icon: Fuel,
    },
    {
      id: 'transactions' as NavTab,
      label: 'تراکنش‌ها',
      icon: ReceiptText,
      badge: transactionsCount > 0 ? transactionsCount : undefined,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navbar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-3 flex lg:hidden items-center justify-around shadow-lg"
      dir="rtl"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            id={`mobile-nav-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              isActive
                ? 'text-emerald-600 font-black scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -left-2 w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? '+۹۹' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Full Menu trigger */}
      <button
        type="button"
        id="mobile-nav-all-menu"
        onClick={onOpenMobileSidebar}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-emerald-700 transition-all cursor-pointer group"
      >
        <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-600 transition-colors">
          <Menu className="w-4 h-4" />
        </div>
        <span className="text-[10px] mt-0.5 font-bold">بخش‌ها و منو</span>
      </button>
    </nav>
  );
};
