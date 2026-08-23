import React, { useState } from 'react';
import {
  Sparkles, ShieldCheck, AlertTriangle, TrendingUp, RefreshCw,
  Camera, Upload, MessageSquare, CheckCircle2, ArrowRight, FileText
} from 'lucide-react';
import { AIAdvisorData, BankAccount, Category, CurrencyType, Transaction } from '../types';
import { formatMoney, toPersianDigits } from '../utils/jalali';

interface AIAdvisorViewProps {
  advisorData: AIAdvisorData | null;
  isLoadingAdvisor: boolean;
  onRefreshAdvisor: () => void;
  onScanReceipt: (base64Img: string, mimeType: string) => Promise<any>;
  onParseSMS: (smsText: string) => Promise<any>;
  onApplyParsedTransaction: (parsedData: any) => void;
  currency: CurrencyType;
  transactions: Transaction[];
  accounts: BankAccount[];
  categories: Category[];
}

const SAMPLE_SMS = [
  'برداشت مبلغ 450,000 ریال از حساب 6104337890123456\nخرید فروشگاهی سوپرمارکت بهار\nمانده: 14,250,000 ریال\n1405/06/15-18:30',
  'واریز مبلغ 15,000,000 ریال به حساب بلوبانک 6219861099887766\nحقوق و دستمزد ماهانه\nمانده: 48,000,000 ریال\n1405/06/01-10:15',
  'انتقال پایا مبلغ 2,800,000 ریال به حساب علی رضایی بابت تسویه قرض\nکارت 5022291012345678\nمانده: 8,300,000 ریال',
];

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  advisorData,
  isLoadingAdvisor,
  onRefreshAdvisor,
  onScanReceipt,
  onParseSMS,
  onApplyParsedTransaction,
  currency,
}) => {
  const [smsInput, setSmsInput] = useState('');
  const [isProcessingSms, setIsProcessingSms] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mime = file.type || 'image/jpeg';
      setIsProcessingReceipt(true);
      try {
        const result = await onScanReceipt(base64, mime);
        if (result && result.extracted) {
          setExtractedData({
            ...result.extracted,
            receiptImage: reader.result as string,
          });
        }
      } catch (err: any) {
        alert('خطا در اسکن فاکتور: ' + err.message);
      } finally {
        setIsProcessingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSmsSubmit = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessingSms(true);
    try {
      const result = await onParseSMS(text);
      if (result && result.extracted) {
        setExtractedData(result.extracted);
      }
    } catch (err: any) {
      alert('خطا در پردازش پیامک: ' + err.message);
    } finally {
      setIsProcessingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">مشاور مالی و تحلیل‌گر هوش مصنوعی Gemini</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تحلیل سلامت مالی، پیشنهادهای صرفه‌جویی، اسکن خودکار رسیدها و پیامک بانک
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshAdvisor}
          disabled={isLoadingAdvisor}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-sm shadow-violet-500/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAdvisor ? 'animate-spin' : ''}`} />
          <span>{isLoadingAdvisor ? 'در حال تحلیل داده‌ها...' : 'به‌روزرسانی تحلیل هوشمند'}</span>
        </button>
      </div>

      {/* Financial Health Score & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-violet-300">شاخص سلامت مالی</span>
              <span className="px-2.5 py-1 bg-violet-500/30 text-violet-200 rounded-full text-xs font-bold border border-violet-400/20">
                سطح بسیار خوب
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-white tracking-tight">
                {toPersianDigits(advisorData?.overallScore || 85)}
              </span>
              <span className="text-slate-400 text-sm font-bold">از ۱۰۰</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تراز دخل و خرج شما در وضعیت متعادلی قرار دارد. نسبت پس‌انداز ماهانه شما بالاتر از میانگین است.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>تاریخ تحلیل: {advisorData?.generatedAt || 'امروز'}</span>
            <span className="text-emerald-400 font-bold">مدل هوش مصنوعی Gemini 2.5</span>
          </div>
        </div>

        {/* Executive Summary & Key Advice */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              خلاصه وضعیت و ارزیابی مشاور هوشمند
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              {advisorData?.summaryAnalysis ||
                'طی ماه جاری، درآمدها با پیش‌بینی هماهنگ بوده و بیشترین هزینه‌ها در سرفصل خوراک و ملزومات روزمره ثبت شده است. با محدود کردن خریدهای غیرضروری تفریحی می‌توانید تا ۱۰٪ پس‌انداز بیشتری به صندوق هدف اضافه نمایید.'}
            </p>

            {/* Suggestions Checklist */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-800">پیشنهادهای اجرایی بهبود پس‌انداز:</h4>
              {(advisorData?.recommendations || [
                'سقف بودجه رستوران و سفارش غذا را به ۱۵٪ کل درآمد ماه محدود کنید.',
                'مبلغ ۱,۵۰۰,۰۰۰ تومان از سود دریافتی را مستقیماً به صندوق خرید لپ‌تاپ انتقال دهید.',
                'موعد سررسید قسط وام بانک رسالت تا ۱۰ روز دیگر است؛ موجودی لازم را تامین فرمایید.',
              ]).map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings & Leaks Section */}
      {advisorData?.warnings && advisorData.warnings.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">هشدارهای نشتی مالی و سرریز بودجه</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advisorData.warnings.map((w, idx) => (
              <div key={idx} className="bg-white/80 p-3 rounded-2xl border border-amber-200/60 text-xs text-amber-800 font-medium">
                • {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Tools: Receipt Scanner & Bank SMS Parser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: AI Receipt OCR Scanner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">اسکنر هوشمند رسید و فاکتور</h3>
                <p className="text-xs text-slate-500">
                  تصویر فاکتور، رسید پوز یا خرید آنلاین را آپلود کنید
                </p>
              </div>
            </div>

            <div className="mt-4 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 mb-1">
                عکس فاکتور را اینجا رها کنید یا کلیک کنید
              </p>
              <p className="text-[11px] text-slate-400 mb-3">پشتیبانی از فرمت‌های PNG، JPG و رسیدهای دستگاه پوز</p>

              <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                {isProcessingReceipt ? 'در حال اسکن با Gemini...' : 'انتخاب تصویر رسید'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessingReceipt}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Tool 2: Bank SMS Parser */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تبدیل هوشمند پیامک بانک به تراکنش</h3>
                <p className="text-xs text-slate-500">
                  تشخیص خودکار مبلغ، شماره کارت، تاریخ، طرف حساب و مانده حساب
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              <textarea
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                placeholder="متن پیامک بانکی را اینجا بچسبانید..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-bold ml-1">نمونه‌ها:</span>
                {SAMPLE_SMS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSmsInput(sample);
                      handleSmsSubmit(sample);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    نمونه {toPersianDigits(idx + 1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSmsSubmit(smsInput)}
                disabled={isProcessingSms || !smsInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isProcessingSms ? 'در حال استخراج هوشمند...' : 'استخراج و آماده‌سازی تراکنش'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Data Result Banner */}
      {extractedData && (
        <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950">اطلاعات تراکنش با موفقیت استخراج شد!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  عنوان: <span className="font-bold">{extractedData.title}</span> | مبلغ:{' '}
                  <span className="font-bold">{formatMoney(extractedData.amount, currency)}</span> | دسته‌بندی پیشنهادی:{' '}
                  <span className="font-bold">{extractedData.categoryName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onApplyParsedTransaction(extractedData);
                setExtractedData(null);
              }}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-xs flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <span>تایید و ثبت نهایی در دفتر کل</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
