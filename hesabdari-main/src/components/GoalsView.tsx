import React, { useState } from 'react';
import {
  Target, Plus, PiggyBank, Sparkles, CheckCircle2,
  Trash2, Edit3, ArrowUpRight, Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CurrencyType, SavingsGoal } from '../types';
import { formatMoney, toEnglishDigits, toPersianDigits } from '../utils/jalali';

interface GoalsViewProps {
  goals: SavingsGoal[];
  currency: CurrencyType;
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddFundsToGoal: (goalId: string, amount: number) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  currency,
  onSaveGoal,
  onDeleteGoal,
  onAddFundsToGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  // Form state
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('خرید و تجهیزات');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setCategory('تجهیزات کاری');
    setTargetAmountStr('');
    setTargetDate('1405/09/30');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setCategory(goal.category);
    setTargetAmountStr(goal.targetAmount ? goal.targetAmount.toLocaleString('en-US') : '');
    setTargetDate(goal.targetDate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTarget = parseInt(toEnglishDigits(targetAmountStr.replace(/,/g, '')), 10) || 0;
    if (rawTarget <= 0 || !title.trim()) {
      alert('لطفاً عنوان و مبلغ هدف معتبری وارد کنید.');
      return;
    }

    const payload: SavingsGoal = {
      id: editingGoal?.id || `goal-${Date.now()}`,
      title: title.trim(),
      category: category.trim(),
      targetAmount: rawTarget,
      currentAmount: editingGoal?.currentAmount || 0,
      targetDate: targetDate || '1405/12/29',
      icon: 'Target',
      color: '#3b82f6',
      isCompleted: (editingGoal?.currentAmount || 0) >= rawTarget,
    };

    onSaveGoal(payload);
    setIsModalOpen(false);
  };

  const openDepositModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmountStr('');
    setIsAddFundsModalOpen(true);
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseInt(toEnglishDigits(depositAmountStr.replace(/,/g, '')), 10) || 0;
    if (amount <= 0) return;

    onAddFundsToGoal(selectedGoal.id, amount);

    // Trigger confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsAddFundsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">صندوق اهداف و پس‌انداز (قلک هوشمند)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            برنامه‌ریزی خرید، مسافرت، پس‌انداز بازنشستگی یا صندوق اضطراری
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف هدف پس‌انداز جدید</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-300 font-bold">کل مبلغ پس‌انداز شده برای اهداف</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {formatMoney(totalSaved, currency)}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-300">مجموع تارگت: {formatMoney(totalTarget, currency)}</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {toPersianDigits(overallPercentage)}٪ تحقق یافته
            </div>
          </div>
        </div>

        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const percent = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const isDone = g.currentAmount >= g.targetAmount;

          return (
            <div
              key={g.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all ${
                isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold ${
                        isDone ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                    >
                      {isDone ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{g.title}</h4>
                      <span className="text-[11px] text-slate-400">{g.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">
                      ذخیره شده: {formatMoney(g.currentAmount, currency)}
                    </span>
                    <span className={isDone ? 'text-emerald-600 font-black' : 'text-blue-600'}>
                      {toPersianDigits(percent)}٪
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>هدف: {formatMoney(g.targetAmount, currency)}</span>
                    <span>موعد: {g.targetDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {isDone ? (
                  <div className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    تبریک! هدف کامل شد 🎉
                  </div>
                ) : (
                  <button
                    onClick={() => openDepositModal(g)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    واریز به قلک پس‌انداز
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingGoal ? 'ویرایش هدف پس‌انداز' : 'تعریف هدف پس‌انداز جدید'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان هدف (مثال: خرید خودرو، لپ‌تاپ جدید، سفر ترکیه)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان هدف..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    دسته‌بندی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="تجهیزات و ابزار">تجهیزات و ابزار</option>
                    <option value="امنیت مالی و اضطراری">امنیت مالی و اضطراری</option>
                    <option value="گردشگری و سفر">گردشگری و سفر</option>
                    <option value="خرید خودرو / مسکن">خرید خودرو / مسکن</option>
                    <option value="سرمایه‌گذاری">سرمایه‌گذاری</option>
                    <option value="متفرقه">متفرقه</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاریخ موعد (شمسی)
                  </label>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    placeholder="1405/10/30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ هدف (تومان)
                </label>
                <input
                  type="text"
                  value={targetAmountStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setTargetAmountStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
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
                  ذخیره هدف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit to Goal Modal */}
      {isAddFundsModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              واریز پس‌انداز به {selectedGoal.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              مبلغ واریزی به قلک را وارد کنید:
            </p>

            <form onSubmit={handleExecuteDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ واریز (تومان)
                </label>
                <input
                  type="text"
                  value={depositAmountStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setDepositAmountStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۲,۰۰۰,۰۰۰"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFundsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  ثبت پس‌انداز 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
