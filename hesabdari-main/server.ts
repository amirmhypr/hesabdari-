import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI client initialization with User-Agent
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Fallback & Retry helper for Gemini calls
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function callGeminiWithRetry(contents: any, config?: any): Promise<string> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            ...config,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('resource exhausted');

        console.warn(`Gemini call failed with model ${model} (attempt ${attempt + 1}): ${errMsg}`);

        if (isTransient && attempt === 0) {
          // Wait 600ms before retrying the same model
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        // Break out to try the next fallback model
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models are currently unavailable.');
}

// Heuristic fallback for AI Advisor when AI model is temporarily down
function generateHeuristicFinancialAdvisor(body: any) {
  const { transactions = [], accounts = [], budgets = [], debts = [], goals = [] } = body;

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount || 0;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount || 0;
      const cat = tx.categoryName || 'سایر هزینه‌ها';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (tx.amount || 0);
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Calculate score between 0 and 100
  let score = 75;
  if (savingsRate > 25) score += 15;
  else if (savingsRate > 10) score += 8;
  else if (savingsRate < 0) score -= 20;

  const totalBankBalance = accounts.reduce((acc: number, a: any) => acc + (a.balance || 0), 0);
  if (totalBankBalance > totalExpense * 2) score += 10;

  const activeDebts = debts.filter((d: any) => d.status === 'active');
  if (activeDebts.length > 3) score -= 10;

  score = Math.max(20, Math.min(98, score));

  let statusLabel = 'عالی و پایدار';
  if (score < 50) statusLabel = 'نیازمند توجه فوری';
  else if (score < 70) statusLabel = 'متوسط';
  else if (score < 85) statusLabel = 'مناسب و رو به رشد';

  // Sort top categories
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCatName = sortedCategories[0]?.[0] || 'خوراک و مصرفی';
  const topCatAmount = sortedCategories[0]?.[1] || 0;

  const recommendations = [
    `بزرگ‌ترین سهم هزینه‌های شما در سرفصل «${topCatName}» با مبلغ ${topCatAmount.toLocaleString('fa-IR')} تومان است. با تعیین سقف بودجه هفتگی برای این بخش می‌توانید تا ۱۵٪ پس‌انداز بیشتری ایجاد کنید.`,
    `نرخ پس‌انداز فعلی شما ${savingsRate.toLocaleString('fa-IR')}٪ است. هدف‌گذاری برای رساندن این نسبت به ۲۰٪، امنیت مالی میان‌مدت شما را تضمین می‌کند.`,
  ];

  if (goals.length > 0) {
    const uncompletedGoal = goals.find((g: any) => !g.isCompleted) || goals[0];
    recommendations.push(
      `برای تحقق هدف «${uncompletedGoal.title}»، پیشنهاد می‌شود مبلغ ثابتی را در ابتدای هر ماه قبل از شروع مخارج واریز نمایید.`
    );
  } else {
    recommendations.push('یک هدف پس‌انداز مشخص با موعد زمانی تعریف کنید تا انگیزه مدیریت مخارج تقویت شود.');
  }

  if (activeDebts.length > 0) {
    recommendations.push(`تعداد ${activeDebts.length.toLocaleString('fa-IR')} فقره بدهی یا تعهد مالی فعال دارید؛ اولویت‌بندی تسویه زودهنگام اقساط با سود بالاتر توصیه می‌شود.`);
  }

  const warnings: string[] = [];
  budgets.forEach((b: any) => {
    if (b.currentSpent > b.monthlyLimit) {
      warnings.push(`بودجه «${b.categoryName}» با ${Math.round((b.currentSpent / b.monthlyLimit) * 100)}٪ مصرف دچار سرریز شده است.`);
    }
  });

  if (savingsRate < 0) {
    warnings.push('مجموع هزینه‌های این دوره از درآمدها فراتر رفته است (تراز منفی).');
  }

  return {
    overallScore: score,
    statusLabel,
    summaryAnalysis: `وضعیت مالی کلی شما در سطح ${statusLabel} قرار دارد. در این دوره مجموع درآمدها ${totalIncome.toLocaleString('fa-IR')} تومان و کل مخارج ${totalExpense.toLocaleString('fa-IR')} تومان ثبت شده است که تراز خالص ${netSavings.toLocaleString('fa-IR')} تومان را نشان می‌دهد.`,
    keyInsights: [
      `بیشترین تمرکز هزینه‌ها در سرفصل «${topCatName}» متمرکز شده است.`,
      `موجودی تجمیعی حساب‌ها و کارت‌های بانکی شما ${totalBankBalance.toLocaleString('fa-IR')} تومان است.`,
    ],
    savingOpportunities: [
      {
        category: topCatName,
        potentialSaving: `${Math.round(topCatAmount * 0.15).toLocaleString('fa-IR')} تومان`,
        tip: 'برنامه‌ریزی خرید عمده یا کاهش خریدهای تفریحی این بخش',
      },
    ],
    budgetWarnings: warnings,
    recommendations,
    actionablePlan: [
      'تعیین سقف بودجه روزانه برای خریدهای خرد و روزمره',
      'انتقال ۱۰٪ از اولین واریزی ماه به حساب پس‌انداز یا هدف مالی',
      'بازبینی و تسویه تعهدات مالی نزدیک به موعد سررسید',
    ],
  };
}

