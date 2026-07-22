/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Church,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Image,
  Award,
  ShieldCheck,
  Bell,
  Settings,
  MessageSquare,
  Database,
  UserCheck,
  TrendingUp,
  FileText,
  Megaphone,
  LogOut,
  Moon,
  Sun,
  User,
  Coins,
} from 'lucide-react';
import { Role, User as UserType, ChurchSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  currentUser: UserType;
  switchUser: (role: Role) => void;
  allUsers: UserType[];
  settings: ChurchSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  currentTab,
  setTab,
  currentUser,
  switchUser,
  allUsers,
  settings,
  darkMode,
  setDarkMode,
  onLogout,
}: SidebarProps) {
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ADMIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Jemaat';
    }
  };

  // Load customized menus from localStorage or use defaults
  const [customMenus, setCustomMenus] = useState(() => {
    try {
      const stored = localStorage.getItem('church_custom_menus');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => {
            if (item.id === 'admin_settings' || item.id === 'admin_dashboard') {
              return { ...item, visible: true };
            }
            return item;
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'admin_dashboard', label: 'Dashboard Admin', visible: true },
      { id: 'admin_news', label: 'Kelola Berita', visible: true },
      { id: 'admin_announcements', label: 'Kelola Pengumuman', visible: true },
      { id: 'admin_devotions', label: 'Kelola Renungan', visible: true },
      { id: 'admin_events', label: 'Kelola Event', visible: true },
      { id: 'admin_congregation', label: 'Data Jemaat', visible: true },
      { id: 'admin_users', label: 'Kelola Akun & Sandi', visible: true },
      { id: 'admin_comments', label: 'Moderasi Komentar', visible: true },
      { id: 'admin_notifications', label: 'Kirim Notifikasi', visible: true },
      { id: 'admin_ministries', label: 'Kelola Pelayanan', visible: true },
      { id: 'admin_organizations', label: 'Struktur Organisasi', visible: true },
      { id: 'admin_gallery', label: 'Kelola Galeri', visible: true },
      { id: 'admin_settings', label: 'Pengaturan Sistem', visible: true },
      { id: 'jemaat_home', label: 'Beranda Jemaat', visible: true },
      { id: 'jemaat_schedule', label: 'Jadwal Ibadah', visible: true },
      { id: 'jemaat_devotions', label: 'Renungan Harian', visible: true },
      { id: 'jemaat_events', label: 'Event Gereja', visible: true },
      { id: 'jemaat_donasi', label: 'Kas/Donasi', visible: true },
      { id: 'jemaat_ministries', label: 'Pelayanan Jemaat', visible: true },
      { id: 'jemaat_organization', label: 'Struktur Pengurus', visible: true },
      { id: 'jemaat_gallery', label: 'Galeri Media', visible: true },
      { id: 'jemaat_profile', label: 'Profil Saya', visible: true },
    ];
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('church_custom_menus');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomMenus(parsed.map((item: any) => {
              if (item.id === 'admin_settings' || item.id === 'admin_dashboard') {
                return { ...item, visible: true };
              }
              return item;
            }));
          } else {
            setCustomMenus(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('church_menus_updated', handleUpdate);
    return () => window.removeEventListener('church_menus_updated', handleUpdate);
  }, []);

  // Navigations based on Role
  const baseAdminNav = [
    { id: 'admin_dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
    { id: 'admin_news', label: 'Kelola Berita', icon: FileText },
    { id: 'admin_announcements', label: 'Kelola Pengumuman', icon: Megaphone },
    { id: 'admin_devotions', label: 'Kelola Renungan', icon: BookOpen },
    { id: 'admin_events', label: 'Kelola Event', icon: Calendar },
    { id: 'admin_congregation', label: 'Data Jemaat', icon: Users },
    { id: 'admin_users', label: 'Kelola Akun & Sandi', icon: UserCheck },
    { id: 'admin_comments', label: 'Moderasi Komentar', icon: MessageSquare },
    { id: 'admin_notifications', label: 'Kirim Notifikasi', icon: Bell },
    { id: 'admin_ministries', label: 'Kelola Pelayanan', icon: Award },
    { id: 'admin_organizations', label: 'Struktur Organisasi', icon: ShieldCheck },
    { id: 'admin_gallery', label: 'Kelola Galeri', icon: Image },
    { id: 'admin_settings', label: 'Pengaturan Sistem', icon: Settings },
  ];

  // Map customized label and visibility
  const adminNav = baseAdminNav.map((item) => {
    const custom = customMenus.find((c: any) => c.id === item.id);
    return {
      ...item,
      label: custom ? custom.label : item.label,
      visible: custom ? custom.visible !== false : true,
    };
  }).filter((item) => item.visible);

  const superAdminExtra = [
    { id: 'admin_backup', label: 'Backup & Restore DB', icon: Database },
  ];

  const jemaatNav = [
    { id: 'jemaat_home', label: 'Beranda Jemaat', icon: Church },
    { id: 'jemaat_schedule', label: 'Jadwal Ibadah', icon: Calendar },
    { id: 'jemaat_devotions', label: 'Renungan Harian', icon: BookOpen },
    { id: 'jemaat_events', label: 'Event Gereja', icon: TrendingUp },
    { id: 'jemaat_donasi', label: 'Kas/Donasi', icon: Coins },
    { id: 'jemaat_ministries', label: 'Pelayanan Jemaat', icon: Award },
    { id: 'jemaat_organization', label: 'Struktur Pengurus', icon: Users },
    { id: 'jemaat_gallery', label: 'Galeri Media', icon: Image },
    { id: 'jemaat_profile', label: 'Profil Saya', icon: User },
  ];

  // Map customized label and visibility for Jemaat Nav
  const mappedJemaatNav = jemaatNav.map((item) => {
    const custom = customMenus.find((c: any) => c.id === item.id);
    return {
      ...item,
      label: custom ? custom.label : item.label,
      visible: custom ? custom.visible !== false : true,
    };
  }).filter((item) => item.visible);

  const currentNav =
    currentUser.role === 'SUPER_ADMIN'
      ? [...adminNav, ...superAdminExtra]
      : currentUser.role === 'ADMIN'
      ? adminNav
      : mappedJemaatNav;

  return (
    <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-72 bg-[#0F172A] border-r border-[#1E293B] h-screen sticky top-0 z-20 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center overflow-hidden ring-1 ring-brand/30">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Church className="w-6 h-6 text-indigo-400" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display font-bold text-white text-sm tracking-tight truncate leading-tight">
            {settings.churchName}
          </h1>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
            Church CMS Portal
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 mb-2.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {currentUser.role === 'JEMAAT' ? 'Halaman Publik' : 'Panel Manajemen'}
          </span>
        </div>

        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
                isActive
                  ? 'bg-brand/10 text-white font-semibold ring-1 ring-brand/20 shadow-md shadow-brand/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Divider and switch to Public View for admins */}
        {currentUser.role !== 'JEMAAT' && (
          <div className="pt-4 border-t border-slate-800/60 mt-4 space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Akses Publik
              </span>
            </div>
            <button
              onClick={() => setTab('jemaat_home')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-smooth"
            >
              <Church className="w-4 h-4 text-slate-400" />
              <span>Lihat Halaman Jemaat</span>
            </button>
          </div>
        )}
      </div>

      {/* System Status Block & User Switcher */}
      <div className="p-4 bg-slate-900/40 border-t border-slate-800/80 space-y-3">
        {/* System Status widget from sleek design HTML */}
        <div className="bg-slate-800/40 border border-slate-800/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">System Status</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs font-semibold text-slate-200">Production Ready</p>
          <p className="text-[9px] text-slate-500">{settings.churchName} App Portal</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className="w-full p-2.5 bg-slate-850/80 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-brand/40 transition-smooth shadow-sm flex items-center gap-3 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden border border-slate-700/60 flex-shrink-0">
              <img
                src={currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <span className={`inline-block px-1.5 py-0.25 text-[8px] font-extrabold rounded-full border mt-1 ${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <UserCheck className="w-4 h-4 text-slate-450 flex-shrink-0 hover:text-brand" />
          </button>

          {/* Switcher Dropup list */}
          {showUserSwitcher && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 z-30 animate-fade-in space-y-1">
              <div className="p-1 px-2 mb-1 border-b border-slate-800/80">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Ganti Hak Akses (RBAC)
                </span>
              </div>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.role);
                    setShowUserSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors ${
                    currentUser.role === u.role
                      ? 'bg-brand/10 font-semibold text-white'
                      : 'hover:bg-slate-850 text-slate-350'
                  }`}
                >
                  <img
                    src={u.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                    alt={u.name}
                    className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-none font-medium text-slate-200">{u.name}</p>
                    <span className="text-[9px] text-slate-500">{getRoleLabel(u.role)}</span>
                  </div>
                </button>
              ))}

              <div className="border-t border-slate-800/80 mt-1.5 pt-1.5">
                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                  className="w-full py-2 bg-rose-600/10 hover:bg-rose-650 text-rose-400 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 border border-rose-500/20 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out / Keluar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between mt-1 px-2 text-xs text-slate-500">
          <span className="font-mono text-[9px]">v1.2.0 (PWA Live)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors border border-transparent hover:border-slate-800"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  alert('Keluar dari portal aman. (Simulasi logout)');
                }
              }}
              className="p-1.5 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-slate-800"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
