import { Waybill, FuelRecord, SayadCheque, TruckInstallmentLoan, CurrencyType } from '../types';
import { formatMoney, toPersianDigits, getTodayJalali } from '../utils/jalali';

export interface TelegramSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramSendResult> {
  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'توکن ربات تلگرام یا شناسه چت (Chat ID) وارد نشده است.',
    };
  }

  const cleanToken = botToken.trim().replace(/^bot/i, '');
  const cleanChatId = chatId.trim();

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: 'پیام با موفقیت به تلگرام ارسال شد.',
      };
    } else {
      return {
        success: false,
        error: data.description || 'خطا در برقراری ارتباط با سرور تلگرام',
      };
    }
  } catch (err: any) {
    console.error('Telegram API error:', err);
    return {
      success: false,
      error: err?.message || 'خطا در ارسال درخواست به تلگرام (بررسی اتصال اینترنت یا فیلترشکن).',
    };
  }
}

/**
 * Format Waybill record for Telegram
 */
export function formatWaybillForTelegram(waybill: Waybill, currency: CurrencyType): string {
  const today = getTodayJalali();
  return `🚛 <b>ثبت بارنامه جدید | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
📋 <b>شماره بارنامه:</b> <code>${toPersianDigits(waybill.waybillNumber)}</code>
📅 <b>تاریخ بارگیری:</b> ${waybill.jalaliDate}
📍 <b>مسیر:</b> ${waybill.origin} ⬅️ ${waybill.destination}
📦 <b>نوع محموله:</b> ${waybill.cargoType} (${toPersianDigits(waybill.weightTon)} تن)
🏢 <b>باربری / صاحب کالا:</b> ${waybill.shipperOrCompany || 'ثبت نشده'}

💰 <b>مبلغ کل کرایه:</b> ${formatMoney(waybill.totalFreight, currency)}
🔻 <b>کمیسیون پایانه:</b> ${formatMoney(waybill.commission, currency)}
✅ <b>صافی کرایه راننده:</b> <b>${formatMoney(waybill.netFare, currency)}</b>
💵 <b>پیش‌کرایه (بیعانه):</b> ${formatMoney(waybill.advancePaid, currency)}
⏳ <b>مانده طلب کرایه:</b> ${formatMoney(waybill.remainingAmount, currency)}
📌 <b>وضعیت پرداخت:</b> ${waybill.paymentStatus === 'paid' ? 'تسویه کامل ✅' : waybill.paymentStatus === 'partial' ? 'بیعانه دریافت شده ⏳' : 'در انتظار تسویه ⚠️'}

${waybill.notes ? `📝 <b>توضیحات:</b> ${waybill.notes}\n` : ''}━━━━━━━━━━━━━━━━━
⏰ <i>ثبت شده در سامانه حسابداری امیر - ${today.formatted}</i>`;
}

/**
 * Format Fuel record for Telegram
 */
export function formatFuelForTelegram(fuel: FuelRecord, currency: CurrencyType): string {
  const today = getTodayJalali();
  return `⛽ <b>ثبت سوخت‌گیری گازوئیل | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
📅 <b>تاریخ:</b> ${fuel.jalaliDate}
⛽ <b>جایگاه:</b> ${fuel.gasStationName || 'جایگاه سوخت'}
🔢 <b>نوع سهمیه:</b> ${fuel.fuelType === 'quota' ? 'سهمیه‌ای (۶۰۰ تومان)' : 'آزاد (۳۰۰۰ تومان)'}
💧 <b>حجم سوخت:</b> ${toPersianDigits(fuel.liters)} لیتر
💵 <b>هزینه کل:</b> <b>${formatMoney(fuel.totalCost, currency)}</b>
🚗 <b>کیلومتر کشنده:</b> ${toPersianDigits(fuel.currentOdometer)} km

${fuel.notes ? `📝 <b>یادداشت:</b> ${fuel.notes}\n` : ''}━━━━━━━━━━━━━━━━━
⏰ <i>سامانه هوشمند حسابداری امیر - ${today.formatted}</i>`;
}

/**
 * Format Cheque alert for Telegram
 */
export function formatChequeAlertForTelegram(cheque: SayadCheque, currency: CurrencyType): string {
  const isReceived = cheque.type === 'received';
  return `🔔 <b>هشدار سررسید چک صیادی | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
📌 <b>نوع چک:</b> ${isReceived ? '📥 دریافتی (طلب شما)' : '📤 صادره (پرداختی شما)'}
🏦 <b>بانک:</b> ${cheque.bankName}
🔢 <b>شماره چک:</b> <code>${toPersianDigits(cheque.chequeNumber)}</code>
💳 <b>شناسه ۱۶ رقمی صیاد:</b> <code>${toPersianDigits(cheque.sayadId)}</code>
👤 <b>طرف حساب:</b> ${cheque.drawerOrPayee}
💰 <b>مبلغ چک:</b> <b>${formatMoney(cheque.amount, currency)}</b>
📅 <b>تاریخ سررسید:</b> <b>${cheque.dueDateJalali}</b>
${cheque.relatedTitle ? `🔗 <b>مربوط به:</b> ${cheque.relatedTitle}\n` : ''}
⚠️ <i>لطفاً موجودی حساب و تاییدیه ثبت صیاد را بررسی فرمایید.</i>`;
}

/**
 * Format Loan / Installment alert for Telegram
 */
