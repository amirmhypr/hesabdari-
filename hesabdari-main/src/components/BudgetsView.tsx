import React, { useState } from 'react';
import {
  PieChart, Plus, AlertTriangle, CheckCircle2, TrendingUp,
  Edit3, Trash2, ShieldCheck, Sparkles
} from 'lucide-react';
import { Budget, Category, CurrencyType } from '../types';
import { formatMoney, toEnglishDigits, toPersianDigits } from '../utils/jalali';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  currency: CurrencyType;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  currency,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimitStr, setMonthlyLimitStr] = useState('');

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId(expenseCategories[0]?.id || '');
    setMonthlyLimitStr('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setMonthlyLimitStr(budget.monthlyLimit ? budget.monthlyLimit.toLocaleString('en-US') : '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawLimit = parseInt(toEnglishDigits(monthlyLimitStr.replace(/,/g, '')), 10) || 0;
    if (rawLimit <= 0) {
      alert('لطفاً سقف بودجه معتبری وارد کنید.');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);

    const payload: Budget = {
      id: editingBudget?.id || `b-${Date.now()}`,
      categoryId,
      categoryName: cat?.name || 'سایر',
      monthlyLimit: rawLimit,
      currentSpent: editingBudget?.currentSpent || 0,
      period: '1405-06',
    };

    onSaveBudget(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">بودجه‌بندی هوشمند ماهانه</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تعریف سقف مجاز مخارج برای هر دسته‌بندی و کنترل نشتی‌های مالی
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف سقف بودجه جدید</span>
        </button>
      </div>

      {/* Overall Budget Overview Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">وضعیت کل بودجه‌های این ماه</h3>
              <p className="text-xs text-slate-500">
                مصرف {formatMoney(totalSpent, currency)} از مجموع {formatMoney(totalBudgeted, currency)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                overallPercentage > 100
                  ? 'bg-red-100 text-red-800'
                  : overallPercentage > 80
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {toPersianDigits(overallPercentage)}٪ مصرف شده
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage > 100
                ? 'bg-red-500'
                : overallPercentage > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Individual Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const percent = b.monthlyLimit > 0 ? Math.round((b.currentSpent / b.monthlyLimit) * 100) : 0;
          const isExceeded = percent > 100;
          const isWarning = percent >= 80 && percent <= 100;
          const remaining = Math.max(0, b.monthlyLimit - b.currentSpent);

          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    >
                      {isExceeded ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.categoryName}</h4>
                      <span className="text-[11px] text-slate-400">سقف ماهانه</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">
                      خرج شده: {formatMoney(b.currentSpent, currency)}
                    </span>
                    <span
                      className={
                        isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }
                    >
                      {toPersianDigits(percent)}٪
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  سقف: <span className="font-bold text-slate-800">{formatMoney(b.monthlyLimit, currency)}</span>
                </span>
                <span className={`font-bold ${isExceeded ? 'text-rose-600' : 'text-slate-600'}`}>
                  {isExceeded
                    ? `سرریز: ${formatMoney(b.currentSpent - b.monthlyLimit, currency)}`
                    : `مانده: ${formatMoney(remaining, currency)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingBudget ? 'ویرایش سقف بودجه' : 'تعریف سقف بودجه جدید'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انتخاب دسته‌بندی
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  سقف مجاز مخارج در ماه (تومان)
                </label>
                <input
                  type="text"
                  value={monthlyLimitStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setMonthlyLimitStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  ذخیره سقف بودجه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