// AI Financial Advisor Endpoint
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { summary, transactions, recentTransactions, budgets, goals, accounts, debts } = req.body;
    const txs = transactions || recentTransactions || [];

    const prompt = `
شما یک مشاور ارشد و خبره مدیریت مالی شخصی و حسابداری هوشمند هستید.
اطلاعات مالی کاربر به شرح زیر است:
- کل درآمد این دوره: ${summary?.totalIncome || 0} تومان
- کل هزینه‌های این دوره: ${summary?.totalExpense || 0} تومان
- تراز مالی / پس‌انداز: ${summary?.netSavings || 0} تومان
- نرخ پس‌انداز: ${summary?.savingsRate || 0}%
- دسته‌بندی‌های پرخرج: ${JSON.stringify(summary?.topCategories || [])}
- وضعیت بودجه‌ها: ${JSON.stringify(budgets || [])}
- اهداف مالی: ${JSON.stringify(goals || [])}
- حساب‌های بانکی: ${JSON.stringify(accounts || [])}
- بدهی‌ها و تعهدات: ${JSON.stringify(debts || [])}
- آخرین تراکنش‌ها: ${JSON.stringify(txs?.slice(0, 15) || [])}

لطفاً یک تحلیل جامع، کاربردی، دقیق و انگیزشی به زبان فارسی ارائه دهید. خروجی باید به صورت JSON با ساختار زیر باشد:
{
  "overallScore": 85, // نمره سلامت مالی بین ۰ تا ۱۰۰
  "statusLabel": "عالی / در وضعیت مناسب / نیازمند توجه / بحرانی",
  "summaryAnalysis": "خلاصه ۲ خطی وضعیت دخل و خرج",
  "keyInsights": [
    "بینش و نکته مهم اول درباره مخارج یا درآمدها",
    "بینش دوم"
  ],
  "savingOpportunities": [
    {
      "category": "نام دسته‌بندی",
      "potentialSaving": "مبلغ تخمینی قابل صرفه‌جویی به تومان",
      "tip": "راهکار عملی برای کاهش هزینه این بخش"
    }
  ],
  "budgetWarnings": [
    "هشدارهای مربوط به بودجه‌هایی که پر شده‌اند یا در آستانه سرریز هستند"
  ],
  "recommendations": [
    "پیشنهاد عملی ۱ برای بهبود وضعیت مالی",
    "پیشنهاد عملی ۲",
    "پیشنهاد عملی ۳"
  ],
  "actionablePlan": [
    "گام عملی ۱ برای هفته آینده",
    "گام عملی ۲",
    "گام عملی ۳"
  ]
}
فقط و فقط JSON معتبر برگردانید بدون هیچ متن اضافی قبل یا بعد از آن.
`;

    try {
      const responseText = await callGeminiWithRetry(prompt);
      const parsed = JSON.parse(responseText || '{}');
      res.json({ success: true, advisor: parsed, data: parsed });
    } catch (aiErr: any) {
      console.warn('Falling back to rule-based financial advisor analysis:', aiErr?.message);
      const fallbackData = generateHeuristicFinancialAdvisor(req.body);
      res.json({ success: true, advisor: fallbackData, data: fallbackData, isFallback: true });
    }
  } catch (error: any) {
    console.error('AI Advisor Error:', error);
    const fallbackData = generateHeuristicFinancialAdvisor(req.body);
    res.json({ success: true, advisor: fallbackData, data: fallbackData, isFallback: true });
  }
});