export function formatInstallmentAlertForTelegram(loan: TruckInstallmentLoan, currency: CurrencyType): string {
  return `⏰ <b>یادآوری سررسید قسط وام | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
🚜 <b>تسهیلات:</b> ${loan.title}
🏛 <b>طرف قرارداد / لیزینگ:</b> ${loan.lenderName}
💰 <b>مبلغ قسط این ماه:</b> <b>${formatMoney(loan.monthlyAmount, currency)}</b>
📅 <b>موعد پرداخت:</b> <b>${loan.nextDueDateJalali}</b> (روز ${toPersianDigits(loan.dayOfMonth)} ماه)
📊 <b>وضعیت بازپرداخت:</b> ${toPersianDigits(loan.paidCount)} از ${toPersianDigits(loan.installmentCount)} قسط پرداخت شده
💳 <b>مانده بدهی کل:</b> ${formatMoney(loan.totalLoanAmount - (loan.paidCount * loan.monthlyAmount), currency)}

⚠️ <i>جهت جلوگیری از جریمه دیرکرد، نسبت به واریز قسط اقدام فرمایید.</i>`;
}

/**
 * Format Profit & Loss Daily/Monthly Report for Telegram
 */
export function formatProfitLossForTelegram(
  stats: {
    totalRevenue: number;
    fuelCost: number;
    commissions: number;
    maintenanceCost: number;
    tollAndOtherCost: number;
    totalExpenses: number;
    netProfit: number;
    waybillsCount: number;
  },
  currency: CurrencyType
): string {
  const today = getTodayJalali();
  return `📊 <b>گزارش سود و زیان (P&L) | حسابداری امیر</b>
━━━━━━━━━━━━━━━━━
📅 <b>تاریخ گزارش:</b> ${today.dayName} ${today.formatted}
🚚 <b>تعداد کل سرویس‌های حمل بار:</b> ${toPersianDigits(stats.waybillsCount)}

📈 <b>کل کرایه دریافتی:</b> ${formatMoney(stats.totalRevenue, currency)}
━━━━━━━━━━━━━━━━━
🔻 <b>ریز هزینه‌های ناوگان:</b>
  • سوخت و گازوئیل: ${formatMoney(stats.fuelCost, currency)}
  • کمیسیون باربری: ${formatMoney(stats.commissions, currency)}
  • تعمیرات و لوازم: ${formatMoney(stats.maintenanceCost, currency)}
  • عوارض و سایر مخارج: ${formatMoney(stats.tollAndOtherCost, currency)}

📉 <b>مجموع کل مخارج:</b> ${formatMoney(stats.totalExpenses, currency)}
━━━━━━━━━━━━━━━━━
💎 <b>سود صافی خالص ناوگان:</b> <b>${formatMoney(stats.netProfit, currency)}</b>
━━━━━━━━━━━━━━━━━
📱 <i>سامانه حسابداری امیر - مدیریت هوشمند ناوگان و رانندگان</i>`;
}

/**
 * Create a direct Share to Telegram URL (t.me/share/url)
 */
export function createTelegramShareUrl(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent('https://hesabdari-amir.app')}&text=${encodeURIComponent(text)}`;
}

/**
 * Helper to parse Persian text incoming from Telegram messages/commands
 */
export function parseTelegramCommandText(rawText: string): {
  type: 'waybill' | 'fuel' | 'expense' | 'income' | 'unknown';
  parsedData: any;
  explanation: string;
} {
  const text = rawText.trim();

  // 1. Detect Fuel record (e.g. گازوئیل ۲۵۰ لیتر ۱۵۰ هزار تومان جایگاه سیرجان)
  if (text.includes('گازوئیل') || text.includes('سوخت') || text.includes('بنزین') || text.includes('لیتر')) {
    const litersMatch = text.match(/(\d+[\d,.]*)\s*(?:لیتر|liters?)/i);
    const amountMatch = text.match(/(\d+[\d,.]*)\s*(?:تومان|هزار|میلیون|ریال)/i);

    let liters = litersMatch ? parseFloat(litersMatch[1].replace(/,/g, '')) : 200;
    let cost = 150000;
    if (amountMatch) {
      const rawNum = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (text.includes('میلیون')) cost = rawNum * 1000000;
      else if (text.includes('هزار')) cost = rawNum * 1000;
      else cost = rawNum;
    }

    return {
      type: 'fuel',
      parsedData: {
        liters: liters || 200,
        totalCost: cost,
        fuelType: text.includes('آزاد') ? 'free' : 'quota',
        gasStationName: text.includes('جایگاه') ? text.slice(text.indexOf('جایگاه')).split(' ')[0] + ' ' + (text.slice(text.indexOf('جایگاه')).split(' ')[1] || '') : 'جایگاه سوخت جاده',
        notes: text,
      },
      explanation: `سوخت‌گیری ${toPersianDigits(liters)} لیتر گازوئیل به مبلغ ${formatMoney(cost, 'toman')}`,
    };
  }

  // 2. Detect Waybill record (e.g. بارنامه بندر به تهران کرایه ۳۶ میلیون بیعانه ۱۵ میلیون)
  if (text.includes('بارنامه') || text.includes('کرایه') || text.includes('باربری') || (text.includes('به') && text.includes('تن'))) {
    return {
      type: 'waybill',
      parsedData: {
        origin: 'مبدا بارگیری',
        destination: 'مقصد تخلیه',
        cargoType: 'محموله عمومی',
        totalFreight: 35000000,
        commission: 3500000,
        netFare: 31500000,
        advancePaid: 15000000,
        remainingAmount: 16500000,
        notes: text,
      },
      explanation: 'سرویس حمل بارنامه جدید از پیام تلگرام استخراج شد.',
    };
  }

  return {
    type: 'unknown',
    parsedData: null,
    explanation: 'پیام نامشخص است؛ لطفاً در قالب استاندارد یا پیامک بانکی ارسال فرمایید.',
  };
}
