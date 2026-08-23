import React, { useState } from 'react';
import {
  FileText, Plus, Search, Calendar, CheckCircle2,
  Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Trash2, Edit, Check, ShieldCheck
} from 'lucide-react';
import { SayadCheque, BankAccount, CurrencyType } from '../types';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

interface ChequesViewProps {
  cheques: SayadCheque[];
  accounts: BankAccount[];
  currency: CurrencyType;
  onSaveCheque: (cheque: SayadCheque) => void;
  onDeleteCheque: (id: string) => void;
  onClearCheque: (chequeId: string, accountId: string) => void;
}

export const ChequesView: React.FC<ChequesViewProps> = ({
  cheques,
  accounts,
  currency,
  onSaveCheque,
  onDeleteCheque,
  onClearCheque,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'cleared' | 'bounced'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<SayadCheque | null>(null);

  // Clear modal
  const [clearingCheque, setClearingCheque] = useState<SayadCheque | null>(null);
  const [clearAccountId, setClearAccountId] = useState(accounts[0]?.id || '');

  // Form State
  const [type, setType] = useState<'received' | 'issued'>('received');
  const [chequeNumber, setChequeNumber] = useState('');
  const [sayadId, setSayadId] = useState('');
  const [bankName, setBankName] = useState('بانک ملی ایران');
  const [amount, setAmount] = useState<number | ''>('');
  const [drawerOrPayee, setDrawerOrPayee] = useState('');
  const [dueDateJalali, setDueDateJalali] = useState(getTodayJalali().formatted);
  const [status, setStatus] = useState<'pending' | 'cleared' | 'bounced' | 'transferred'>('pending');
  const [relatedType, setRelatedType] = useState<'waybill' | 'repair' | 'installment' | 'other'>('waybill');
  const [relatedTitle, setRelatedTitle] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingCheque(null);
    setType('received');
    setChequeNumber('');
    setSayadId('');
    setBankName('بانک صادرات ایران');
    setAmount('');
    setDrawerOrPayee('');
    setDueDateJalali(getTodayJalali().formatted);
    setStatus('pending');
    setRelatedType('waybill');
    setRelatedTitle('مانده کرایه بارنامه');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (chq: SayadCheque) => {
    setEditingCheque(chq);
    setType(chq.type);
    setChequeNumber(chq.chequeNumber);
    setSayadId(chq.sayadId);
    setBankName(chq.bankName);
    setAmount(chq.amount);
    setDrawerOrPayee(chq.drawerOrPayee);
    setDueDateJalali(chq.dueDateJalali);
    setStatus(chq.status);
    setRelatedType(chq.relatedType || 'other');
    setRelatedTitle(chq.relatedTitle || '');
    setNotes(chq.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chequeData: SayadCheque = {
      id: editingCheque ? editingCheque.id : `chq-${Date.now()}`,
      type,
      chequeNumber: chequeNumber.trim() || '---',
      sayadId: sayadId.trim(),
      bankName: bankName.trim() || 'بانک',
      amount: Number(amount) || 0,
      drawerOrPayee: drawerOrPayee.trim() || 'طرف حساب',
      dueDateJalali: dueDateJalali.trim() || getTodayJalali().formatted,
      status,
      relatedType,
      relatedTitle: relatedTitle.trim(),
      notes: notes.trim(),
      createdAt: editingCheque ? editingCheque.createdAt : new Date().toISOString(),
    };

    onSaveCheque(chequeData);
    setIsModalOpen(false);
  };

  const filteredCheques = cheques.filter((c) => {
    const matchesSearch =
      c.chequeNumber.includes(searchTerm) ||
      c.sayadId.includes(searchTerm) ||
      c.drawerOrPayee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.relatedTitle && c.relatedTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPendingReceived = cheques
    .filter((c) => c.type === 'received' && c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPendingIssued = cheques
    .filter((c) => c.type === 'issued' && c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              دفتر چک‌های صیادی و اسناد تجاری
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              مدیریت چک‌های دریافتی از باربری‌ها و چک‌های پرداختی بابت قطعات، لاستیک و بیمه
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-teal-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت چک صیادی جدید</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">چک‌های دریافتی در انتظار وصول</span>
          <div className="text-base sm:text-xl font-black text-emerald-600">
            {formatMoney(totalPendingReceived, currency)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            مطالبات از باربری و صاحب کالا
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">چک‌های صادره سررسید نشده</span>
          <div className="text-base sm:text-xl font-black text-rose-600">
            {formatMoney(totalPendingIssued, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            تعهدات پرداخت قطعات و تعمیرات
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">تعداد کل چک‌ها</span>
          <div className="text-base sm:text-xl font-black text-slate-800">
            {toPersianDigits(cheques.length)} فقره
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            در سامانه صیاد بانک مرکزی
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">چک‌های پاس‌شده</span>
          <div className="text-base sm:text-xl font-black text-teal-600">
            {toPersianDigits(cheques.filter((c) => c.status === 'cleared').length)} فقره
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            تسویه کامل بانکی
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در شماره سریال، شناسه ۱۶ رقمی صیاد، نام طرف حساب، بانک..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-2xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5"
          >
            <option value="all">همه انواع چک (دریافتی/صادره)</option>
            <option value="received">چک‌های دریافتی (طلب)</option>
            <option value="issued">چک‌های صادره (بدهی)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار سررسید</option>
            <option value="cleared">وصول / پاس شده</option>
            <option value="bounced">برگشت خورده</option>
          </select>
        </div>
      </div>

      {/* Cheques List */}
      <div className="space-y-3">
        {filteredCheques.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">هیچ چکی در این بخش ثبت نشده است</h4>
            <p className="text-xs text-slate-400">می‌توانید چک‌های صیادی دریافتی یا پرداختی را ثبت کنید.</p>
          </div>
        ) : (
          filteredCheques.map((chq) => (
            <div
              key={chq.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      chq.type === 'received'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    {chq.type === 'received' ? (
                      <>
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        چک دریافتی
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        چک صادره
                      </>
                    )}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    سررسید: <strong>{chq.dueDateJalali}</strong>
                  </span>

                  {chq.status === 'cleared' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      پاس شده
                    </span>
                  )}
                  {chq.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      در انتظار وصول
                    </span>
                  )}
                  {chq.status === 'bounced' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      برگشتی
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-slate-800 flex flex-wrap items-center gap-x-3">
                  <span>بانک: <strong>{chq.bankName}</strong></span>
                  <span className="text-xs text-slate-500 font-mono">سریال: {chq.chequeNumber}</span>
                  {chq.sayadId && (
                    <span className="text-xs text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                      صیاد: {chq.sayadId}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4">
                  <span>طرف حساب / در وجه: <strong className="text-slate-700 font-bold">{chq.drawerOrPayee}</strong></span>
                  {chq.relatedTitle && <span className="text-slate-400">بابت: {chq.relatedTitle}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-right sm:text-left">
                  <div className="text-xs text-slate-400">مبلغ چک</div>
                  <div
                    className={`text-base font-black ${
                      chq.type === 'received' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatMoney(chq.amount, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {chq.status === 'pending' && (
                    <button
                      onClick={() => {
                        setClearingCheque(chq);
                        setClearAccountId(accounts[0]?.id || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all"
                    >
                      ثبت وصول
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(chq)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCheque(chq.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear Cheque Modal */}
      {clearingCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              ثبت وصول / پاس شدن چک صیادی
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              آیا چک شماره «{clearingCheque.chequeNumber}» به مبلغ <strong className="text-teal-700">{formatMoney(clearingCheque.amount, currency)}</strong> وصول شده و به موجودی حساب اعمال شود؟
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {clearingCheque.type === 'received' ? 'واریز به حساب:' : 'کسر از حساب:'}
              </label>
              <select
                value={clearAccountId}
                onChange={(e) => setClearAccountId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.bankName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClearingCheque(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearCheque(clearingCheque.id, clearAccountId);
                  setClearingCheque(null);
                }}
                className="px-5 py-2 rounded-2xl bg-teal-600 text-white text-xs font-bold shadow-sm shadow-teal-600/20"
              >
                تایید وصول بانکی
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
                {editingCheque ? 'ویرایش اطلاعات چک صیادی' : 'ثبت چک صیادی جدید'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع چک</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('received')}
                    className={`flex-1 py-2 text-xs font-bold rounded-2xl border transition-all ${
                      type === 'received'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    چک دریافتی (طلب)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('issued')}
                    className={`flex-1 py-2 text-xs font-bold rounded-2xl border transition-all ${
                      type === 'issued'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    چک صادره (بدهی)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ چک (تومان)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ سررسید (شمسی)</label>
                  <input
                    type="text"
                    required
                    value={dueDateJalali}
                    onChange={(e) => setDueDateJalali(e.target.value)}
                    placeholder="1405/06/20"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شناسه ۱۶ رقمی صیاد</label>
                  <input
                    type="text"
                    value={sayadId}
                    onChange={(e) => setSayadId(e.target.value)}
                    placeholder="۱۹۸۴-۷۲۳۱-۰۹۴۲-۵۵۱۸"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره سریال برگ چک</label>
                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="مثال: ۴۸۲۹۱۰"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام بانک صادرکننده</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: بانک صادرات ایران"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام طرف حساب / صادرکننده</label>
                  <input
                    type="text"
                    required
                    value={drawerOrPayee}
                    onChange={(e) => setDrawerOrPayee(e.target.value)}
                    placeholder="مثال: باربری پایا ترابر"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بابت / موضوع چک</label>
                <input
                  type="text"
                  value={relatedTitle}
                  onChange={(e) => setRelatedTitle(e.target.value)}
                  placeholder="مثال: مانده کرایه بارنامه یا خرید لاستیک"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
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
                  className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition-all active:scale-95"
                >
                  ذخیره چک صیادی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