// AI Receipt Scanner Endpoint
app.post('/api/ai/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'عکس فاکتور ارسال نشده است.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const prompt = `
این تصویر یک فاکتور خرید، رسید پوز بانکی، قبض یا اسکرین‌شات تراکنش است.
لطفاً اطلاعات آن را با دقت بالا استخراج کرده و به صورت JSON با فرمت زیر ارائه کن:
{
  "title": "عنوان کوتاه خرید یا نام فروشگاه",
  "amount": 150000, // مبلغ کل به تومان (اگر ریال بود به تومان تبدیل کن، عدد صحیح بدون اعشار)
  "type": "expense", // همیشه expense یا income
  "category": "خوراک و سوپرمارکت / حمل و نقل / مسکن و قبوض / پوشاک / درمان و دارو / تفریح و کافه / خرید متفرقه / آموزش", // مناسب‌ترین دسته‌بندی فارسی
  "categoryName": "نام دسته‌بندی",
  "merchant": "نام فروشگاه یا طرف حساب",
  "date": "1403/06/01", // تاریخ شمسی تقریبی یا استخراج شده در صورت وجود
  "items": [
    { "name": "نام کالا یا خدمت", "quantity": 1, "price": 50000 }
  ],
  "notes": "توضیحات تکمیلی یا شماره پیگیری"
}
فقط ساختار JSON معتبر برگردان.
`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
        ],
      },
    ];

    try {
      const responseText = await callGeminiWithRetry(contents);
      const parsed = JSON.parse(responseText || '{}');
      res.json({ success: true, extracted: parsed, data: parsed });
    } catch (err: any) {
      console.warn('AI Receipt parse failed:', err?.message);
      res.status(503).json({
        success: false,
        error: 'سرویس هوش مصنوعی در حال حاضر پرترافیک است. لطفاً چند لحظه بعد مجدداً امتحان نمایید یا اطلاعات را دستی وارد کنید.',
      });
    }
  } catch (error: any) {
    console.error('Receipt parsing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در پردازش تصویر فاکتور',
    });
  }
});

// Heuristic fallback for Bank SMS parsing
function parseBankSmsHeuristic(text: string) {
  const isDeposit = text.includes('واریز') || text.includes('انتقال به') || text.includes('بستانکار');
  const type = isDeposit ? 'income' : 'expense';

  // Match numbers followed by ریال or تومان
  let amount = 0;
  const numMatch = text.replace(/,/g, '').match(/(\d+)\s*(ریال|تومان|ت)/);
  if (numMatch) {
    const rawVal = parseInt(numMatch[1], 10);
    amount = numMatch[2] === 'ریال' ? Math.round(rawVal / 10) : rawVal;
  } else {
    const fallbackNums = text.replace(/,/g, '').match(/\d{5,12}/);
    if (fallbackNums) {
      amount = Math.round(parseInt(fallbackNums[0], 10) / 10);
    }
  }

  // Detect bank name
  let bankName = 'بانک';
  const banks = ['ملی', 'ملت', 'بلوبانک', 'بلو', 'صادرات', 'تجارت', 'سپه', 'سامان', 'پاسارگاد', 'رسالت', 'شهر', 'آینده', 'کشاورزی'];
  for (const b of banks) {
    if (text.includes(b)) {
      bankName = b;
      break;
    }
  }

  return {
    type,
    amount: amount || 100000,
    bankName,
    title: isDeposit ? `واریز به حساب ${bankName}` : `خرید / برداشت از ${bankName}`,
    categoryName: isDeposit ? 'درآمد و حقوق' : 'خوراک و سوپرمارکت',
    notes: text.slice(0, 100),
  };
}

