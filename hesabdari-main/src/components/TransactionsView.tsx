import React, { useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Search, Plus,
  FileSpreadsheet, Trash2, Edit3, Sparkles, Filter, Calendar
} from 'lucide-react';
import { BankAccount, Category, CurrencyType, Transaction, TransactionType } from '../types';
import { formatMoney, toPersianDigits } from '../utils/jalali';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  categories: Category[];
  currency: CurrencyType;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
  onOpenAIParser: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  currency,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
  onOpenAIParser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.payeeOrPayer && t.payeeOrPayer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
    const matchesAccount = accountFilter === 'all' || t.accountId === accountFilter || t.toAccountId === accountFilter;

    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">دفتر کل تراکنش‌ها و ریز مخارج</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت، جستجو، فیلتر و صدور گزارش تراکنش‌های درآمد، هزینه و جابجایی بین حساب‌ها
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onOpenAIParser}
            className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-2xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
            title="تبدیل پیامک بانک و اسکن فاکتور با هوش مصنوعی"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>اسکن فاکتور / پیامک</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            title="خروجی فایل اکسل CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={onAddTransaction}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">مجموع درآمدها</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {formatMoney(totalIncome, currency)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">مجموع هزینه‌ها</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            {formatMoney(totalExpense, currency)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">تراز کل دوره (سود/پس‌انداز)</span>
          <span
            className={`text-xl font-black mt-1 block ${
              totalIncome >= totalExpense ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatMoney(totalIncome - totalExpense, currency)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در عنوان، طرف حساب یا یادداشت..."
              className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-bold no-scrollbar">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                typeFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه ({toPersianDigits(transactions.length)})
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              هزینه‌ها ({toPersianDigits(transactions.filter((t) => t.type === 'expense').length)})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              درآمدها ({toPersianDigits(transactions.filter((t) => t.type === 'income').length)})
            </button>
            <button
              onClick={() => setTypeFilter('transfer')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                typeFilter === 'transfer' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              انتقال‌ها ({toPersianDigits(transactions.filter((t) => t.type === 'transfer').length)})
            </button>
          </div>
        </div>

        {/* Categories & Account dropdown filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">دسته‌بندی:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">حساب بانکی:</span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">همه حساب‌ها</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <p className="text-sm font-bold text-slate-500">هیچ تراکنشی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const acc = accounts.find((a) => a.id === tx.accountId);
            const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                      isIncome ? 'bg-emerald-500' : isTransfer ? 'bg-blue-600' : 'bg-rose-500'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isTransfer ? (
                      <ArrowLeftRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{tx.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {tx.categoryName}
                        {tx.subCategory ? ` / ${tx.subCategory}` : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{tx.jalaliDate}</span>
                      <span>•</span>
                      <span>
                        {isTransfer
                          ? `از ${acc?.name || 'مبدا'} به ${toAcc?.name || 'مقصد'}`
                          : `حساب: ${acc?.name || 'اصلی'}`}
                      </span>
                      {tx.payeeOrPayer && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-bold">{tx.payeeOrPayer}</span>
                        </>
                      )}
                      {tx.receiptImage && (
                        <span className="text-emerald-600 font-bold">📷 دارای عکس رسید</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base font-black ${
                        isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '↔' : '-'} {formatMoney(tx.amount, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      title="ویرایش"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
