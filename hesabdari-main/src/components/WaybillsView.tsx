import React, { useState } from 'react';
import {
  Truck, Plus, Search, Filter, Calendar, MapPin,
  CheckCircle2, Clock, AlertCircle, Trash2, Edit,
  ArrowDownLeft, DollarSign, FileText, ChevronDown, Download
} from 'lucide-react';
import { Waybill, BankAccount, CurrencyType } from '../types';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

interface WaybillsViewProps {
  waybills: Waybill[];
  accounts: BankAccount[];
  currency: CurrencyType;
  onSaveWaybill: (waybill: Waybill) => void;
  onDeleteWaybill: (id: string) => void;
  onSettleWaybillRemaining: (waybill: Waybill, accountId: string) => void;
}

export const WaybillsView: React.FC<WaybillsViewProps> = ({
  waybills,
  accounts,
  currency,
  onSaveWaybill,
  onDeleteWaybill,
  onSettleWaybillRemaining,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'delivered' | 'in_transit' | 'loading'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWb, setEditingWb] = useState<Waybill | null>(null);

  // Settle Modal State
  const [settlingWb, setSettlingWb] = useState<Waybill | null>(null);
  const [settleAccountId, setSettleAccountId] = useState(accounts[0]?.id || '');

  // Form State
  const [waybillNumber, setWaybillNumber] = useState('');
  const [jalaliDate, setJalaliDate] = useState(getTodayJalali().formatted);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weightTon, setWeightTon] = useState<number | ''>('');
  const [shipperOrCompany, setShipperOrCompany] = useState('');
  const [totalFreight, setTotalFreight] = useState<number | ''>('');
  const [commission, setCommission] = useState<number | ''>(0);
  const [advancePaid, setAdvancePaid] = useState<number | ''>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending'>('partial');
  const [deliveryStatus, setDeliveryStatus] = useState<'delivered' | 'in_transit' | 'loading'>('in_transit');
  const [receivingAccountId, setReceivingAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingWb(null);
    setWaybillNumber(`WB-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setJalaliDate(getTodayJalali().formatted);
    setOrigin('');
    setDestination('');
    setCargoType('کالای عمومی و کانتینری');
    setWeightTon('');
    setShipperOrCompany('');
    setTotalFreight('');
    setCommission(0);
    setAdvancePaid(0);
    setPaymentStatus('partial');
    setDeliveryStatus('in_transit');
    setReceivingAccountId(accounts[0]?.id || '');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (wb: Waybill) => {
    setEditingWb(wb);
    setWaybillNumber(wb.waybillNumber);
    setJalaliDate(wb.jalaliDate);
    setOrigin(wb.origin);
    setDestination(wb.destination);
    setCargoType(wb.cargoType);
    setWeightTon(wb.weightTon || '');
    setShipperOrCompany(wb.shipperOrCompany);
    setTotalFreight(wb.totalFreight);
    setCommission(wb.commission);
    setAdvancePaid(wb.advancePaid);
    setPaymentStatus(wb.paymentStatus);
    setDeliveryStatus(wb.deliveryStatus);
    setReceivingAccountId(wb.receivingAccountId || accounts[0]?.id || '');
    setNotes(wb.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = Number(totalFreight) || 0;
    const comm = Number(commission) || 0;
    const net = Math.max(0, tot - comm);
    const adv = Number(advancePaid) || 0;
    const rem = Math.max(0, net - adv);

    let calculatedPaymentStatus = paymentStatus;
    if (rem === 0 && net > 0) calculatedPaymentStatus = 'paid';
    else if (adv > 0 && rem > 0) calculatedPaymentStatus = 'partial';
    else if (adv === 0) calculatedPaymentStatus = 'pending';

    const waybillData: Waybill = {
      id: editingWb ? editingWb.id : `wb-${Date.now()}`,
      waybillNumber: waybillNumber.trim() || `WB-${Date.now()}`,
      jalaliDate,
      origin: origin.trim() || 'نامشخص',
      destination: destination.trim() || 'نامشخص',
      cargoType: cargoType.trim() || 'کالای تجاری',
      weightTon: Number(weightTon) || 0,
      shipperOrCompany: shipperOrCompany.trim() || 'باربری عمومی',
      totalFreight: tot,
      commission: comm,
      netFare: net,
      advancePaid: adv,
      remainingAmount: rem,
      paymentStatus: calculatedPaymentStatus,
      deliveryStatus,
      receivingAccountId,
      notes: notes.trim(),
      createdAt: editingWb ? editingWb.createdAt : new Date().toISOString(),
    };

    onSaveWaybill(waybillData);
    setIsModalOpen(false);
  };

  // Calculations
  const filteredWaybills = waybills.filter((wb) => {
    const matchesSearch =
      wb.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.shipperOrCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.cargoType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = filterPayment === 'all' || wb.paymentStatus === filterPayment;
    const matchesDelivery = filterDelivery === 'all' || wb.deliveryStatus === filterDelivery;

    return matchesSearch && matchesPayment && matchesDelivery;
  });

  const totalGrossFreight = waybills.reduce((sum, w) => sum + w.totalFreight, 0);
  const totalCommission = waybills.reduce((sum, w) => sum + w.commission, 0);
  const totalNetFare = waybills.reduce((sum, w) => sum + w.netFare, 0);
  const totalRemaining = waybills.reduce((sum, w) => sum + w.remainingAmount, 0);
  const totalTonnage = waybills.reduce((sum, w) => sum + (w.weightTon || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                مدیریت بارنامه‌ها و سرویس‌های حمل بار
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ثبت دقیق مبدأ، مقصد، کرایه ناخالص، کمیسیون، بیعانه و پس‌کرایه‌ها
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت بارنامه جدید</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">صافی کل کرایه‌ها</span>
          <div className="text-base sm:text-xl font-black text-emerald-600">
            {formatMoney(totalNetFare, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            سهم خالص راننده پس از کسر کمیسیون
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">مانده طلب (پس‌کرایه)</span>
          <div className="text-base sm:text-xl font-black text-amber-600">
            {formatMoney(totalRemaining, currency)}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold mt-1 block">
            در انتظار تسویه از باربری‌ها
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">کمیسیون پرداخت‌شده</span>
          <div className="text-base sm:text-xl font-black text-rose-600">
            {formatMoney(totalCommission, currency)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            سهم شرکت‌های حمل‌ونقل
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">تعداد سرویس‌ها و تناژ</span>
          <div className="text-base sm:text-xl font-black text-slate-800">
            {toPersianDigits(waybills.length)} سرویس
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
            مجموع تناژ: {toPersianDigits(totalTonnage.toFixed(1))} تن
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در شماره بارنامه، مبدأ، مقصد، باربری، کالا..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-2xl pr-10 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <select
            value={filterPayment}
            onChange={(e: any) => setFilterPayment(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">همه وضعیت‌های پرداخت</option>
            <option value="paid">تسویه کامل</option>
            <option value="partial">دارای مانده طلب (ناقص)</option>
            <option value="pending">در انتظار پرداخت کامل</option>
          </select>

          <select
            value={filterDelivery}
            onChange={(e: any) => setFilterDelivery(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">همه وضعیت‌های بار</option>
            <option value="in_transit">در مسیر حمل</option>
            <option value="delivered">تحویل داده شده</option>
            <option value="loading">در حال بارگیری</option>
          </select>
        </div>
      </div>

      {/* Waybills List / Cards */}
      <div className="space-y-3">
        {filteredWaybills.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">هیچ بارنامه‌ای با این مشخصات یافت نشد</h4>
            <p className="text-xs text-slate-400">برای شروع اولین بارنامه و سرویس خود را ثبت نمایید.</p>
          </div>
        ) : (
          filteredWaybills.map((wb) => (
            <div
              key={wb.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Info Column */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    بارنامه: {wb.waybillNumber}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {wb.jalaliDate}
                  </span>

                  {/* Delivery Status Badge */}
                  {wb.deliveryStatus === 'delivered' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      تحویل شده
                    </span>
                  )}
                  {wb.deliveryStatus === 'in_transit' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      در مسیر
                    </span>
                  )}
                  {wb.deliveryStatus === 'loading' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                      بارگیری
                    </span>
                  )}

                  {/* Payment Status Badge */}
                  {wb.paymentStatus === 'paid' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      تسویه کامل
                    </span>
                  )}
                  {wb.paymentStatus === 'partial' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      مانده‌دار
                    </span>
                  )}
                  {wb.paymentStatus === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                      پرداخت نشده
                    </span>
                  )}
                </div>

                {/* Route & Cargo */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-black text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{wb.origin}</span>
                    <span className="text-slate-400 font-normal">به</span>
                    <span>{wb.destination}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-normal">
                    نوع بار: <strong className="text-slate-700 font-bold">{wb.cargoType}</strong>
                    {wb.weightTon > 0 && ` (${toPersianDigits(wb.weightTon)} تن)`}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>صاحب کالا / باربری: <strong className="text-slate-700 font-bold">{wb.shipperOrCompany}</strong></span>
                  {wb.notes && <span className="text-slate-400">توضیح: {wb.notes}</span>}
                </div>
              </div>

              {/* Financial Column */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                <div className="text-right lg:text-left">
                  <div className="text-xs text-slate-400">صافی کرایه راننده</div>
                  <div className="text-base font-black text-emerald-600">
                    {formatMoney(wb.netFare, currency)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    کل: {formatMoney(wb.totalFreight, currency)} | کمیسیون: {formatMoney(wb.commission, currency)}
                  </div>
                  {wb.remainingAmount > 0 && (
                    <div className="text-[11px] font-bold text-amber-600 mt-0.5">
                      مانده طلب: {formatMoney(wb.remainingAmount, currency)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {wb.remainingAmount > 0 && (
                    <button
                      onClick={() => {
                        setSettlingWb(wb);
                        setSettleAccountId(accounts[0]?.id || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
                      title="تسویه مانده کرایه"
                    >
                      تسویه مانده
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(wb)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    title="ویرایش بارنامه"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteWaybill(wb.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="حذف بارنامه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Waybill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                {editingWb ? 'ویرایش اطلاعات بارنامه' : 'ثبت بارنامه و سرویس جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره بارنامه</label>
                  <input
                    type="text"
                    required
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ بارگیری (شمسی)</label>
                  <input
                    type="text"
                    required
                    value={jalaliDate}
                    onChange={(e) => setJalaliDate(e.target.value)}
                    placeholder="مثال: 1405/06/01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شهر مبدأ و محل بارگیری</label>
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="مثال: بندرعباس - اسکله رجایی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شهر مقصد و محل تخلیه</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="مثال: تهران - شورآباد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع کالا / محموله</label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    placeholder="مثال: قطعات خودرو"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وزن بار (تن)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightTon}
                    onChange={(e) => setWeightTon(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 24.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شرکت باربری / صاحب کالا</label>
                  <input
                    type="text"
                    value={shipperOrCompany}
                    onChange={(e) => setShipperOrCompany(e.target.value)}
                    placeholder="مثال: باربری ترابر خلیج فارس"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Financial Fields */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                <h4 className="text-xs font-black text-emerald-900">محاسبات مالی کرایه</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">کرایه ناخالص کل (تومان)</label>
                    <input
                      type="number"
                      required
                      value={totalFreight}
                      onChange={(e) => setTotalFreight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="35000000"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">کمیسیون باربری (تومان)</label>
                    <input
                      type="number"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="3500000"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">بیعانه / پیش‌کرایه دریافتی</label>
                    <input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="10000000"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-emerald-100">
                  <span>صافی کرایه راننده: <strong className="text-emerald-700 font-black">{formatMoney(Math.max(0, (Number(totalFreight) || 0) - (Number(commission) || 0)), currency)}</strong></span>
                  <span>مانده پس‌کرایه طلبکار: <strong className="text-amber-700 font-black">{formatMoney(Math.max(0, ((Number(totalFreight) || 0) - (Number(commission) || 0)) - (Number(advancePaid) || 0)), currency)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وضعیت تحویل بار</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e: any) => setDeliveryStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="in_transit">در حال حمل و مسیر جاده</option>
                    <option value="delivered">تحویل داده شده و تخلیه کامل</option>
                    <option value="loading">در نوبت یا حال بارگیری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کارت بانکی دریافت بیعانه</label>
                  <select
                    value={receivingAccountId}
                    onChange={(e) => setReceivingAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} - {a.bankName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و شماره تماس باربری</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات تحویل، شماره هماهنگی انبار مقصد، شماره چک و..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
                >
                  ذخیره بارنامه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Remaining Modal */}
      {settlingWb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">تسویه مانده پس‌کرایه</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              آیا مبلغ <strong className="text-emerald-700">{formatMoney(settlingWb.remainingAmount, currency)}</strong> بابت تسویه بارنامه «{settlingWb.waybillNumber}» به حساب واریز شده است؟
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">واریز به حساب:</label>
              <select
                value={settleAccountId}
                onChange={(e) => setSettleAccountId(e.target.value)}
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
                onClick={() => setSettlingWb(null)}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  onSettleWaybillRemaining(settlingWb, settleAccountId);
                  setSettlingWb(null);
                }}
                className="px-5 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-600/20"
              >
                تایید و ثبت تسویه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
