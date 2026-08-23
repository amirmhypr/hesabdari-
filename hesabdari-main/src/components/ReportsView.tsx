import React, { useState } from 'react';
import {
  BarChart3, Download, TrendingUp, TrendingDown,
  DollarSign, Fuel, Wrench, Shield, Receipt,
  CheckCircle2, Printer, Calendar
} from 'lucide-react';
import { Waybill, FuelRecord, Transaction, BankAccount, CurrencyType } from '../types';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

interface ReportsViewProps {
  waybills: Waybill[];
  fuelRecords: FuelRecord[];
  transactions: Transaction[];
  accounts: BankAccount[];
  currency: CurrencyType;
  onExportCSV: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  waybills,
  fuelRecords,
  transactions,
  accounts,
  currency,
  onExportCSV,
}) => {
  const today = getTodayJalali();

  // Financial calculations
  const totalWaybillNetFare = waybills.reduce((sum, w) => sum + w.netFare, 0);
  const totalWaybillGross = waybills.reduce((sum, w) => sum + w.totalFreight, 0);
  const totalCommission = waybills.reduce((sum, w) => sum + w.commission, 0);

  const totalFuelCost = fuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
  const totalFuelLiters = fuelRecords.reduce((sum, f) => sum + f.liters, 0);

  // Categorized expenses from general ledger
  let totalRepairs = 0;
  let totalTolls = 0;
  let totalInsurance = 0;
  let totalDriverLiving = 0;
  let otherExpenses = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      if (tx.categoryId === 'cat-repairs' || tx.title.includes('تعمیر') || tx.title.includes('لاستیک')) {
        totalRepairs += tx.amount;
      } else if (tx.categoryId === 'cat-toll' || tx.title.includes('عوارض') || tx.title.includes('باسکول')) {
        totalTolls += tx.amount;
      } else if (tx.categoryId === 'cat-insurance' || tx.title.includes('بیمه')) {
        totalInsurance += tx.amount;
      } else if (tx.categoryId === 'cat-driver-exp' || tx.title.includes('غذا')) {
        totalDriverLiving += tx.amount;
      } else if (tx.categoryId !== 'cat-fuel') {
        otherExpenses += tx.amount;
      }
    }
  });

  const totalAllOperatingExpenses = totalFuelCost + totalRepairs + totalTolls + totalInsurance + totalDriverLiving + otherExpenses;
  const netProfit = totalWaybillNetFare - totalAllOperatingExpenses;
  const profitMargin = totalWaybillNetFare > 0 ? Math.round((netProfit / totalWaybillNetFare) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              گزارش جامع سود و زیان و عملکرد ناوگان
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              صورت سود و زیان واقعی (P&L)، حاشیه سود عملیاتی و تحلیل هزینه‌های استهلاک
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">چاپ گزارش</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>دریافت فایل اکسل (CSV)</span>
          </button>
        </div>
      </div>

      {/* Main KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-sm space-y-2">
          <span className="text-xs text-emerald-100 font-bold block">سود خالص نهایی ناوگان</span>
          <div className="text-2xl sm:text-3xl font-black">
            {formatMoney(netProfit, currency)}
          </div>
          <p className="text-xs text-emerald-100/90 pt-1 border-t border-white/10">
            حاشیه سود عملیاتی: <strong>{toPersianDigits(profitMargin)}٪</strong> از کل درآمد کرایه
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-xs text-slate-400 font-bold block">مجموع درآمد صافی کرایه‌ها</span>
          <div className="text-2xl font-black text-slate-900">
            {formatMoney(totalWaybillNetFare, currency)}
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
            کل کرایه ناخالص: {formatMoney(totalWaybillGross, currency)} (کسر {formatMoney(totalCommission, currency)} کمیسیون)
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-xs text-slate-400 font-bold block">مجموع کل هزینه‌های عملیاتی</span>
          <div className="text-2xl font-black text-rose-600">
            {formatMoney(totalAllOperatingExpenses, currency)}
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
            شامل سوخت، لاستیک، تعمیرات، عوارض و مخارج روزانه
          </p>
        </div>
      </div>

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              ریز درآمدهای سرویس‌های حمل بار
            </h3>
            <span className="text-xs font-bold text-emerald-600">
              {toPersianDigits(waybills.length)} بارنامه
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50">
              <span className="text-slate-600 font-medium">کرایه ناخالص کل محموله‌ها</span>
              <span className="font-bold text-slate-900">{formatMoney(totalWaybillGross, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-2xl bg-rose-50/60 text-rose-700">
              <span className="font-medium">کمیسیون پرداختی به پایانه‌ها و باربری‌ها (-)</span>
              <span className="font-bold">{formatMoney(totalCommission, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-50 text-emerald-800 font-bold">
              <span>صافی خالص سهم راننده / مالک</span>
              <span className="text-sm font-black">{formatMoney(totalWaybillNetFare, currency)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              تفکیک سرفصل‌های هزینه و استهلاک
            </h3>
            <span className="text-xs font-bold text-rose-600">
              {formatMoney(totalAllOperatingExpenses, currency)}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Fuel className="w-4 h-4 text-amber-500" />
                سوخت و گازوئیل ({toPersianDigits(totalFuelLiters)} لیتر)
              </span>
              <span className="font-bold text-slate-900">{formatMoney(totalFuelCost, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Wrench className="w-4 h-4 text-rose-500" />
                تعمیرات، قطعات یدکی و لاستیک
              </span>
              <span className="font-bold text-slate-900">{formatMoney(totalRepairs, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Receipt className="w-4 h-4 text-indigo-500" />
                عوارض آزادراه، باسکول و پارکینگ
              </span>
              <span className="font-bold text-slate-900">{formatMoney(totalTolls, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Shield className="w-4 h-4 text-blue-500" />
                بیمه، معاینه فنی و مدارک
              </span>
              <span className="font-bold text-slate-900">{formatMoney(totalInsurance, currency)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                مخارج روزانه و راه راننده
              </span>
              <span className="font-bold text-slate-900">{formatMoney(totalDriverLiving, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
