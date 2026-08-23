import React, { useState } from 'react';
import {
  FileSpreadsheet, X, RefreshCw, CheckCircle2, ExternalLink,
  AlertCircle, Cloud, UploadCloud, DownloadCloud, LogOut, Check
} from 'lucide-react';
import { BankAccount, Budget, GoogleSheetsSyncStatus, Transaction } from '../types';
import { getGoogleAccessToken, loginWithGoogle, logoutFirebase } from '../services/firebaseAuth';
import { createFinanceSpreadsheet, fetchDataFromSpreadsheet, syncDataToSpreadsheet } from '../services/googleSheetsService';
import { getTodayJalali } from '../utils/jalali';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: BankAccount[];
  budgets: Budget[];
  syncStatus: GoogleSheetsSyncStatus;
  onUpdateSyncStatus: (status: GoogleSheetsSyncStatus) => void;
  onImportTransactions: (txs: Transaction[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  budgets,
  syncStatus,
  onUpdateSyncStatus,
  onImportTransactions,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      const token = await getGoogleAccessToken();

      // Create new Spreadsheet if not created yet
      let spId = syncStatus.spreadsheetId;
      let spUrl = syncStatus.spreadsheetUrl;

      if (!spId && token) {
        const created = await createFinanceSpreadsheet(token);
        spId = created.spreadsheetId;
        spUrl = created.spreadsheetUrl;
      }

      const updated: GoogleSheetsSyncStatus = {
        isConnected: true,
        userEmail: user.email,
        userPhoto: user.photoURL,
        spreadsheetId: spId,
        spreadsheetUrl: spUrl,
        lastSyncedAt: getTodayJalali().formatted,
      };

      onUpdateSyncStatus(updated);
      setSuccessMsg('اتصال به حساب گوگل و ایجاد گوگل شیت با موفقیت انجام شد.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در ورود با گوگل');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToSheets = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = await getGoogleAccessToken();
      if (!token) throw new Error('لطفاً مجدداً با حساب گوگل وارد شوید.');

      let spId = syncStatus.spreadsheetId;
      if (!spId) {
        const created = await createFinanceSpreadsheet(token);
        spId = created.spreadsheetId;
        syncStatus.spreadsheetUrl = created.spreadsheetUrl;
      }

      await syncDataToSpreadsheet(token, spId, {
        transactions,
        accounts,
        budgets,
      });

      const today = getTodayJalali();
      onUpdateSyncStatus({
        ...syncStatus,
        spreadsheetId: spId,
        lastSyncedAt: today.formatted,
      });
      setSuccessMsg(`همگام‌سازی اطلاعات (${transactions.length} تراکنش) با گوگل شیت با موفقیت انجام شد.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در ارسال داده به گوگل شیت');
    } finally {
      setLoading(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!syncStatus.spreadsheetId) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = await getGoogleAccessToken();
      if (!token) throw new Error('لطفاً مجدداً با حساب گوگل وارد شوید.');

      const result = await fetchDataFromSpreadsheet(token, syncStatus.spreadsheetId);
      if (result.transactions.length > 0) {
        onImportTransactions(result.transactions);
        setSuccessMsg(`${result.transactions.length} تراکنش از گوگل شیتس دریافت و جای‌گذاری شد.`);
      } else {
        setSuccessMsg('هیچ ردیف جدیدی در گوگل شیت یافت نشد.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در خواندن داده از گوگل شیت');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutFirebase();
    onUpdateSyncStatus({
      isConnected: false,
      userEmail: null,
      userPhoto: null,
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSyncedAt: null,
    });
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">همگام‌سازی با Google Sheets</h3>
              <p className="text-xs text-slate-500">پشتیبان‌گیری زنده و مشاهده جداول مالی در گوگل درایو</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth / Connection Block */}
        {!syncStatus.isConnected ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">اتصال مستقیم به حساب گوگل</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                با اتصال حساب گوگل، یک فایل اکسل هوشمند راست‌به‌چپ با زبان فارسی در گوگل درایو شما ایجاد می‌شود.
              </p>
            </div>

            <button
              onClick={handleConnectGoogle}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 mx-auto"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>ورود با حساب گوگل و فعال‌سازی شیتس</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Connected User Badge */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {syncStatus.userPhoto ? (
                  <img src={syncStatus.userPhoto} alt="Google Avatar" className="w-9 h-9 rounded-xl" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    G
                  </div>
                )}
                <div>
                  <p className="font-black text-slate-800">{syncStatus.userEmail}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    آخرین همگام‌سازی: {syncStatus.lastSyncedAt || 'هنوز انجام نشده'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="قطع ارتباط"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Link to Spreadsheet */}
            {syncStatus.spreadsheetUrl && (
              <a
                href={syncStatus.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-800 hover:bg-emerald-100 transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>باز کردن فایل گوگل شیتس در تب جدید</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handlePushToSheets}
                disabled={loading}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>ارسال داده‌ها به شیت</span>
              </button>

              <button
                onClick={handlePullFromSheets}
                disabled={loading}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <DownloadCloud className="w-4 h-4 text-slate-600" />
                <span>دریافت داده از شیت</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
