import React, { useState } from 'react';
import {
  HandCoins, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2,
  Clock, AlertCircle, Trash2, Edit3, User, Calendar
} from 'lucide-react';
import { CurrencyType, DebtLoan } from '../types';
import { formatMoney, getTodayJalali, toEnglishDigits, toPersianDigits } from '../utils/jalali';

interface DebtsViewProps {
  debts: DebtLoan[];
  currency: CurrencyType;
  onSaveDebt: (debt: DebtLoan) => void;
  onDeleteDebt: (id: string) => void;
  onSettleDebt: (id: string, amount: number) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  currency,
  onSaveDebt,
  onDeleteDebt,
  onSettleDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'debt' | 'loan'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<DebtLoan | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');

  // Add / Edit form state
  const [editingDebt, setEditingDebt] = useState<DebtLoan | null>(null);
  const [type, setType] = useState<'debt' | 'loan'>('debt');
  const [personName, setPersonName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const totalLoans = debts
    .filter((d) => d.type === 'loan' && d.status === 'active')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalDebts = debts
    .filter((d) => d.type === 'debt' && d.status === 'active')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const filteredDebts = debts.filter((d) => {
    if (activeTab === 'all') return true;
    return d.type === activeTab;
  });

  const openAddModal = () => {
    setEditingDebt(null);
    setType('debt');
    setPersonName('');
    setAmountStr('');
    setDueDate(getTodayJalali().formatted);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (debt: DebtLoan) => {
    setEditingDebt(debt);
    setType(debt.type);
    setPersonName(debt.personName);
    setAmountStr(debt.amount ? debt.amount.toLocaleString('en-US') : '');
    setDueDate(debt.jalaliDueDate || getTodayJalali().formatted);
    setNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseInt(toEnglishDigits(amountStr.replace(/,/g, '')), 10) || 0;
    if (rawAmount <= 0 || !personName.trim()) {
      alert('لطفاً نام طرف حساب و مبلغ معتبر وارد کنید.');
      return;
    }

    const payload: DebtLoan = {
      id: editingDebt?.id || `debt-${Date.now()}`,
      type,
      personName: personName.trim(),
      amount: rawAmount,
      paidAmount: editingDebt?.paidAmount || 0,
      dueDate: dueDate || getTodayJalali().formatted,
      jalaliDueDate: dueDate || getTodayJalali().formatted,
      status: (editingDebt?.paidAmount || 0) >= rawAmount ? 'settled' : 'active',
      notes: notes.trim() || undefined,
      createdAt: editingDebt?.createdAt || new Date().toISOString(),
    };

    onSaveDebt(payload);
    setIsModalOpen(false);
  };

  const openPayModal = (debt: DebtLoan) => {
    setSelectedDebtForPay(debt);
    const remaining = debt.amount - debt.paidAmount;
    setPayAmountStr(remaining.toLocaleString('en-US'));
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPay) return;
    const payAmount = parseInt(toEnglishDigits(payAmountStr.replace(/,/g, '')), 10) || 0;
    if (payAmount <= 0) return;

    onSettleDebt(selectedDebtForPay.id, payAmount);
    setIsPayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">بدهی‌ها، مطالبات و اقساط وام</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت طلب از دیگران، بدهی به اشخاص و پیگیری موعد سررسید چک و اقساط
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت بدهی / طلب جدید</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Receivables / Loans to others */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800">مجموع طلب‌های من از دیگران</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">
                {formatMoney(totalLoans, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Payables / Debts to others */}
        <div className="bg-rose-50/70 border border-rose-200/80 p-5 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-800">مجموع بدهی‌های من به دیگران</span>
              <div className="text-xl sm:text-2xl font-black text-rose-900 mt-0.5">
                {formatMoney(totalDebts, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          همه موارد ({toPersianDigits(debts.length)})
        </button>
        <button
          onClick={() => setActiveTab('loan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'loan' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          طلب‌های من (دریافتی)
        </button>
        <button
          onClick={() => setActiveTab('debt')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'debt' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          بدهی‌های من (پرداختی)
        </button>
      </div>

      {/* Debts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDebts.map((item) => {
          const isLoan = item.type === 'loan';
          const isSettled = item.status === 'settled';
          const remaining = Math.max(0, item.amount - item.paidAmount);
          const percent = item.amount > 0 ? Math.round((item.paidAmount / item.amount) * 100) : 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isSettled ? 'border-slate-200 opacity-70' : isLoan ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                        isSettled ? 'bg-slate-400' : isLoan ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      {isLoan ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.personName}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isLoan ? 'طلب من' : 'بدهی من'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDebt(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مبلغ کل:</span>
                    <span className="font-bold text-slate-900">{formatMoney(item.amount, currency)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">پرداخت شده:</span>
                    <span className="font-bold text-emerald-600">{formatMoney(item.paidAmount, currency)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مانده تسویه:</span>
                    <span className="font-black text-rose-600">{formatMoney(remaining, currency)}</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>موعد سررسید: {item.jalaliDueDate}</span>
                    <span>{toPersianDigits(percent)}٪</span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {isSettled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    تسویه کامل شده
                  </span>
                ) : (
                  <button
                    onClick={() => openPayModal(item)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    ثبت پرداخت / تسویه
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingDebt ? 'ویرایش بدهی / طلب' : 'ثبت بدهی یا طلب جدید'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('debt')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'debt' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  بدهی من (پرداختی)
                </button>
                <button
                  type="button"
                  onClick={() => setType('loan')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'loan' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  طلب من (دریافتی)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام شخص یا موسسه (طرف حساب)
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="مثال: علی احمدی / قسط وام بانک..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ (تومان)
                </label>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setAmountStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۵,۰۰۰,۰۰۰"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ سررسید (شمسی)
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="1405/06/30"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  یادداشت و جزئیات
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات اختیاری..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {isPayModalOpen && selectedDebtForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ثبت پرداخت برای {selectedDebtForPay.personName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              مبلغ پرداختی را وارد کنید تا از مانده بدهی/طلب کسر شود:
            </p>

            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ پرداخت (تومان)
                </label>
                <input
                  type="text"
                  value={payAmountStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setPayAmountStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  تایید پرداخت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
