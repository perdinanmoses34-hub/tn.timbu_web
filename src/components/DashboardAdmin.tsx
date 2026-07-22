/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Megaphone,
  BookOpen,
  Calendar,
  MessageSquare,
  Activity,
  UserPlus,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { MockDatabase } from '../db/mockDb';
import { ActivityLog, Congregation, Role, ChurchSettings } from '../types';
import { motion } from 'motion/react';

interface DashboardAdminProps {
  setTab: (tab: string) => void;
  currentUser: { id: string; name: string; role: Role };
  settings: ChurchSettings;
}

export default function DashboardAdmin({ setTab, currentUser, settings }: DashboardAdminProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<Congregation[]>([]);
  const [stats, setStats] = useState({
    members: 0,
    announcements: 0,
    news: 0,
    devotions: 0,
    events: 0,
    comments: 0,
    prayers: 0,
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const loadData = () => {
    const allLogs = MockDatabase.getLogs();
    const allMembers = MockDatabase.getCongregations();
    const anns = MockDatabase.getAnnouncements();
    const news = MockDatabase.getNews();
    const devs = MockDatabase.getDevotions();
    const evts = MockDatabase.getEvents();
    const comms = MockDatabase.getComments();
    const prayers = MockDatabase.getPrayerRequests();

    setLogs(allLogs.slice(0, 5)); // show latest 5
    setMembers(allMembers);
    setStats({
      members: allMembers.length,
      announcements: anns.length,
      news: news.length,
      devotions: devs.length,
      events: evts.length,
      comments: comms.length,
      prayers: prayers.length,
    });
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);

    // Simulate real-time network request delay of 1.2 seconds
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
      setRefreshSuccess(true);

      // Dismiss the success message after 3 seconds
      setTimeout(() => {
        setRefreshSuccess(false);
      }, 3000);
    }, 1200);
  };

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds silently
    const timer = setInterval(loadData, 10000);
    
    const handleDbUpdate = () => {
      loadData();
    };
    window.addEventListener('church_db_updated', handleDbUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('church_db_updated', handleDbUpdate);
    };
  }, []);

  // Custom Chart Data: Member growth dynamically scaled to stats.members
  const currentCount = stats.members;
  const growthData = [
    { month: 'Jan', count: Math.max(1, Math.floor(currentCount * 0.3)) },
    { month: 'Feb', count: Math.max(1, Math.floor(currentCount * 0.45)) },
    { month: 'Mar', count: Math.max(1, Math.floor(currentCount * 0.6)) },
    { month: 'Apr', count: Math.max(1, Math.floor(currentCount * 0.75)) },
    { month: 'May', count: Math.max(1, Math.floor(currentCount * 0.85)) },
    { month: 'Jun', count: Math.max(1, Math.floor(currentCount * 0.95)) },
    { month: 'Jul', count: currentCount },
  ];

  // Custom Chart Data: Activity (Sun, Mon, Tue, etc.)
  const activityData = [
    { day: 'Min', val: 95 },
    { day: 'Sen', val: 40 },
    { day: 'Sel', val: 30 },
    { day: 'Rab', val: 45 },
    { day: 'Kam', val: 50 },
    { day: 'Jum', val: 65 },
    { day: 'Sab', val: 80 },
  ];

  const maxGrowth = Math.max(...growthData.map(d => d.count));
  const maxActivity = Math.max(...activityData.map(d => d.val));

  return (
    <div className="bg-[#070B14] p-6 -mx-6 md:-mx-8 -my-6 md:-my-8 min-h-screen text-slate-100 space-y-8 animate-fade-in">
      {/* Real-time Refresh Success Notification */}
      {refreshSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          Data sinkronisasi real-time berhasil diperbarui!
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#F59E0B] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-blue-500/10 min-h-[180px] flex items-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
              Portal Admin {settings.churchName || 'SYSTEM MANAGEMENT CHURCH (CMS)'}
            </span>
            <h2 className="font-display font-black text-2xl md:text-3xl mt-2.5 tracking-tight text-white drop-shadow-sm">
              {settings.adminWelcomeText || `Selamat Datang, ${currentUser.name}!`}
            </h2>
            <p className="text-xs text-slate-100/90 mt-1 max-w-xl leading-relaxed font-medium">
              {settings.adminSubText || 'Sistem Informasi Manajemen dan Pelayanan CMS. Kelola berita, kustomisasi donasi, moderation komentar, and kelola jajaran organisasi secara instan.'}
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="self-start md:self-auto px-4 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 disabled:bg-slate-100 font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-80"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            {isRefreshing ? 'Menyinkronkan...' : 'Refresh Real-time'}
          </button>
        </div>
      </div>

      {/* MOBILE & DESKTOP ADMIN MODULE SELECTOR BAR */}
      <div className="bg-[#0F172A] text-white p-3.5 sm:p-4 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl text-xs font-black">
              ⚙️
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                Pilih Panel Pengaturan & Modul Admin
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Geser ke samping & tap untuk langsung menuju panel yang diinginkan
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {[
            { id: 'admin_dashboard', label: '📊 Dashboard Admin' },
            { id: 'admin_settings', label: '⚙️ Pengaturan Sistem' },
            { id: 'admin_users', label: '🔑 Kelola Akun & Sandi' },
            { id: 'admin_congregation', label: '👥 Data Jemaat' },
            { id: 'admin_news', label: '📰 Kelola Berita' },
            { id: 'admin_announcements', label: '📣 Kelola Pengumuman' },
            { id: 'admin_events', label: '📅 Event & Ibadah' },
            { id: 'admin_devotions', label: '📖 Renungan' },
            { id: 'admin_ministries', label: '🤝 Kelola Pelayanan' },
            { id: 'admin_organizations', label: '🏢 Organisasi' },
            { id: 'admin_gallery', label: '🖼️ Kelola Galeri' },
            { id: 'admin_notifications', label: '🔔 Kirim Notifikasi' },
            { id: 'admin_comments', label: '💬 Moderasi Komentar' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setTab(m.id)}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer hover:border-amber-500/50"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jemaat */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Total Jemaat</p>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-white mt-2">{stats.members}</p>
          <span className="bg-blue-500/15 text-blue-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-blue-500/20 mt-3">
            {stats.members} Jiwa Terdaftar
          </span>
        </div>

        {/* Pelayanan */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Jadwal Pelayanan</p>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-white mt-2">{stats.events}</p>
          <span className="bg-purple-500/15 text-purple-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-purple-500/20 mt-3">
            Event Terjadwal
          </span>
        </div>

        {/* Pengumuman & Berita */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Warta & Berita</p>
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-white mt-2">{stats.announcements + stats.news}</p>
          <span className="bg-yellow-500/15 text-yellow-500 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-yellow-500/20 mt-3">
            Warta Aktif
          </span>
        </div>

        {/* Komentar & Doa */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Permohonan Doa</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-white mt-2">{stats.prayers}</p>
          <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-emerald-500/20 mt-3">
            Syafaat Masuk
          </span>
        </div>
      </div>

      {/* Dashboard Charts & Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Member growth */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-white text-sm">
                Grafik Pertumbuhan Jemaat
              </h3>
              <p className="text-[11px] text-slate-400">Satu semester terakhir (2026)</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Akumulatif
            </span>
          </div>

          {/* SVG Custom Line Chart */}
          <div className="h-44 w-full flex items-end justify-between pt-6 px-2 border-b border-slate-800">
            {growthData.map((d) => {
              const heightPct = (d.count / maxGrowth) * 100;
              return (
                <div key={d.month} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex flex-col items-center">
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {d.count} Jiwa
                    </div>
                    {/* Visual Bar segment */}
                    <div
                      style={{ height: `${heightPct * 0.8}px` }}
                      className="w-2.5 bg-indigo-500/10 group-hover:bg-indigo-500/25 rounded-t-md transition-all relative flex justify-center items-end"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-400 border border-slate-950 shadow-sm" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">{d.month}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Angka menunjukkan jumlah jemaat terdaftar secara resmi di database.</span>
          </div>
        </div>

        {/* Chart 2: Worship attendance / App engagement */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-white text-sm">
                Aktivitas Pengguna Harian
              </h3>
              <p className="text-[11px] text-slate-400">Persentase engagement per hari</p>
            </div>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="h-44 w-full flex items-end justify-between pt-6 border-b border-slate-800">
            {activityData.map((d) => {
              const heightPct = (d.val / maxActivity) * 100;
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 group">
                  <div className="w-6 relative flex flex-col items-center justify-end h-full">
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {d.val}%
                    </div>
                    {/* Custom bar */}
                    <div
                      style={{ height: `${heightPct * 0.8}%` }}
                      className="w-3 bg-gradient-to-t from-blue-500 to-indigo-600 rounded-t-full transition-all group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>Rata-rata: 57.1%</span>
            <span>Puncak: Hari Minggu</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-display font-black text-white text-sm">
            Tindakan Cepat (Quick Actions)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTab('admin_announcements')}
              className="p-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/60 hover:border-indigo-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <Megaphone className="w-5 h-5 text-indigo-400" />
              <p className="text-xs font-bold text-slate-200 mt-2 group-hover:text-indigo-400">Buat Pengumuman</p>
              <span className="text-[9px] text-slate-500">Broadcast jemaat</span>
            </button>

            <button
              onClick={() => setTab('admin_congregation')}
              className="p-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/60 hover:border-purple-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-purple-400" />
              <p className="text-xs font-bold text-slate-200 mt-2 group-hover:text-purple-400">Verifikasi Jemaat</p>
              <span className="text-[9px] text-slate-500">Database Kristen</span>
            </button>

            <button
              onClick={() => setTab('admin_events')}
              className="p-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/60 hover:border-blue-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-blue-400" />
              <p className="text-xs font-bold text-slate-200 mt-2 group-hover:text-blue-400">Buat Event Baru</p>
              <span className="text-[9px] text-slate-500">Jadwal & Presensi</span>
            </button>

            <button
              onClick={() => setTab('admin_notifications')}
              className="p-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/60 hover:border-emerald-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <Bell className="w-5 h-5 text-emerald-400" />
              <p className="text-xs font-bold text-slate-200 mt-2 group-hover:text-emerald-400">Kirim Notifikasi</p>
              <span className="text-[9px] text-slate-500">Layanan FCM Push</span>
            </button>
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-400"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> FCM Services</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online & Siap
            </span>
          </div>
        </div>
      </div>

      {/* Audit Logs / Monitoring */}
      <div className="bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-white text-sm">
              Log Aktivitas Sistem (Audit Trail)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Pemantauan real-time aktivitas pengurus</p>
          </div>
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 5 Terbaru
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Tidak ada log aktivitas terdeteksi.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-900/40 hover:bg-slate-900/75 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300">
                      <strong className="font-bold text-slate-100">{log.userName}</strong>{' '}
                      <span className="text-slate-400">melakukan aksi</span>{' '}
                      <code className="px-1.5 py-0.5 bg-indigo-950 text-[10px] rounded font-mono text-indigo-400 font-bold uppercase border border-indigo-900/50">
                        {log.action}
                      </code>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                      <span className="font-medium bg-slate-900/60 px-1 py-0.25 rounded text-slate-400">
                        {log.device} ({log.browser})
                      </span>
                      <span>•</span>
                      <span>{new Date(log.date).toLocaleTimeString('id-ID')}</span>
                    </div>
                    
                    {log.afterData && (
                      <p className="text-[10px] text-slate-500 bg-indigo-950/20 p-1 rounded border border-indigo-950 mt-1 truncate max-w-md">
                        Data: {log.afterData}
                      </p>
                    )}
                  </div>
                </div>

                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 flex-shrink-0">
                  SUKSES
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
