import React, { useState } from 'react';
import {
  CreditCard, Plus, Calendar, CheckCircle2,
  Clock, AlertCircle, Trash2, Edit, TrendingUp, Building2
} from 'lucide-react';
import { TruckInstallmentLoan, BankAccount, CurrencyType } from '../types';
import { formatMoney, toPersianDigits } from '../utils/jalali';

interface InstallmentsViewProps {
  installments: TruckInstallmentLoan[];
  accounts: BankAccount[];
  currency: CurrencyType;
  onSaveInstallment: (loan: TruckInstallmentLoan) => void;
  onDeleteInstallment: (id: string) => void;
  onPayInstallmentMonth: (loanId: string, accountId: string) => void;
}

export const InstallmentsView: React.FC<InstallmentsViewProps> = ({
  installments,
  accounts,
  currency,
  onSaveInstallment,
  onDeleteInstallment,
  onPayInstallmentMonth,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<TruckInstallmentLoan | null>(null);

  // Pay Modal
  const [payingLoan, setPayingLoan] = useState<TruckInstallmentLoan | null>(null);
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');

  // Form State
  const [title, setTitle] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [totalLoanAmount, setTotalLoanAmount] = useState<number | ''>('');
  const [installmentCount, setInstallmentCount] = useState<number | ''>(36);
  const [monthlyAmount, setMonthlyAmount] = useState<number | ''>('');
  const [paidCount, setPaidCount] = useState<number | ''>(0);
  const [nextDueDateJalali, setNextDueDateJalali] = useState('1405/06/25');
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>(25);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingLoan(null);
    setTitle('');
    setLenderName('شرکت واسپاری / بانک');
    setTotalLoanAmount('');
    setInstallmentCount(36);
    setMonthlyAmount('');
    setPaidCount(0);
    setNextDueDateJalali('1405/06/25');
    setDayOfMonth(25);
    setAccountId(accounts[0]?.id || '');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (loan: TruckInstallmentLoan) => {
    setEditingLoan(loan);
    setTitle(loan.title);
    setLenderName(loan.lenderName);
    setTotalLoanAmount(loan.totalLoanAmount);
    setInstallmentCount(loan.installmentCount);
    setMonthlyAmount(loan.monthlyAmount);
    setPaidCount(loan.paidCount);
    setNextDueDateJalali(loan.nextDueDateJalali);
    setDayOfMonth(loan.dayOfMonth);
    setAccountId(loan.accountId || accounts[0]?.id || '');
    setNotes(loan.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(installmentCount) || 1;
    const paid = Number(paidCount) || 0;
    const isCompleted = paid >= count;

    const loanData: TruckInstallmentLoan = {
      id: editingLoan ? editingLoan.id : `loan-${Date.now()}`,
      title: title.trim() || 'تسهیلات کشنده',
      lenderName: lenderName.trim() || 'بانک / لیزینگ',
      totalLoanAmount: Number(totalLoanAmount) || (Number(monthlyAmount) || 0) * count,
      installmentCount: count,
      monthlyAmount: Number(monthlyAmount) || 0,
      paidCount: paid,
      nextDueDateJalali: nextDueDateJalali.trim(),
      dayOfMonth: Number(dayOfMonth) || 25,
      status: isCompleted ? 'completed' : 'active',
      accountId,
      notes: notes.trim(),
      createdAt: editingLoan ? editingLoan.createdAt : new Date().toISOString(),
    };

    onSaveInstallment(loanData);
    setIsModalOpen(false);
  };

  const totalMonthlyCommitment = installments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.monthlyAmount, 0);

  const totalRemainingDebt = installments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + (i.installmentCount - i.paidCount) * i.monthlyAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              وام‌ها و جدول اقساط کشنده و ناوگان
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              مدیریت لیزینگ خودرو سنگین، اقساط ماهانه، سررسیدها و جدول تسویه
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تسهیلات / وام جدید</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">مجموع اقساط ماهانه فعال</span>
          <div className="text-base sm:text-xl font-black text-indigo-600">
            {formatMoney(totalMonthlyCommitment, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            تعهد پرداختی هر ماه
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">مانده کل تسهیلات و لیزینگ</span>
          <div className="text-base sm:text-xl font-black text-rose-600">
            {formatMoney(totalRemainingDebt, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            اصل بدهی اقساط باقیمانده
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">تعداد وام‌های فعال</span>
          <div className="text-base sm:text-xl font-black text-slate-800">
            {toPersianDigits(installments.filter((i) => i.status === 'active').length)} فقره
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            تحت پوشش جدول سررسید
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">تسهیلات تسویه‌شده</span>
          <div className="text-base sm:text-xl font-black text-emerald-600">
            {toPersianDigits(installments.filter((i) => i.status === 'completed').length)} فقره
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            کاملاً پرداخت شده
          </span>
        </div>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {installments.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">هیچ وامی ثبت نشده است</h4>
            <p className="text-xs text-slate-400">برای کنترل بهتر تعهدات ماهانه، اقساط لیزینگ یا وام خودرو را ثبت کنید.</p>
          </div>
        ) : (
          installments.map((loan) => {
            const percent = Math.round((loan.paidCount / loan.installmentCount) * 100);
            const remainingCount = loan.installmentCount - loan.paidCount;
            const remainingAmount = remainingCount * loan.monthlyAmount;

            return (
              <div
                key={loan.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{loan.title}</h3>
                      {loan.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          تسویه شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          فعال
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      تسهیلات‌دهنده: <strong className="text-slate-700">{loan.lenderName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(loan)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteInstallment(loan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">
                      پرداخت شده: {toPersianDigits(loan.paidCount)} از {toPersianDigits(loan.installmentCount)} قسط
                    </span>
                    <span className="text-indigo-600">{toPersianDigits(percent)}٪</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Details Banner */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">مبلغ هر قسط:</span>
                    <span className="font-black text-slate-900">{formatMoney(loan.monthlyAmount, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">مانده کل وام:</span>
                    <span className="font-black text-rose-600">{formatMoney(remainingAmount, currency)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      سررسید قسط بعدی: <strong>{loan.nextDueDateJalali}</strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({toPersianDigits(loan.dayOfMonth)}ام هر ماه)
                    </span>
                  </div>
                </div>

                {/* Pay Next Installment Button */}
                {loan.status === 'active' && (
                  <button
                    onClick={() => {
                      setPayingLoan(loan);
                      setPayAccountId(loan.accountId || accounts[0]?.id || '');
                    }}
                    className="w-full py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ثبت پرداخت قسط ماه ({formatMoney(loan.monthlyAmount, currency)})</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pay Modal */}
      {payingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">ثبت پرداخت قسط وام</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              پرداخت قسط شماره {toPersianDigits(payingLoan.paidCount + 1)} به مبلغ <strong className="text-indigo-700">{formatMoney(payingLoan.monthlyAmount, currency)}</strong> از حساب کسر شده و یک قسط به پرداخت‌های این وام اضافه خواهد شد.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">کسر از حساب:</label>
              <select
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} - موجودی: {formatMoney(a.balance, currency)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayingLoan(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  onPayInstallmentMonth(payingLoan.id, payAccountId);
                  setPayingLoan(null);
                }}
                className="px-5 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-sm shadow-indigo-600/20"
              >
                تایید و کسر قسط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                {editingLoan ? 'ویرایش اطلاعات تسهیلات' : 'ثبت تسهیلات و وام جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان تسهیلات</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: لیزینگ کشنده داف ۵۳۰"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام شرکت یا بانک</label>
                  <input
                    type="text"
                    required
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="مثال: لیزینگ کارآفرین"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کل مبلغ تسهیلات (تومان)</label>
                  <input
                    type="number"
                    value={totalLoanAmount}
                    onChange={(e) => setTotalLoanAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="720000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تعداد کل اقساط</label>
                  <input
                    type="number"
                    required
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ هر قسط (تومان)</label>
                  <input
                    type="number"
                    required
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="20000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اقساط پرداخت‌شده</label>
                  <input
                    type="number"
                    value={paidCount}
                    onChange={(e) => setPaidCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ سررسید قسط بعدی</label>
                  <input
                    type="text"
                    value={nextDueDateJalali}
                    onChange={(e) => setNextDueDateJalali(e.target.value)}
                    placeholder="1405/06/25"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">روز پرداخت در هر ماه</label>
                  <input
                    type="number"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
                >
                  ذخیره اطلاعات تسهیلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
