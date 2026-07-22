/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, HelpCircle, Chrome, Compass, CheckCircle, Info, ChevronRight, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isAndroid: false, isIOS: false, isChrome: false });

  useEffect(() => {
    // Detect Device type
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(ua);
    const isIOS = /ipad|iphone|ipod/i.test(ua) && !('MSStream' in window);
    const isChrome = /chrome|crios/i.test(ua);

    setDeviceInfo({ isAndroid, isIOS, isChrome });

    // Check if app is already running as PWA (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Auto-trigger native install prompt on first click/touchstart for Android
      if (isAndroid) {
        const triggerNativePrompt = () => {
          (e as any).prompt();
          (e as any).userChoice.then((choiceResult: any) => {
            console.log('[PWA] Auto-triggered native prompt outcome:', choiceResult.outcome);
            setDeferredPrompt(null);
            setShowPrompt(false);
          });
          window.removeEventListener('click', triggerNativePrompt);
          window.removeEventListener('touchstart', triggerNativePrompt);
        };
        window.addEventListener('click', triggerNativePrompt);
        window.addEventListener('touchstart', triggerNativePrompt);
      }

      // Auto-show prompt banner after 3 seconds on load unless dismissed
      const dismissed = sessionStorage.getItem('install_prompt_dismissed') === 'true';
      if (!dismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // Always show prompt helper on mobile if not installed, even if beforeinstallprompt is not supported
    // to give Android/iOS users a chance to see instructions
    const dismissed = sessionStorage.getItem('install_prompt_dismissed') === 'true';
    if (!dismissed && (isAndroid || isIOS) && !deferredPrompt) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // No native prompt, open manual PWA installation instructions modal
      setShowTutorial(true);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem('install_prompt_dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            id="install-prompt-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white rounded-2xl shadow-2xl border border-teal-100 p-5 overflow-hidden"
          >
            {/* Dynamic Background Flare */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl -z-10" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-brand rounded-xl">
                <Smartphone className="w-6 h-6 animate-pulse text-teal-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-gray-900 text-sm">
                    Pasang Aplikasi CMS
                  </h4>
                  <button
                    onClick={dismissPrompt}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-50 cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed font-medium">
                  Instal aplikasi langsung di Android / iOS Anda tanpa melalui Play Store. Ringan, cepat, dan mendukung akses offline!
                </p>
                
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-teal-700/25 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install Aplikasi
                  </button>
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                    Cara Manual
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Installation Guide Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-6 relative overflow-hidden"
            >
              {/* Greenish Accent Header */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-teal-600" />

              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-600" />
                  <h3 className="font-display font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    PANDUAN INSTALASI LANGSUNG
                  </h3>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed mb-5">
                Aplikasi ini mendukung teknologi <strong className="text-teal-700">PWA (Progressive Web App)</strong>. Anda dapat memasang aplikasi langsung di Android atau iPhone tanpa perlu Play Store/App Store.
              </p>

              {/* TABS OF GUIDE */}
              <div className="space-y-4">
                {/* FOR ANDROID CHROME */}
                <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/20 p-4 rounded-2xl border border-teal-100/60">
                  <div className="flex items-center gap-2 mb-2 text-teal-950">
                    <Chrome className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] font-black uppercase tracking-wider">CARA INSTAL DI ANDROID (CHROME)</span>
                  </div>
                  <ol className="list-decimal pl-4 text-[10px] text-gray-600 space-y-1.5 font-medium leading-relaxed">
                    <li>Buka menu browser Chrome dengan mengetuk ikon <strong className="text-teal-700">tiga titik vertikal (⋮)</strong> di kanan atas.</li>
                    <li>Cari dan pilih opsi <strong className="text-teal-700">"Instal Aplikasi"</strong> atau <strong className="text-teal-700">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong className="text-teal-700">"Instal"</strong> di dialog konfirmasi yang muncul.</li>
                    <li>Aplikasi CMS akan terpasang langsung di menu handphone Anda seperti aplikasi biasa!</li>
                  </ol>
                </div>

                {/* FOR IPHONE SAFARI */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-800">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-black uppercase tracking-wider">CARA INSTAL DI IPHONE (SAFARI)</span>
                  </div>
                  <ol className="list-decimal pl-4 text-[10px] text-gray-600 space-y-1.5 font-medium leading-relaxed">
                    <li>Pastikan Anda membuka website ini menggunakan browser bawaan <strong className="text-indigo-600">Safari</strong>.</li>
                    <li>Ketuk tombol <strong className="text-indigo-600">Share / Bagikan (kotak dengan panah ke atas)</strong> di bagian bawah layar.</li>
                    <li>Gulir ke bawah lalu ketuk opsi <strong className="text-indigo-600">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong className="text-indigo-600">"Tambah" (Add)</strong> di kanan atas untuk menyelesaikan.</li>
                  </ol>
                </div>
              </div>

              {/* Tips for In-app browser */}
              <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-800 leading-normal font-medium">
                  <strong className="text-amber-900 block uppercase tracking-wide text-[8px] mb-0.5">PENTING: JIKA DIBUKA MELALUI WHATSAPP/INSTAGRAM</strong>
                  Jika Anda membuka tautan dari WhatsApp atau Instagram, ketuk tiga titik di kanan atas layar lalu pilih <strong>"Buka di Chrome"</strong> atau <strong>"Buka di Browser Sistem"</strong> agar fitur PWA dapat bekerja sempurna.
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                {deferredPrompt && (
                  <button
                    onClick={() => {
                      setShowTutorial(false);
                      handleInstallClick();
                    }}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Instal Sekarang
                  </button>
                )}
                <button
                  onClick={() => setShowTutorial(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer"
                >
                  Selesai Membaca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
