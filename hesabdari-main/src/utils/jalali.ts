// Jalali (Solar Hijri) Date Conversion & Formatting Utilities

export interface JalaliDateObject {
  jy: number;
  jm: number;
  jd: number;
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDateObject {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy2 = jy + 1595;
  let days = -355668 + (365 * jy2) + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= gd_m[gm]) {
    days -= gd_m[gm];
    gm++;
  }
  let gd = days + 1;
  return { gy, gm, gd };
}

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEK_DAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

export function getTodayJalali(): { year: number; month: number; day: number; formatted: string; fullString: string; dayName: string } {
  const now = new Date();
  const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const monthName = JALALI_MONTH_NAMES[j.jm - 1];
  const dayName = PERSIAN_WEEK_DAYS[now.getDay()];
  const formatted = `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  const fullString = `${dayName} ${toPersianDigits(j.jd)} ${monthName} ${toPersianDigits(j.jy)}`;
  return { year: j.jy, month: j.jm, day: j.jd, formatted, fullString, dayName };
}

export function formatISODateToJalali(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function formatISODateToJalaliFull(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toPersianDigits(j.jd)} ${JALALI_MONTH_NAMES[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}

export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatMoney(amount: number, currency: 'toman' | 'rial' | 'usd' = 'toman'): string {
  let displayAmount = amount;
  let unit = 'تومان';

  if (currency === 'rial') {
    displayAmount = amount * 10;
    unit = 'ریال';
  } else if (currency === 'usd') {
    // approx 65,000 toman per USD display conversion
    displayAmount = Math.round(amount / 65000 * 100) / 100;
    return `$${displayAmount.toLocaleString('en-US')}`;
  }

  const formattedNum = Math.abs(displayAmount).toLocaleString('en-US');
  const persianNum = toPersianDigits(formattedNum);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${persianNum} ${unit}`;
}

// Convert numbers into Persian words (e.g. 1500000 -> یک میلیون و پانصد هزار تومان)
export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر تومان';
  if (!num || isNaN(num)) return '';

  const yekan = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const dahgan10 = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const dahgan = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const sadgan = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const levels = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  let n = Math.abs(Math.floor(num));
  let parts: string[] = [];
  let level = 0;

  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      const cSad = Math.floor(chunk / 100);
      const cDah = Math.floor((chunk % 100) / 10);
      const cYek = chunk % 10;

      let chunkWords: string[] = [];
      if (cSad > 0) chunkWords.push(sadgan[cSad]);

      if (cDah === 1) {
        chunkWords.push(dahgan10[cYek]);
      } else {
        if (cDah > 1) chunkWords.push(dahgan[cDah]);
        if (cYek > 0) chunkWords.push(yekan[cYek]);
      }

      const chunkString = chunkWords.join(' و ');
      if (levels[level]) {
        parts.unshift(`${chunkString} ${levels[level]}`);
      } else {
        parts.unshift(chunkString);
      }
    }
    n = Math.floor(n / 1000);
    level++;
  }

  const result = parts.join(' و ') + ' تومان';
  return num < 0 ? `منفی ${result}` : result;
}
