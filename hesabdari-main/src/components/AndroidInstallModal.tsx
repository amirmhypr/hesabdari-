import React, { useState, useEffect } from 'react';
import {
  Smartphone, Download, QrCode, Copy, Check, ExternalLink,
  ShieldCheck, Sparkles, X, CheckCircle2, ChevronRight,
  WifiOff, Zap, Share2
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onPromptInstall?: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onPromptInstall,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'pwa' | 'apk' | 'qr'>('pwa');
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    if (navigator.clipboard && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Safe QR code image using quick public chart QR service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl || 'https://ais-pre-bxanmfkkp7emapxuivdrio-286937177793.us-west2.run.app'
  )}&bgcolor=ffffff&color=065f46&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">دانلود و نصب نسخه اندروید</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Android & PWA
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                اپلیکیشن اختصاصی حسابداری امیر برای گوشی‌ها و تبلت‌های اندروید
              </p>
            </div>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveGuideTab('pwa')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGuideTab === 'pwa'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>نصب فوری روی گوشی (PWA)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuideTab('qr')}
              className={`py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGuideTab === 'qr'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>اسکن QR و انتقال</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuideTab('apk')}
              className={`py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGuideTab === 'apk'
                  ? 'bg-white text-emerald-900 shadow-sm font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>فایل خام و APK</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs flex-1">
          
          {/* TAB 1: PWA Direct Install */}
          {activeGuideTab === 'pwa' && (
            <div className="space-y-4">
              {/* Direct Install Button (if browser triggered prompt) */}
              {deferredPrompt && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm text-emerald-900">نصب خودکار آماده است!</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      مرورگر شما از نصب مستقیم پشتیبانی می‌کند. روی دکمه زیر کلیک کنید.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onPromptInstall}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>نصب مستقیم</span>
                  </button>
                </div>
              )}

              {/* Benefits of Android PWA */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-1.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">بدون نیاز به بازار</span>
                  <span className="text-[10px] text-slate-400">نصب آنی و فوق سریع</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-1.5">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">آفلاین و کش خودکار</span>
                  <span className="text-[10px] text-slate-400">بدون مصرف اضافه اینترنت</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center mb-1.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">تمام صفحه (Full Screen)</span>
                  <span className="text-[10px] text-slate-400">مانند اپلیکیشن بومی</span>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>آموزش تصویری نصب در ۳ ثانیه در گوشی اندروید:</span>
                </h4>

                <div className="space-y-2.5 pr-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">باز کردن لینک برنامه در مرورگر گوشی (کروم / سامسونگ)</p>
                      <p className="text-[11px] text-slate-500">
                        لینک برنامه را کپی کرده یا با اسکن QR در مرورگر Chrome یا Samsung Internet گوشی باز کنید.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">زدن منوی سه نقطه (⋮) بالای صفحه مرورگر</p>
                      <p className="text-[11px] text-slate-500">
                        در منوی مرورگر، روی گزینه <b>«نصب برنامه» (Install app)</b> یا <b>«افزودن به صفحه اصلی» (Add to Home screen)</b> کلیک کنید.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      ۳
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">تأیید نصب و قرارگیری آیکون در صفحه برنامه‌های گوشی</p>
                      <p className="text-[11px] text-slate-500">
                        آیکون «حسابداری امیر» در کنار سایر اپلیکیشن‌های گوشی شما قرار می‌گیرد و با کلیک روی آن، به صورت تمام‌صفحه باز می‌شود.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR Code Transfer to Mobile */}
          {activeGuideTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-slate-600 font-medium">
                دوربین گوشی اندروید خود را روی بارکد زیر بگیرید تا برنامه روی موبایل باز شده و دکمه نصب نمایان شود:
              </p>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for Mobile App"
                  className="w-48 h-48 mx-auto rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="flex items-center gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] text-left ltr font-mono select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی آدرس'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: APK / Developer Build */}
          {activeGuideTab === 'apk' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <h4 className="font-black text-xs flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ساخت فایل خام APK برای انتشار در کافه بازار یا مایکت</span>
                </h4>
                <p className="text-[11px] text-amber-700 mt-1">
                  پروژه دارای فایل‌های استاندارد <code>manifest.json</code> و <code>sw.js</code> است و می‌توانید در ۲ دقیقه آن را به فایل APK با امضای دیجیتال تبدیل کنید.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs mb-1">روش ۱: استفاده از ابزار آنلاین PWABuilder (رایگان)</span>
                  <p className="text-[11px] text-slate-500 mb-2">
                    آدرس برنامه را در سایت <b>pwabuilder.com</b> وارد کرده و دکمه «Generate Android Package (APK / AAB)» را بزنید.
                  </p>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline text-[11px]"
                  >
                    <span>ورود به سایت PWABuilder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs mb-1">روش ۲: ساخت با Google Bubblewrap CLI</span>
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-[10px] font-mono ltr text-left overflow-x-auto space-y-1">
                    <div>npm install -g @bubblewrap/cli</div>
                    <div>bubblewrap init --manifest="{currentUrl ? `${currentUrl}manifest.json` : 'https://.../manifest.json'}"</div>
                    <div>bubblewrap build</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'لینک کپی شد' : 'کپی لینک برنامه'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors cursor-pointer"
          >
            متوجه شدم و بستن
          </button>
        </div>

      </div>
    </div>
  );
};
