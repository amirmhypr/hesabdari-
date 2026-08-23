import React, { useState } from 'react';
import {
  CreditCard, Plus, ArrowRightLeft, Trash2, Edit3,
  Landmark, ShieldCheck, Wallet, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { BankAccount, CurrencyType, Transaction } from '../types';
import { formatMoney, toEnglishDigits, toPersianDigits } from '../utils/jalali';

interface AccountsViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  currency: CurrencyType;
  onSaveAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onTransfer: (fromId: string, toId: string, amount: number, fee: number, notes?: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  currency,
  onSaveAccount,
  onDeleteAccount,
  onTransfer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('بانک ملت');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [iban, setIban] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [color, setColor] = useState('#10b981');

  // Transfer states
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferFeeStr, setTransferFeeStr] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openAdd = () => {
    setEditingAccount(null);
    setName('');
    setBankName('بانک ملت');
    setAccountType('card');
    setCardNumber('');
    setIban('');
    setBalanceStr('');
    setColor('#10b981');
    setIsModalOpen(true);
  };

  const openEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName);
    setAccountType(acc.accountType || 'card');
    setCardNumber(acc.cardNumber || '');
    setIban(acc.iban || '');
    setBalanceStr(acc.balance ? acc.balance.toLocaleString('en-US') : '0');
    setColor(acc.color || '#10b981');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawBalance = parseInt(toEnglishDigits(balanceStr.replace(/,/g, '')), 10) || 0;
    if (!name.trim()) {
      alert('لطفاً نام حساب را وارد کنید.');
      return;
    }

    const payload: BankAccount = {
      id: editingAccount?.id || `acc-${Date.now()}`,
      name: name.trim(),
      bankName: bankName.trim(),
      accountType,
      cardNumber: cardNumber.trim() || undefined,
      iban: iban.trim() || undefined,
      balance: rawBalance,
      color,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
    };

    onSaveAccount(payload);
    setIsModalOpen(false);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      alert('برای انتقال وجه حداقل به دو حساب بانکی یا کیف پول نیاز دارید.');
      return;
    }
    setFromAccountId(accounts[0]?.id || '');
    setToAccountId(accounts[1]?.id || '');
    setTransferAmountStr('');
    setTransferFeeStr('');
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(toEnglishDigits(transferAmountStr.replace(/,/g, '')), 10) || 0;
    const fee = parseInt(toEnglishDigits(transferFeeStr.replace(/,/g, '')), 10) || 0;

    if (amount <= 0 || fromAccountId === toAccountId) {
      alert('لطفاً حساب مبدا و مقصد متفاوت و مبلغ معتبر انتخاب کنید.');
      return;
    }

    onTransfer(fromAccountId, toAccountId, amount, fee, transferNotes.trim() || undefined);
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">حساب‌های بانکی، کارت‌ها و کیف پول</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مدیریت نقدینگی، کارت به کارت، انتقال پایا و نگهداری شماره شبا و کارت
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openTransferModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>انتقال وجه بین حساب‌ها</span>
          </button>

          <button
            onClick={openAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف حساب جدید</span>
          </button>
        </div>
      </div>

      {/* Global Net Worth Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-300 font-bold">مجموع کل موجودی و نقدینگی</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {formatMoney(totalBalance, currency)}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-xs border border-white/10 self-start sm:self-auto">
          تعداد حساب‌های فعال: <span className="font-bold text-white">{toPersianDigits(accounts.length)} حساب</span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const accTxs = transactions.filter((t) => t.accountId === acc.id || t.toAccountId === acc.id);
          const totalIn = accTxs
            .filter((t) => (t.accountId === acc.id && t.type === 'income') || (t.toAccountId === acc.id && t.type === 'transfer'))
            .reduce((s, t) => s + t.amount, 0);
          const totalOut = accTxs
            .filter((t) => t.accountId === acc.id && (t.type === 'expense' || t.type === 'transfer'))
            .reduce((s, t) => s + t.amount, 0);

          return (
            <div
              key={acc.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 left-0 h-1.5"
                style={{ backgroundColor: acc.color || '#10b981' }}
              />

              <div>
                <div className="flex items-start justify-between mb-3 mt-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shadow-xs"
                      style={{ backgroundColor: acc.color || '#10b981' }}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{acc.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">{acc.bankName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(acc)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Number / IBAN Details */}
                {(acc.cardNumber || acc.iban) && (
                  <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    {acc.cardNumber && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">شماره کارت:</span>
                        <span className="font-mono font-bold dir-ltr">{acc.cardNumber}</span>
                      </div>
                    )}
                    {acc.iban && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 text-[11px]">شماره شبا:</span>
                        <span className="font-mono text-[11px] dir-ltr truncate max-w-[170px]">{acc.iban}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Balance Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">موجودی فعلی:</span>
                <span className="text-base font-black text-emerald-600">
                  {formatMoney(acc.balance, currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingAccount ? 'ویرایش حساب بانکی' : 'افزودن حساب / کارت جدید'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان حساب یا کارت
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: کارت اصلی حقوق / بلوبانک روزمره"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نام بانک
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: ملت، ملی، سامان، بلو..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نوع حساب
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="card">کارت بانکی</option>
                    <option value="savings">سپرده پس‌انداز</option>
                    <option value="current">حساب جاری / چک</option>
                    <option value="cash">کیف پول نقدی</option>
                    <option value="gold">صندوق طلا و سکه</option>
                    <option value="crypto">ارز دیجیتال</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره کارت ۱۶ رقمی (اختیاری)
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="6037-9918-xxxx-xxxx"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره شبا (اختیاری)
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IR..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  موجودی فعلی (تومان)
                </label>
                <input
                  type="text"
                  value={balanceStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setBalanceStr(num ? num.toLocaleString('en-US') : '');
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
                  ذخیره حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Between Accounts Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">انتقال وجه بین حساب‌ها</h3>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب مبدا (برداشت)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (موجودی: {formatMoney(a.balance, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب مقصد (واریز)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مبلغ انتقال (تومان)</label>
                <input
                  type="text"
                  value={transferAmountStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setTransferAmountStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۵,۰۰۰,۰۰۰"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">کارمزد انتقال (تومان - اختیاری)</label>
                <input
                  type="text"
                  value={transferFeeStr}
                  onChange={(e) => {
                    const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                    setTransferFeeStr(num ? num.toLocaleString('en-US') : '');
                  }}
                  placeholder="مثال: ۱,۲۰۰"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">یادداشت / بابت</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="مثال: انتقال به کارت خرید روزمره..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  تایید انتقال وجه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
