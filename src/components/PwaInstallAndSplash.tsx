import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, CheckCircle2, X, Share, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface PwaInstallAndSplashProps {
  churchName?: string;
  logoUrl?: string;
}

export default function PwaInstallAndSplash({ churchName = 'SYSTEM MANAGEMENT CHURCH (CMS)', logoUrl }: PwaInstallAndSplashProps) {
  // Splash Screen States
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(10);

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in PWA standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Animated Splash Progress Effect
    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowSplash(false), 400); // smooth hide
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 150);

    // Listen for PWA Install Prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user hasn't dismissed install banner recently
      const lastDismiss = localStorage.getItem('pwa_install_dismissed');
      if (!lastDismiss || Date.now() - Number(lastDismiss) > 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if iOS device
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isStandaloneMode) {
      const lastDismiss = localStorage.getItem('pwa_install_dismissed');
      if (!lastDismiss || Date.now() - Number(lastDismiss) > 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
        setShowInstallBanner(false);
        setShowInstallModal(false);
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      setIsInstalling(false);
      setDeferredPrompt(null);
    } else {
      // Show iOS guide if deferredPrompt is not available or on iOS
      setShowIosGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', String(Date.now()));
  };

  return (
    <>
      {/* 1. ANIMATED PROFESSIONAL LOADING SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[99999] bg-[#0F172A] text-white flex flex-col items-center justify-between p-6 select-none overflow-hidden"
          >
            {/* Background Glow Effect */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div />

            {/* Center Animated Logo & Branding */}
            <div className="flex flex-col items-center text-center space-y-6 relative z-10 max-w-sm px-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0F172A] rounded-[22px] flex items-center justify-center p-3 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl sm:text-5xl">⛪</span>
                    )}
                  </div>
                </div>
                {/* Ping aura */}
                <div className="absolute -inset-2 rounded-3xl bg-amber-400/20 animate-ping pointer-events-none -z-10" />
              </motion.div>

              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-100 bg-clip-text text-transparent uppercase">
                  SYSTEM MANAGEMENT CHURCH (CMS)
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
                  {churchName && churchName !== 'SYSTEM MANAGEMENT CHURCH (CMS)' ? churchName : 'Aplikasi Pelayanan & Manajemen Jemaat'}
                </p>
              </div>

              {/* Progress Bar with animated status */}
              <div className="w-full space-y-2 pt-4">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    style={{ width: `${splashProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                    Memuat Sistem & Data...
                  </span>
                  <span className="font-bold text-amber-400">{splashProgress}%</span>
                </div>
              </div>
            </div>

            {/* Footer Tagline */}
            <div className="text-center space-y-1 relative z-10">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Sistem Gereja Digital PWA • Fullscreen Standalone
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING PWA INSTALL PROMPT BANNER (FOR HP / MOBILE) */}
      <AnimatePresence>
        {showInstallBanner && !isStandalone && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[80] bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl border border-slate-700/80 shadow-2xl space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 flex-shrink-0 shadow-lg">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl">
                    📱
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-white">Instal Aplikasi Ke HP Anda</h4>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase border border-amber-500/30">
                      PWA Native
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                    Gunakan tanpa lewat Play Store. Tampilan fullscreen tanpa space bar browser & notifikasi langsung!
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Memasang Aplikasi...' : '⚡ Instal Sekarang'}</span>
              </button>
              <button
                onClick={() => setShowInstallModal(true)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all cursor-pointer"
              >
                Info
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PWA INSTALLATION DETAIL MODAL */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl text-2xl">
                  📲
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">Instal Aplikasi CMS Gereja</h3>
                  <p className="text-xs text-slate-400">Aplikasi Web Resmi (PWA Standalone)</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block font-bold">Tanpa Harus Lewat Play Store</strong>
                    <span className="text-slate-400 text-[11px]">Dapat langsung terpasang ke HP Android / iPhone Anda dalam hitungan detik.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block font-bold">Tampilan Fullscreen Profesional</strong>
                    <span className="text-slate-400 text-[11px]">Bebas dari space bar atau URL browser, berjalan persis seperti aplikasi bawaan HP.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block font-bold">Notifikasi Bar HP Real-time</strong>
                    <span className="text-slate-400 text-[11px]">Pengumuman & warta gereja langsung muncul di bar pemberitahuan atas ponsel Anda.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Proses Memasang...' : 'Pasang Sekarang Ke HP'}</span>
                </button>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. IOS SAFARI INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl text-2xl">
                  📱
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">Cara Instal Di iPhone / iPad (iOS)</h3>
                  <p className="text-xs text-slate-400">Gunakan browser Safari</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0">1</span>
                  <p>Tap tombol <strong>Share 📤</strong> di bagian bawah layar Safari Anda.</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0">2</span>
                  <p>Geser menu ke bawah lalu pilih <strong>'Tambah ke Layar Utama' (Add to Home Screen)</strong>.</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0">3</span>
                  <p>Tap <strong>'Tambah' (Add)</strong> di pojok kanan atas. Selesai!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition-all cursor-pointer mt-2"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
