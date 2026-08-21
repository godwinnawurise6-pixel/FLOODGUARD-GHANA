import React, { useState, useEffect } from 'react';
import { Smartphone, Apple, Monitor, Share2, PlusSquare, MoreVertical, Download, X, Check, Laptop, Globe } from 'lucide-react';
import { getMobilePlatformInfo, triggerHapticFeedback } from '../services/mobileUtils';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ isOpen, onClose }) => {
  const [platformInfo, setPlatformInfo] = useState(getMobilePlatformInfo());
  const [activeTab, setActiveTab] = useState<'desktop' | 'ios' | 'android'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const info = getMobilePlatformInfo();
    setPlatformInfo(info);
    if (info.isAndroid) {
      setActiveTab('android');
    } else if (info.isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('desktop');
    }

    if (info.isStandalone) {
      setIsInstalled(true);
    }

    // Capture browser install prompt (Chrome/Edge on Desktop and Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    triggerHapticFeedback(30);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on Desktop or Android: Click the Install icon in your browser address bar or open the browser menu (⋮) and select "Install FloodGuard Ghana".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto font-sans">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-black shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 block">
                UNIVERSAL MULTI-PLATFORM APP
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                Install on PC, iOS, or Android
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Standalone status badge */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
              <Check className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-extrabold">App Already Running in Native Mode!</div>
                <div className="text-xs text-emerald-800">
                  FloodGuard Ghana is installed and operating with offline data sync & push alerts.
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              FloodGuard Ghana works seamlessly across <strong className="text-slate-900">PC & Laptop Desktops (Windows, Mac, Linux)</strong>, <strong className="text-slate-900">iPhone / iPad (iOS)</strong>, and <strong className="text-slate-900">Android smartphones & tablets</strong>. Install it to your home screen or desktop for full offline flood maps and instant GPS route navigation.
            </p>
          )}

          {/* 3-Platform Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab('desktop');
              }}
              className={`py-2.5 px-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'desktop'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>PC / Desktop</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab('ios');
              }}
              className={`py-2.5 px-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ios'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Apple className="w-4 h-4 text-amber-400" />
              <span>iOS (iPhone)</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab('android');
              }}
              className={`py-2.5 px-2 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'android'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Android</span>
            </button>
          </div>

          {/* Instructions Body per Platform */}
          {activeTab === 'desktop' && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between font-extrabold text-xs uppercase text-slate-900">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Windows, Mac, or Linux Desktop Setup:</span>
                </div>
              </div>

              {deferredPrompt && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Click Install FloodGuard Desktop App</span>
                </button>
              )}

              <ol className="text-xs font-medium text-slate-700 space-y-2.5 list-decimal list-inside leading-relaxed">
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  In <strong className="text-slate-900">Google Chrome or Microsoft Edge</strong>, click the <strong className="text-blue-600">Install icon (⊕)</strong> on the right side of the URL address bar.
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  Alternatively, click the <strong className="text-slate-900">3 dots (⋮)</strong> menu in top-right corner → <strong className="text-slate-900">"Save and share"</strong> → <strong className="text-slate-900">"Install FloodGuard Ghana"</strong>.
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  On <strong className="text-slate-900">Mac Safari</strong>, select <strong className="text-slate-900">File</strong> menu → <strong className="text-slate-900">"Add to Dock"</strong> for instant desktop access.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase text-slate-900">
                <Apple className="w-4 h-4 text-slate-900" />
                <span>iPhone & iPad Safari Installation Steps:</span>
              </div>

              <ol className="text-xs font-medium text-slate-700 space-y-2.5 list-decimal list-inside leading-relaxed">
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  Open this application in <strong className="text-slate-900">Safari browser</strong> on your iPhone or iPad.
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <span>Tap the <strong className="text-slate-900">Share button</strong> at the bottom Safari navigation bar:</span>
                  <Share2 className="w-4 h-4 text-blue-600 inline shrink-0" />
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <span>Scroll down and tap <strong className="text-slate-900">"Add to Home Screen"</strong>:</span>
                  <PlusSquare className="w-4 h-4 text-emerald-600 inline shrink-0" />
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  Tap <strong className="text-slate-900">"Add"</strong> in top right. The FloodGuard icon will appear on your iPhone home screen!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between font-extrabold text-xs uppercase text-slate-900">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Android Phone & Tablet Installation:</span>
                </div>
              </div>

              {deferredPrompt && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Tap Install Android Native App</span>
                </button>
              )}

              <ol className="text-xs font-medium text-slate-700 space-y-2.5 list-decimal list-inside leading-relaxed">
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  Open in <strong className="text-slate-900">Google Chrome</strong> or Samsung Internet.
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <span>Tap the <strong className="text-slate-900">3-dots menu (⋮)</strong> in Chrome top-right corner:</span>
                  <MoreVertical className="w-4 h-4 text-slate-900 inline shrink-0" />
                </li>
                <li className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  Select <strong className="text-slate-900">"Install app"</strong> or <strong className="text-slate-900">"Add to Home screen"</strong>.
                </li>
              </ol>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase text-xs tracking-wider rounded-2xl shadow transition-transform active:scale-95"
          >
            Got It — Continue Using App
          </button>

        </div>
      </div>
    </div>
  );
};
