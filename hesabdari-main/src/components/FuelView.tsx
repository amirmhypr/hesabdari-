import React, { useState } from 'react';
import {
  Fuel, Plus, Search, Calendar, Gauge,
  Coins, MapPin, Trash2, Edit, TrendingUp, AlertCircle
} from 'lucide-react';
import { FuelRecord, BankAccount, CurrencyType } from '../types';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

interface FuelViewProps {
  fuelRecords: FuelRecord[];
  accounts: BankAccount[];
  currency: CurrencyType;
  onSaveFuelRecord: (record: FuelRecord) => void;
  onDeleteFuelRecord: (id: string) => void;
}

export const FuelView: React.FC<FuelViewProps> = ({
  fuelRecords,
  accounts,
  currency,
  onSaveFuelRecord,
  onDeleteFuelRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quota' | 'free'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);

  // Form State
  const [jalaliDate, setJalaliDate] = useState(getTodayJalali().formatted);
  const [liters, setLiters] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState<'quota' | 'free'>('quota');
  const [pricePerLiter, setPricePerLiter] = useState<number | ''>(600);
  const [gasStationName, setGasStationName] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState<number | ''>('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingRecord(null);
    setJalaliDate(getTodayJalali().formatted);
    setLiters(300);
    setFuelType('quota');
    setPricePerLiter(600);
    setGasStationName('');
    const lastRecord = fuelRecords[0];
    setCurrentOdometer(lastRecord ? (lastRecord.currentOdometer || 0) + 500 : 340000);
    setAccountId(accounts[0]?.id || '');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: FuelRecord) => {
    setEditingRecord(rec);
    setJalaliDate(rec.jalaliDate);
    setLiters(rec.liters);
    setFuelType(rec.fuelType);
    setPricePerLiter(rec.pricePerLiter);
    setGasStationName(rec.gasStationName);
    setCurrentOdometer(rec.currentOdometer);
    setAccountId(rec.accountId);
    setNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  const handleFuelTypeChange = (type: 'quota' | 'free') => {
    setFuelType(type);
    if (type === 'quota') {
      setPricePerLiter(600);
    } else {
      setPricePerLiter(3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lit = Number(liters) || 0;
    const rate = Number(pricePerLiter) || 0;
    const total = lit * rate;

    const record: FuelRecord = {
      id: editingRecord ? editingRecord.id : `fuel-${Date.now()}`,
      jalaliDate,
      liters: lit,
      pricePerLiter: rate,
      totalCost: total,
      fuelType,
      gasStationName: gasStationName.trim() || 'جایگاه سوخت',
      currentOdometer: Number(currentOdometer) || 0,
      accountId,
      notes: notes.trim(),
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    onSaveFuelRecord(record);
    setIsModalOpen(false);
  };

  const filteredRecords = fuelRecords.filter((rec) => {
    const matchesSearch =
      rec.gasStationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.jalaliDate.includes(searchTerm) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || rec.fuelType === filterType;
    return matchesSearch && matchesType;
  });

  const totalLiters = fuelRecords.reduce((sum, r) => sum + r.liters, 0);
  const totalCost = fuelRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const quotaLiters = fuelRecords.filter((r) => r.fuelType === 'quota').reduce((sum, r) => sum + r.liters, 0);
  const freeLiters = fuelRecords.filter((r) => r.fuelType === 'free').reduce((sum, r) => sum + r.liters, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              مدیریت سوخت، گازوئیل و کیلومترشمار
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ثبت سوخت‌گیری‌های سهمیه‌ای و آزاد، استهلاک و نرخ مصرف به ازای مسافت
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-amber-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت سوخت‌گیری جدید</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">مجموع لیتر مصرفی</span>
          <div className="text-base sm:text-xl font-black text-slate-900">
            {toPersianDigits(totalLiters.toLocaleString('fa-IR'))} لیتر
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            سهمیه‌ای: {toPersianDigits(quotaLiters)} | آزاد: {toPersianDigits(freeLiters)}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">کل هزینه سوخت</span>
          <div className="text-base sm:text-xl font-black text-amber-600">
            {formatMoney(totalCost, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            ثبت‌شده در مخارج جاری ناوگان
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">میانگین هزینه هر لیتر</span>
          <div className="text-base sm:text-xl font-black text-slate-800">
            {totalLiters > 0
              ? formatMoney(Math.round(totalCost / totalLiters), currency)
              : '۰ تومان'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            بهینه‌سازی با سهمیه دولتی
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">تعداد سوخت‌گیری</span>
          <div className="text-base sm:text-xl font-black text-slate-800">
            {toPersianDigits(fuelRecords.length)} نوبت
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            در پایگاه داده محلی و ابری
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
            placeholder="جستجو در نام جایگاه سوخت، تاریخ و یادداشت..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-2xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="all">همه انواع سوخت</option>
            <option value="quota">گازوئیل سهمیه‌ای (۶۰۰ تومان)</option>
            <option value="free">گازوئیل آزاد (۳۰۰۰ تومان)</option>
          </select>
        </div>
      </div>

      {/* Fuel Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <Fuel className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">هیچ سابقه سوخت‌گیری ثبت نشده است</h4>
            <p className="text-xs text-slate-400">برای شروع اولین نوبت گازوئیل را ثبت کنید.</p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const acc = accounts.find((a) => a.id === rec.accountId);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        rec.fuelType === 'quota'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {rec.fuelType === 'quota' ? 'گازوئیل سهمیه‌ای' : 'گازوئیل آزاد'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {rec.jalaliDate}
                    </span>
                    {rec.currentOdometer > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                        <Gauge className="w-3.5 h-3.5 text-slate-500" />
                        {toPersianDigits(rec.currentOdometer.toLocaleString('fa-IR'))} کیلومتر
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>{rec.gasStationName}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({toPersianDigits(rec.liters)} لیتر به نرخ {toPersianDigits(rec.pricePerLiter.toLocaleString('fa-IR'))} تومان)
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4">
                    <span>پرداخت با: <strong className="text-slate-700 font-bold">{acc?.name || 'کارت سوخت'}</strong></span>
                    {rec.notes && <span className="text-slate-400">نکته: {rec.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right sm:text-left">
                    <div className="text-xs text-slate-400">مبلغ سوخت‌گیری</div>
                    <div className="text-base font-black text-amber-600">
                      {formatMoney(rec.totalCost, currency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteFuelRecord(rec.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                {editingRecord ? 'ویرایش اطلاعات سوخت‌گیری' : 'ثبت سوخت‌گیری جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ (شمسی)</label>
                  <input
                    type="text"
                    required
                    value={jalaliDate}
                    onChange={(e) => setJalaliDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع سهمیه</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFuelTypeChange('quota')}
                      className={`flex-1 py-2 text-xs font-bold rounded-2xl border transition-all ${
                        fuelType === 'quota'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      سهمیه‌ای
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelTypeChange('free')}
                      className={`flex-1 py-2 text-xs font-bold rounded-2xl border transition-all ${
                        fuelType === 'free'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      آزاد
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مقدار سوخت (لیتر)</label>
                  <input
                    type="number"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 350"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نرخ هر لیتر (تومان)</label>
                  <input
                    type="number"
                    required
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 flex items-center justify-between text-xs font-bold text-amber-900">
                <span>مبلغ کل سوخت‌گیری:</span>
                <span className="text-sm font-black">{formatMoney((Number(liters) || 0) * (Number(pricePerLiter) || 0), currency)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کیلومترشمار کامیون</label>
                  <input
                    type="number"
                    value={currentOdometer}
                    onChange={(e) => setCurrentOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 342500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کارت پرداخت هزینه</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.bankName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام جایگاه / شهر</label>
                <input
                  type="text"
                  value={gasStationName}
                  onChange={(e) => setGasStationName(e.target.value)}
                  placeholder="مثال: جایگاه ۲۵۰ سیرجان"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت تکمیلی..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                  className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/20 transition-all active:scale-95"
                >
                  ذخیره سوخت‌گیری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
