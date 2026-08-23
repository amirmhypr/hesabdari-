import { BankAccount, Budget, DebtLoan, SavingsGoal, Transaction } from '../types';

export interface CreateSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a structured Google Sheet with distinct sheets for Transactions, Accounts, and Budgets
 */
export async function createFinanceSpreadsheet(accessToken: string): Promise<CreateSheetResponse> {
  const title = `حسابداری شخصی هوشمند - ${new Date().toLocaleDateString('en-CA')}`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        autoRecalc: 'ON_CHANGE',
      },
      sheets: [
        {
          properties: {
            title: 'دفتر کل تراکنش‌ها',
            rightToLeft: true,
            gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'حساب‌ها و کارت‌ها',
            rightToLeft: true,
            gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'بودجه‌بندی ماهانه',
            rightToLeft: true,
            gridProperties: { rowCount: 50, columnCount: 5, frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'خطا در ایجاد گوگل شیتس.');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write Persian Header Rows
  const headersPayload = [
    {
      range: `'دفتر کل تراکنش‌ها'!A1:J1`,
      values: [
        ['شناسه', 'نوع', 'عنوان', 'مبلغ (تومان)', 'دسته‌بندی', 'زیردسته', 'تاریخ شمسی', 'طرف حساب', 'حساب بانکی', 'توضیحات'],
      ],
    },
    {
      range: `'حساب‌ها و کارت‌ها'!A1:F1`,
      values: [
        ['شناسه', 'نام حساب', 'بانک', 'شماره کارت', 'شماره شبا', 'موجودی فعلی (تومان)'],
      ],
    },
    {
      range: `'بودجه‌بندی ماهانه'!A1:E1`,
      values: [
        ['شناسه', 'دسته‌بندی', 'سقف ماهانه (تومان)', 'خرج شده (تومان)', 'مانده بودجه (تومان)'],
      ],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headersPayload,
    }),
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Pushes local state to Google Sheets
 */
export async function syncDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: {
    transactions: Transaction[];
    accounts: BankAccount[];
    budgets: Budget[];
  }
): Promise<void> {
  const txRows = data.transactions.map((t) => {
    const acc = data.accounts.find((a) => a.id === t.accountId);
    return [
      t.id,
      t.type === 'income' ? 'درآمد' : t.type === 'expense' ? 'هزینه' : 'انتقال',
      t.title,
      t.amount,
      t.categoryName,
      t.subCategory || '',
      t.jalaliDate,
      t.payeeOrPayer || '',
      acc?.name || '',
      t.notes || '',
    ];
  });

  const accRows = data.accounts.map((a) => [
    a.id,
    a.name,
    a.bankName,
    a.cardNumber || '',
    a.iban || '',
    a.balance,
  ]);

  const budgetRows = data.budgets.map((b) => [
    b.id,
    b.categoryName,
    b.monthlyLimit,
    b.currentSpent,
    Math.max(0, b.monthlyLimit - b.currentSpent),
  ]);

  // Clear existing rows (keep headers)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'دفتر کل تراکنش‌ها'!A2:J1000:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'حساب‌ها و کارت‌ها'!A2:F100:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'بودجه‌بندی ماهانه'!A2:E50:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  // Batch Write new rows
  const writePayload: any[] = [];
  if (txRows.length > 0) {
    writePayload.push({
      range: `'دفتر کل تراکنش‌ها'!A2:J${txRows.length + 1}`,
      values: txRows,
    });
  }
  if (accRows.length > 0) {
    writePayload.push({
      range: `'حساب‌ها و کارت‌ها'!A2:F${accRows.length + 1}`,
      values: accRows,
    });
  }
  if (budgetRows.length > 0) {
    writePayload.push({
      range: `'بودجه‌بندی ماهانه'!A2:E${budgetRows.length + 1}`,
      values: budgetRows,
    });
  }

  if (writePayload.length > 0) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: writePayload,
      }),
    });

    if (!res.ok) {
      throw new Error('خطا در به‌روزرسانی خانه‌های گوگل شیتس');
    }
  }
}

/**
 * Imports transactions and data from Google Sheets
 */
export async function fetchDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ transactions: Transaction[] }> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'دفتر کل تراکنش‌ها'!A2:J1000`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error('خطا در خواندن داده‌ها از گوگل شیتس');
  }

  const result = await res.json();
  const rows: any[][] = result.values || [];

  const transactions: Transaction[] = rows.map((r, idx) => ({
    id: r[0] || `tx-imported-${Date.now()}-${idx}`,
    type: r[1] === 'درآمد' ? 'income' : r[1] === 'انتقال' ? 'transfer' : 'expense',
    title: r[2] || 'تراکنش وارد شده',
    amount: parseInt(String(r[3]).replace(/[^0-9]/g, ''), 10) || 0,
    categoryId: 'cat-imported',
    categoryName: r[4] || 'متفرقه',
    subCategory: r[5] || undefined,
    jalaliDate: r[6] || '1405/06/01',
    payeeOrPayer: r[7] || undefined,
    accountId: 'acc-1',
    notes: r[9] || undefined,
    createdAt: new Date().toISOString(),
  }));

  return { transactions };
}
