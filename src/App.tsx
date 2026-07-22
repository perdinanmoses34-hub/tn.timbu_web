/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Church,
  Shield,
  Menu,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Smartphone,
  Lock,
  LogOut,
  Info,
  CheckCircle2,
  Users,
  Briefcase,
  LogIn,
  Award,
  Coins,
  Heart,
  Image as ImageIcon,
  User,
  X,
  Settings,
  Key,
  FileText,
  Megaphone,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { MockDatabase } from './db/mockDb';
import { Role, User as UserType, ChurchSettings } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardJemaat from './components/DashboardJemaat';
import AdminModules from './components/AdminModules';
import InstallPrompt from './components/InstallPrompt';
import PwaInstallAndSplash from './components/PwaInstallAndSplash';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Load initial settings and users
  const [settings, setSettings] = useState<ChurchSettings>(MockDatabase.getSettings());
  const [allUsers, setAllUsers] = useState<UserType[]>(MockDatabase.getUsers());
  
  // Current user state (attempt to restore from localStorage, fallback to Andi Wijaya (Jemaat))
  const [currentUser, setCurrentUser] = useState<UserType>(() => {
    try {
      const storedUserId = localStorage.getItem('church_cms_user_id');
      if (storedUserId) {
        const users = MockDatabase.getUsers();
        const found = users.find(u => u.id === storedUserId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    const users = MockDatabase.getUsers();
    return users[2] || { id: 'jemaat-1', name: 'Andi Wijaya', email: 'jemaat@church.com', role: 'JEMAAT', avatarUrl: '' };
  });
  
  // Tab Routing State (attempt to restore from localStorage)
  const [currentTab, setTab] = useState<string>(() => {
    try {
      const storedTab = localStorage.getItem('church_cms_current_tab');
      if (storedTab) return storedTab;
    } catch {}
    return 'jemaat_home';
  });
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('church_cms_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  
  // Login Lockscreen Simulation (attempt to restore active session)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const hasSession = localStorage.getItem('church_cms_session_active');
      return hasSession !== 'true';
    } catch {
      return true;
    }
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<'JEMAAT' | 'PELAYAN'>('JEMAAT');

  // Mobile drawer state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Sync state changes back to localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('church_cms_user_id', currentUser.id);
      } catch (err) {
        console.error('Failed to save user id to localStorage:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentTab) {
      try {
        localStorage.setItem('church_cms_current_tab', currentTab);
      } catch (err) {
        console.error('Failed to save current tab to localStorage:', err);
      }
    }
  }, [currentTab]);

  useEffect(() => {
    try {
      localStorage.setItem('church_cms_session_active', isLocked ? 'false' : 'true');
    } catch (err) {
      console.error('Failed to save session state to localStorage:', err);
    }
  }, [isLocked]);

  useEffect(() => {
    try {
      localStorage.setItem('church_cms_dark_mode', darkMode ? 'true' : 'false');
    } catch (err) {
      console.error('Failed to save dark mode to localStorage:', err);
    }
  }, [darkMode]);

  // Background Database Load and Sync Hook
  useEffect(() => {
    // Register callback to update React state when db changes
    MockDatabase.registerSyncCallback(() => {
      setSettings(MockDatabase.getSettings());
      const updatedUsers = MockDatabase.getUsers();
      setAllUsers(updatedUsers);
      if (currentUser) {
        const freshUser = updatedUsers.find(u => u.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    });

    // Load database state from Express server on mount
    MockDatabase.loadFromServer().then(() => {
      setSettings(MockDatabase.getSettings());
      setAllUsers(MockDatabase.getUsers());
    });

    // Polling sync every 10 seconds to keep devices perfectly in sync
    const interval = setInterval(() => {
      MockDatabase.loadFromServer();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Apply Dynamic Primary Color to the DOM
  useEffect(() => {
    if (settings && settings.primaryColor) {
      document.documentElement.style.setProperty('--church-primary', settings.primaryColor);
      // Generate some basic light/dark variations
      document.documentElement.style.setProperty('--church-primary-light', `${settings.primaryColor}15`);
      document.documentElement.style.setProperty('--church-primary-dark', `${settings.primaryColor}dd`);
    }
  }, [settings]);

  // Request native notifications access for FCM simulation on start
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Quick Account Role Swapper
  const handleRoleSwap = (role: Role) => {
    const matchedUser = allUsers.find((u) => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      // Auto routing based on swapped role
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        setTab('admin_dashboard');
      } else {
        setTab('jemaat_home');
      }
      
      // Log role swap activity in system
      MockDatabase.addLog(
        { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role },
        'SWAP_SESSION_ROLE',
        undefined,
        `Sesi dialihkan ke peran ${role}`
      );
    }
  };

  const handleUserUpdate = (updated: UserType) => {
    // 1. Update in allUsers list
    const updatedUsers = allUsers.map((u) => (u.id === updated.id ? updated : u));
    setAllUsers(updatedUsers);
    // 2. Update currentUser state
    setCurrentUser(updated);
  };

  // Simulated Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    // Fetch fresh user list from MockDatabase (which auto-heals default users)
    const freshUsers = MockDatabase.getUsers();
    setAllUsers(freshUsers);

    const matched = freshUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matched) {
      const correctPassword = (matched.password || 'church123').trim();
      if (cleanPassword === correctPassword) {
        setCurrentUser(matched);
        setIsLocked(false);
        if (matched.role === 'SUPER_ADMIN' || matched.role === 'ADMIN') {
          setTab('admin_dashboard');
        } else {
          setTab('jemaat_home');
        }
        MockDatabase.addLog(matched, 'LOGIN');
      } else {
        alert('Kata sandi salah! Silakan periksa kembali atau gunakan tombol "GUNAKAN" pada akun demo di bawah.');
      }
    } else {
      // Fallback auto-recovery check for default emails
      if (cleanEmail === 'admin@church.com' || cleanEmail === 'superadmin@church.com' || cleanEmail === 'jemaat@church.com') {
        MockDatabase.loadFromServer().then(() => {
          const reloadedUsers = MockDatabase.getUsers();
          setAllUsers(reloadedUsers);
          const retryMatched = reloadedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
          if (retryMatched && (cleanPassword === (retryMatched.password || 'church123').trim())) {
            setCurrentUser(retryMatched);
            setIsLocked(false);
            setTab((retryMatched.role === 'SUPER_ADMIN' || retryMatched.role === 'ADMIN') ? 'admin_dashboard' : 'jemaat_home');
            MockDatabase.addLog(retryMatched, 'LOGIN');
            return;
          }
        });
      }
      alert(`Alamat email "${loginEmail}" belum terdaftar. Silakan gunakan akun demo yang tersedia di bawah ini.`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Floating Install Prompt Banner */}
      <InstallPrompt />

      <AnimatePresence>
        {isLocked ? (
          /* Simulated Secure Login Screen - Beautifully Stacked Vertical Layout */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#070913] text-white font-sans overflow-y-auto"
          >
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
              <div className="w-full max-w-xl bg-[#0B0F19] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col">
                
                {/* TOP PORTION: PORTAL BRAND & INFO */}
                <div className="relative p-8 sm:p-10 bg-gradient-to-br from-[#1E2153] via-[#101438] to-[#0A0D29] overflow-hidden border-b border-slate-800/60 flex flex-col">
                  {/* Glowing Ambient Orbs */}
                  <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/15 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />
                  
                  {/* Brand Header */}
                  <div className="relative z-10 flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-lg border border-white/10 overflow-hidden">
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h1 className="font-display font-black text-white text-base tracking-wider uppercase leading-none">
                        {settings.churchName}
                      </h1>
                      <p className="text-[10px] text-indigo-300 font-extrabold tracking-widest mt-1.5 uppercase">
                        PORTAL JEMAAT & PELAYAN
                      </p>
                    </div>
                  </div>

                  {/* Slogan Content */}
                  <div className="relative z-10 space-y-4 mt-8">
                    <div className="bg-[#EAB308]/15 text-[#FACC15] text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full w-fit uppercase border border-[#FACC15]/20 shadow-sm">
                      SELAMAT DATANG
                    </div>
                    
                    <h2 className="text-2xl sm:text-3.5xl font-black text-white leading-tight uppercase tracking-tight">
                      SATU PORTAL UNTUK<br />
                      SELURUH JEMAAT & PELAYAN GEREJA.
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      Akses informasi ibadah raya, video khotbah, warta jemaat terbaru, daftar doa, pendaftaran RSVP acara, dan kas/donasi secara aman dan mudah.
                    </p>
                  </div>
                </div>

                {/* BOTTOM PORTION: LOG IN FORM */}
                <div className="p-8 sm:p-10 bg-[#0B0F19] w-full relative">
                  <div className="space-y-6">
                    {/* Heading */}
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white tracking-tight">
                        PORTAL LOG IN
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Silakan pilih peran login Anda untuk melanjutkan.
                      </p>
                    </div>

                    {/* Role Switcher Container */}
                    <div className="border border-slate-800/80 rounded-xl p-1 bg-[#090D16] flex shadow-inner">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoleGroup('JEMAAT');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedRoleGroup === 'JEMAAT'
                            ? 'bg-[#1E293B] text-indigo-400 border border-slate-700/80 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4 text-indigo-400" />
                        JEMAAT (MEMBER)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoleGroup('PELAYAN');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedRoleGroup === 'PELAYAN'
                            ? 'bg-[#1E293B] text-indigo-400 border border-slate-700/80 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        PELAYAN (ADMIN/STAFF)
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {selectedRoleGroup === 'JEMAAT' ? 'USERNAME JEMAAT *' : 'USERNAME PELAYAN *'}
                        </label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder={selectedRoleGroup === 'JEMAAT' ? 'Contoh: jemaat@church.com' : 'Contoh: admin@church.com'}
                          className="w-full p-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:bg-[#0F172A] focus:ring-4 focus:ring-indigo-950/50 rounded-xl text-xs text-white placeholder-slate-500 font-medium transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            SANDI / PASSWORD *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "mailto:tn.timbu@gmail.com?subject=Permohonan%20Atur%20Ulang%20Sandi%20Portal%20Gereja&body=Syalom%20Admin,%20saya%20lupa%20kata%20sandi%20login%20saya.%20Tolong%20bantu%20untuk%20mengecek%20atau%20mengatur%20ulang%20sandi%20saya.%250D%250ANama:%250D%250AEmail%20Login:";
                            }}
                            className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            LUPA PASSWORD?
                          </button>
                        </div>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:bg-[#0F172A] focus:ring-4 focus:ring-indigo-950/50 rounded-xl text-xs text-white placeholder-slate-500 font-medium transition-all outline-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 bg-[#1D4ED8] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        MASUK KE DASHBOARD
                      </button>
                    </form>

                    {/* Standard Credentials & System Recovery Helper */}
                    <div className="mt-6 border-t border-slate-800/60 pt-4 space-y-3">
                      <p className="text-[10px] text-amber-500/90 font-bold tracking-wide text-center leading-relaxed">
                        * SANDI BAWAAN SISTEM: <span className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400 text-[10px] select-all font-black">church123</span>
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Atur ulang seluruh akun login (Superadmin, Admin, Jemaat) ke kata sandi standar "church123"?')) {
                            localStorage.removeItem('church_cms_users');
                            MockDatabase.loadFromServer().then(() => {
                              setAllUsers(MockDatabase.getUsers());
                              alert('Berhasil mengatur ulang akun login ke standar! Silakan login kembali.');
                            });
                          }
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        🔄 RESET AKUN LOGIN KE STANDAR
                      </button>
                    </div>
                  </div>
                </div>

                {/* Windows Activation parody watermark perfectly matching the image */}
                <div className="absolute bottom-6 right-6 text-right pointer-events-none opacity-20 select-none hidden sm:block">
                  <p className="text-xs text-slate-400 font-light">Activate Windows</p>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">Go to Settings to activate Windows.</p>
                </div>

              </div>

              {/* Secure copyright info */}
              <div className="mt-6 text-center text-[10px] text-slate-500">
                © 2026 App. tn.timbu. Hak cipta dilindungi.
              </div>
            </div>
          </motion.div>
        ) : (
          /* Main App Framework */
          <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
            
            {/* Desktop Layout Sidebar */}
            <Sidebar
              currentTab={currentTab}
              setTab={setTab}
              currentUser={currentUser}
              switchUser={handleRoleSwap}
              allUsers={allUsers}
              settings={settings}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onLogout={() => {
                setIsLocked(true);
                MockDatabase.addLog(currentUser, 'LOGOUT');
              }}
            />

            {/* Main scrollable body container */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              
              {/* RESPONSIVE MOBILE HEADER */}
              <header className="lg:hidden h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center overflow-hidden ring-1 ring-indigo-500/30">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Church className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-xs truncate max-w-[160px] leading-tight">
                      {settings.churchName}
                    </h2>
                    <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">Portal Jemaat</span>
                  </div>
                </div>

                {/* Mobile upper action bar */}
                <div className="flex items-center gap-2">
                  {/* Mobile Logout Button */}
                  <button
                    onClick={() => {
                      setIsLocked(true);
                      MockDatabase.addLog(currentUser, 'LOGOUT');
                    }}
                    className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-rose-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </header>

              {/* MAIN SCROLLABLE CONTENT BODY */}
              <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
                
                {/* ADMIN SECTIONS */}
                {currentTab === 'admin_dashboard' && (
                  <DashboardAdmin setTab={setTab} currentUser={currentUser} settings={settings} />
                )}

                {currentTab.startsWith('admin_') && currentTab !== 'admin_dashboard' && (
                  <AdminModules
                    activeTab={currentTab}
                    setTab={setTab}
                    currentUser={currentUser}
                    settings={settings}
                    onSettingsSaved={(updated) => setSettings(updated)}
                  />
                )}

                {/* JEMAAT PUBLIC SECTIONS */}
                {currentTab.startsWith('jemaat_') && (
                  <DashboardJemaat
                    currentSubSection={currentTab.replace('jemaat_', '')}
                    setTab={setTab}
                    currentUser={currentUser}
                    settings={settings}
                    onUserUpdate={handleUserUpdate}
                    onLogout={() => {
                      setIsLocked(true);
                      MockDatabase.addLog(currentUser, 'LOGOUT');
                    }}
                  />
                )}

              </main>

              {/* RESPONSIVE MOBILE BOTTOM NAV BAR */}
              <BottomNav
                currentTab={currentTab}
                setTab={setTab}
                userRole={currentUser.role}
                openAdminMenu={() => setShowMobileMenu(true)}
              />

              {/* Menu Lain / Mobile Bottom Sheet Drawer */}
              <AnimatePresence>
                {showMobileMenu && (
                  <>
                    {/* Overlay Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMobileMenu(false)}
                      className="lg:hidden fixed inset-0 bg-black z-40"
                    />

                    {/* Bottom Sheet Body */}
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                      className="lg:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-3xl border-t border-gray-150 z-50 p-6 space-y-6 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl"
                    >
                      {/* Drawer Drag Indicator Bar */}
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto cursor-pointer" onClick={() => setShowMobileMenu(false)} />

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-black text-gray-800 text-sm">
                            {currentUser.role !== 'JEMAAT' ? 'Menu & Panel Pengaturan Admin' : 'Menu Layanan Jemaat'}
                          </h3>
                          <p className="text-[10px] text-gray-400">
                            {currentUser.role !== 'JEMAAT' ? 'Pilih panel pengurus atau modul jemaat' : 'Pilih modul layanan yang ingin Anda akses.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowMobileMenu(false)}
                          className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* ADMIN MODULES SECTION IF ADMIN */}
                      {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-[10px] uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60">
                            <Settings className="w-3.5 h-3.5 text-amber-600" />
                            <span>MODUL PENGATURAN & ADMIN STAFF</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            {[
                              { id: 'admin_settings', label: 'Pengaturan Sistem', desc: 'Identitas, QRIS & Bank', icon: Settings, color: 'text-amber-700 bg-amber-50' },
                              { id: 'admin_users', label: 'Kelola Akun & Sandi', desc: 'Atur password & peran', icon: Key, color: 'text-purple-700 bg-purple-50' },
                              { id: 'admin_congregation', label: 'Data Jemaat', desc: 'Kelola database anggota', icon: Users, color: 'text-blue-700 bg-blue-50' },
                              { id: 'admin_news', label: 'Kelola Berita', desc: 'Warta & kabar warta', icon: FileText, color: 'text-emerald-700 bg-emerald-50' },
                              { id: 'admin_announcements', label: 'Pengumuman', desc: 'Info penting & prioritas', icon: Megaphone, color: 'text-rose-700 bg-rose-50' },
                              { id: 'admin_events', label: 'Event & Ibadah', desc: 'Jadwal & rsvp peserta', icon: Calendar, color: 'text-indigo-700 bg-indigo-50' },
                            ].map((m) => {
                              const Icon = m.icon;
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    setTab(m.id);
                                    setShowMobileMenu(false);
                                  }}
                                  className="flex items-center gap-2.5 p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-all text-left cursor-pointer group"
                                >
                                  <div className={`p-2 rounded-lg flex-shrink-0 ${m.color}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-100 text-[11px] truncate">{m.label}</p>
                                    <span className="text-[9px] text-slate-400 block truncate">{m.desc}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Grid of Jemaat Menus */}
                      <div className="space-y-2.5">
                        {currentUser.role !== 'JEMAAT' && (
                          <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/60">
                            <Church className="w-3.5 h-3.5 text-indigo-600" />
                            <span>PORTAL MODUL JEMAAT</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {[
                            { id: 'jemaat_events', label: 'Event Gereja', desc: 'Daftar kegiatan & seminar', icon: Award, color: 'text-indigo-650 bg-indigo-50' },
                            { id: 'jemaat_donasi', label: 'Kas/Donasi', desc: 'Laporan keuangan & QRIS', icon: Coins, color: 'text-amber-600 bg-amber-50' },
                            { id: 'jemaat_ministries', label: 'Pelayanan Jemaat', desc: 'Gabung komisi melayani', icon: Heart, color: 'text-rose-600 bg-rose-50' },
                            { id: 'jemaat_organization', label: 'Struktur Pengurus', desc: 'Struktur majelis & visi', icon: Users, color: 'text-teal-600 bg-teal-50' },
                            { id: 'jemaat_gallery', label: 'Galeri Media', desc: 'Dokumentasi foto kegiatan', icon: ImageIcon, color: 'text-sky-650 bg-sky-50' },
                            { id: 'jemaat_profile', label: 'Profil Saya', desc: 'Kartu digital & detail', icon: User, color: 'text-slate-650 bg-slate-100' },
                          ].map((menuItem) => {
                            const Icon = menuItem.icon;
                            return (
                              <button
                                key={menuItem.id}
                                onClick={() => {
                                  setTab(menuItem.id);
                                  setShowMobileMenu(false);
                                }}
                                className="flex flex-col items-start p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-150 transition-all text-left space-y-2 cursor-pointer group"
                              >
                                <div className={`p-2.5 rounded-xl transition-all group-hover:scale-105 ${menuItem.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-bold text-gray-800 leading-none text-xs">{menuItem.label}</p>
                                  <span className="text-[9px] text-gray-450 block leading-tight">{menuItem.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick actions line */}
                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-mono">Status: Terkoneksi (PWA Live)</span>
                        <button
                          onClick={() => {
                            setShowMobileMenu(false);
                            setIsLocked(true);
                            MockDatabase.addLog(currentUser, 'LOGOUT');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 font-extrabold text-xs rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Keluar Aplikasi
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </div>
          </div>
        )}
      </AnimatePresence>
      {/* PWA Animated Loading Splash Screen & Professional Installation Prompt */}
      <PwaInstallAndSplash churchName={settings.churchName} logoUrl={settings.logoUrl} />
    </div>
  );
}