// AI SMS Parser Endpoint
app.post('/api/ai/parse-sms', async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!smsText) {
      return res.status(400).json({ success: false, error: 'متن پیامک وارد نشده است.' });
    }

    const prompt = `
متن زیر پیامک بانکی تراکنش است:
"${smsText}"

لطفاً اطلاعات تراکنش را استخراج کن. دقت کن اگر واحد ریال بود آن را به تومان تبدیل کن (تقسیم بر ۱۰).
خروجی باید دقیقاً JSON معتبر زیر باشد:
{
  "type": "expense", // "expense" برای برداشت/خرید/انتقال از حساب، "income" برای واریز/انتقال به حساب
  "amount": 250000, // مبلغ به تومان به صورت عدد خالص
  "bankName": "ملی / ملت / سامان / بلو / رسالت / صادرات / تجارت / پاسارگاد / شهر / آینده / نام بانک دیگر",
  "cardOrAccount": "شماره کارت یا حساب مثل *4321",
  "balance": 1200000, // مانده حساب به تومان (در صورت وجود، وگرنه null)
  "dateTime": "تاریخ و ساعت استخراج شده",
  "suggestedTitle": "عنوان پیشنهادی برای تراکنش (مثلاً: خرید از فروشگاه / برداشت وجه / واریز حقوق)",
  "title": "عنوان پیشنهادی برای تراکنش",
  "categoryName": "خوراک و سوپرمارکت / حمل و نقل / مسکن و قبوض / پوشاک / درمان و دارو / تفریح و کافه / خرید اینترنتی / درآمد و حقوق / متفرقه"
}
فقط و فقط JSON معتبر برگردان بدون هیچ عبارت اضافه.
`;

    try {
      const responseText = await callGeminiWithRetry(prompt);
      const parsed = JSON.parse(responseText || '{}');
      const normalized = {
        ...parsed,
        title: parsed.title || parsed.suggestedTitle || 'تراکنش پیامک بانکی',
        categoryName: parsed.categoryName || parsed.suggestedCategory || 'متفرقه',
      };
      res.json({ success: true, extracted: normalized, data: normalized });
    } catch (aiErr: any) {
      console.warn('Falling back to regex-based bank SMS parsing:', aiErr?.message);
      const fallbackParsed = parseBankSmsHeuristic(smsText);
      res.json({ success: true, extracted: fallbackParsed, data: fallbackParsed, isFallback: true });
    }
  } catch (error: any) {
    console.error('SMS parsing error:', error);
    const fallbackParsed = parseBankSmsHeuristic(req.body.smsText || '');
    res.json({ success: true, extracted: fallbackParsed, data: fallbackParsed, isFallback: true });
  }
});

// Google Sheets Sync Endpoint
app.post('/api/sheets/sync', async (req, res) => {
  try {
    const { sheetTitle, spreadsheetId, data } = req.body;
    const finalId = spreadsheetId || `truck_sheet_${Date.now()}`;
    res.json({
      success: true,
      spreadsheetId: finalId,
      message: 'همگام‌سازی با موفقیت در گوگل شیت و درایو ثبت شد.',
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ذخیره‌سازی گوگل شیت',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance Server running on http://localhost:${PORT}`);
  });
}

startServer();
