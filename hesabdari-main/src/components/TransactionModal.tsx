import React, { useState, useEffect, useRef } from 'react';
import {
  X, DollarSign, CheckCircle2, Camera, Upload, Sparkles, Loader2, Image as ImageIcon
} from 'lucide-react';
import { BankAccount, Category, Transaction, TransactionType } from '../types';
import { getTodayJalali, toEnglishDigits } from '../utils/jalali';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialData?: Transaction | null;
  accounts: BankAccount[];
  categories: Category[];
  onScanReceipt?: (base64Img: string, mimeType: string) => Promise<any>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  accounts,
  categories,
  onScanReceipt,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferFeeStr, setTransferFeeStr] = useState('');
  const [jalaliDate, setJalaliDate] = useState(getTodayJalali().formatted);
  const [payeeOrPayer, setPayeeOrPayer] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isScanningOCR, setIsScanningOCR] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmountStr(initialData.amount ? initialData.amount.toLocaleString('en-US') : '');
      setCategoryId(initialData.categoryId);
      setSubCategory(initialData.subCategory || '');
      setAccountId(initialData.accountId);
      setToAccountId(initialData.toAccountId || '');
      setTransferFeeStr(initialData.transferFee ? initialData.transferFee.toLocaleString('en-US') : '');
      setJalaliDate(initialData.jalaliDate);
      setPayeeOrPayer(initialData.payeeOrPayer || '');
      setNotes(initialData.notes || '');
      setReceiptImage(initialData.receiptImage);
    } else {
      setType('expense');
      setTitle('');
      setAmountStr('');
      const defaultCat = categories.find((c) => c.type === 'expense') || categories[0];
      setCategoryId(defaultCat?.id || '');
      setSubCategory('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setTransferFeeStr('');
      setJalaliDate(getTodayJalali().formatted);
      setPayeeOrPayer('');
      setNotes('');
      setReceiptImage(undefined);
    }
  }, [initialData, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const currentCategoryObj = categories.find((c) => c.id === categoryId);
  const availableCategories = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type));

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'transfer') {
      const match = categories.find((c) => c.type === newType);
      if (match) {
        setCategoryId(match.id);
        setSubCategory('');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setReceiptImage(result);

      if (onScanReceipt) {
        setIsScanningOCR(true);
        try {
          const mimeType = file.type || 'image/jpeg';
          const extracted = await onScanReceipt(result, mimeType);
          if (extracted) {
            if (extracted.title) setTitle(extracted.title);
            if (extracted.amount) setAmountStr(extracted.amount.toLocaleString('en-US'));
            if (extracted.merchantOrPayee) setPayeeOrPayer(extracted.merchantOrPayee);
            if (extracted.jalaliDate) setJalaliDate(extracted.jalaliDate);
            if (extracted.notes) setNotes(extracted.notes);
            if (extracted.categoryName) {
              const cat = categories.find(
                (c) =>
                  c.name.includes(extracted.categoryName) ||
                  (c.subcategories && c.subcategories.includes(extracted.categoryName))
              );
              if (cat) setCategoryId(cat.id);
            }
          }
        } catch (err) {
          console.warn('OCR Scan failed:', err);
        } finally {
          setIsScanningOCR(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseInt(toEnglishDigits(amountStr.replace(/,/g, '')), 10) || 0;
    const rawFee = parseInt(toEnglishDigits(transferFeeStr.replace(/,/g, '')), 10) || 0;

    if (rawAmount <= 0) {
      alert('لطفاً مبلغ تراکنش را به درستی وارد کنید.');
      return;
    }

    if (!title.trim()) {
      alert('لطفاً عنوان تراکنش را وارد کنید.');
      return;
    }

    const payload: Transaction = {
      id: initialData?.id || `tx-${Date.now()}`,
      type,
      title: title.trim(),
      amount: rawAmount,
      categoryId: type === 'transfer' ? 'cat-transfer' : categoryId || 'cat-other',
      categoryName: type === 'transfer' ? 'انتقال بین حساب‌ها' : currentCategoryObj?.name || 'متفرقه',
      subCategory: subCategory.trim() || undefined,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      transferFee: type === 'transfer' ? rawFee : undefined,
      jalaliDate: jalaliDate.trim() || getTodayJalali().formatted,
      payeeOrPayer: payeeOrPayer.trim() || undefined,
      notes: notes.trim() || undefined,
      receiptImage,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                type === 'income' ? 'bg-emerald-600' : type === 'transfer' ? 'bg-blue-600' : 'bg-rose-500'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {initialData ? 'ویرایش تراکنش مالی' : 'ثبت تراکنش جدید'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                درآمد، هزینه، یا جابجایی بین حساب‌های بانکی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1 text-xs sm:text-sm">
          {/* Type Selector Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هزینه / پرداخت
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              درآمد / واریزی
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                type === 'transfer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              انتقال بین حساب‌ها
            </button>
          </div>

          {/* OCR Receipt Upload Helper */}
          {type === 'expense' && (
            <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="text-xs text-violet-900 font-bold">
                  {isScanningOCR ? 'در حال خواندن مشخصات فاکتور...' : 'اسکن خودکار فاکتور خرید'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningOCR}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
              >
                {isScanningOCR ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>انتخاب تصویر فاکتور</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          )}

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان تراکنش <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'income' ? 'مثال: حقوق ماهانه، سود سپرده' : 'مثال: خرید مواد غذایی، قبض برق'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مبلغ (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const num = parseInt(toEnglishDigits(e.target.value.replace(/[^0-9]/g, '')), 10) || 0;
                  setAmountStr(num ? num.toLocaleString('en-US') : '');
                }}
                placeholder="مثال: ۱,۲۵۰,۰۰۰"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                required
              />
            </div>
          </div>

          {/* Categories / Subcategories (for non-transfers) */}
          {type !== 'transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  دسته‌بندی اصلی <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategory('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  زیردسته (اختیاری)
                </label>
                {currentCategoryObj?.subcategories && currentCategoryObj.subcategories.length > 0 ? (
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- انتخاب زیردسته --</option>
                    {currentCategoryObj.subcategories.map((sub, i) => (
                      <option key={i} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="زیردسته دلخواه..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {type === 'transfer' ? 'حساب مبدا (برداشت)' : 'حساب بانکی / کارت'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toLocaleString('fa-IR')} ت)
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  حساب مقصد (واریز) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ شمسی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={jalaliDate}
                  onChange={(e) => setJalaliDate(e.target.value)}
                  placeholder="1403/06/20"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                  required
                />
              </div>
            )}
          </div>

          {/* Payee / Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                طرف حساب / فروشگاه / واریزکننده
              </label>
              <input
                type="text"
                value={payeeOrPayer}
                onChange={(e) => setPayeeOrPayer(e.target.value)}
                placeholder="مثال: هایپرمارکت، شرکت..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                یادداشت / توضیحات
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات اختیاری..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition active:scale-95 flex items-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : type === 'transfer'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'ذخیره تغییرات' : 'ثبت تراکنش'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
