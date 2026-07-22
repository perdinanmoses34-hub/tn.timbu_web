/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Church,
  Calendar,
  BookOpen,
  Users,
  Image as ImageIcon,
  Award,
  ShieldCheck,
  Bell,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Download,
  Share2,
  MapPin,
  Clock,
  ChevronRight,
  Send,
  AlertTriangle,
  Play,
  Volume2,
  Check,
  User,
  QrCode,
  AlertCircle,
  HelpCircle,
  Coins,
  LogOut,
  Edit,
  Megaphone,
  X,
  Info,
  Trash2,
} from 'lucide-react';
import { MockDatabase } from '../db/mockDb';
import {
  Announcement,
  News,
  Devotion,
  Event,
  EventRegistration,
  Gallery,
  Organization,
  Ministry,
  Comment,
  PrayerRequest,
  ChurchSettings,
  Role,
  User as UserType,
  Notification as ChurchNotificationType,
  ServiceSchedule,
} from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardJemaatProps {
  currentSubSection: string;
  setTab: (tab: string) => void;
  currentUser: UserType;
  settings: ChurchSettings;
  onLogout?: () => void;
  onUserUpdate?: (updatedUser: UserType) => void;
}

export default function DashboardJemaat({
  currentSubSection,
  setTab,
  currentUser,
  settings,
  onLogout,
  onUserUpdate,
}: DashboardJemaatProps) {
  // Navigation tabs inside Jemaat page
  const [activeTab, setActiveTab] = useState(currentSubSection || 'beranda');

  // Profile Edit Modal States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editPhotoUrl, setEditPhotoUrl] = useState(currentUser.photoUrl || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editAddress, setEditAddress] = useState(currentUser.address || '');
  const [editBaptis, setEditBaptis] = useState(currentUser.statusBaptis || 'Belum');
  const [editNikah, setEditNikah] = useState(currentUser.statusPernikahan || 'Belum Menikah');
  const [editKeluarga, setEditKeluarga] = useState(currentUser.keluarga || '');
  const [editPelayanan, setEditPelayanan] = useState(currentUser.pelayanan || '');
  const [editKomisi, setEditKomisi] = useState(currentUser.komisi || 'Umum');

  useEffect(() => {
    setEditName(currentUser.name);
    setEditPhotoUrl(currentUser.photoUrl || '');
    setEditPhone(currentUser.phone || '');
    setEditAddress(currentUser.address || '');
    setEditBaptis(currentUser.statusBaptis || 'Belum');
    setEditNikah(currentUser.statusPernikahan || 'Belum Menikah');
    setEditKeluarga(currentUser.keluarga || '');
    setEditPelayanan(currentUser.pelayanan || '');
    setEditKomisi(currentUser.komisi || 'Umum');
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserType = {
      ...currentUser,
      name: editName,
      photoUrl: editPhotoUrl,
      phone: editPhone,
      address: editAddress,
      statusBaptis: editBaptis as any,
      statusPernikahan: editNikah as any,
      keluarga: editKeluarga,
      pelayanan: editPelayanan,
      komisi: editKomisi as any,
    };
    
    // Save to local MockDatabase
    MockDatabase.saveUser(updatedUser, currentUser);
    
    // Notify parent
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
    
    setIsEditingProfile(false);
    showToast('Profil Anda berhasil diperbarui!', 'success');
  };

  // Loaded states from MockDatabase
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [congregations, setCongregations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [notifications, setNotifications] = useState<ChurchNotificationType[]>([]);
  const [activePopupNotif, setActivePopupNotif] = useState<ChurchNotificationType | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Beautiful Custom Toast system (replaces blocked alert dialogs inside the preview iframe)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Schedule Reminders tracking from localStorage (fixes "Ingatkan Saya" button)
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('church_cms_reminders');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleReminder = (id: string, name: string) => {
    const nextReminders = { ...reminders, [id]: !reminders[id] };
    setReminders(nextReminders);
    try {
      localStorage.setItem('church_cms_reminders', JSON.stringify(nextReminders));
    } catch (e) {
      console.error(e);
    }
    
    if (nextReminders[id]) {
      showToast(`✓ Pengingat diaktifkan! Anda akan diingatkan 30 menit sebelum ${name} dimulai via Push Notification.`, 'success');
    } else {
      showToast(`Pengingat dinonaktifkan untuk ${name}.`, 'info');
    }
  };

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Interactive detail modals
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [selectedDevotion, setSelectedDevotion] = useState<Devotion | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  
  // Audio Player Simulation for Devotionals
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Form Submissions
  const [newPrayer, setNewPrayer] = useState('');
  const [isPrivatePrayer, setIsPrivatePrayer] = useState(false);
  const [prayerPhone, setPrayerPhone] = useState(currentUser.phone || '');
  const [newCommentText, setNewCommentText] = useState('');
  
  // Registration Forms for Events
  const [eventRegPhone, setEventRegPhone] = useState(currentUser.phone || '');
  const [registeredSuccess, setRegisteredSuccess] = useState<EventRegistration | null>(null);

  // Cool Youth Fellowship RSVP state and helper
  const [coolYouthRsvped, setCoolYouthRsvped] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cool_youth_rsvp_status') === 'true';
    } catch {
      return false;
    }
  });

  const handleCoolYouthRsvp = () => {
    if (coolYouthRsvped) {
      setCoolYouthRsvped(false);
      try {
        localStorage.setItem('cool_youth_rsvp_status', 'false');
      } catch (e) {
        console.error(e);
      }
      showToast('RSVP COOL YOUTH FELLOWSHIP berhasil dibatalkan.', 'info');
      return;
    }

    const regId = `reg_coolyouth_${Date.now()}`;
    const newReg: EventRegistration = {
      id: regId,
      eventId: 'cool_youth_fellowship_id',
      eventTitle: 'COOL YOUTH FELLOWSHIP',
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      phone: currentUser.phone || '08123456789',
      registerDate: new Date().toISOString(),
      status: 'approved',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=CMS-REG-${regId}-${currentUser.name.replace(/\s+/g, '')}`,
      attended: false,
    };

    setCoolYouthRsvped(true);
    try {
      localStorage.setItem('cool_youth_rsvp_status', 'true');
    } catch (e) {
      console.error(e);
    }
    setRegisteredSuccess(newReg);
    showToast('Sukses melakukan RSVP untuk COOL YOUTH FELLOWSHIP!', 'success');
  };

  // Dynamic calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Map English/routing tab names from BottomNav/Sidebar to the local Indonesian tab IDs inside DashboardJemaat
  const mapSubSectionToTab = (subSec: string): string => {
    switch (subSec) {
      case 'home':
        return 'beranda';
      case 'schedule':
        return 'jadwal';
      case 'devotions':
        return 'renungan';
      case 'events':
        return 'event';
      case 'donasi':
        return 'donasi';
      case 'ministries':
        return 'pelayanan';
      case 'organization':
        return 'pengurus';
      case 'gallery':
        return 'galeri';
      case 'profile':
        return 'profile';
      default:
        return subSec;
    }
  };

  const mapTabToSubSection = (tabId: string): string => {
    switch (tabId) {
      case 'beranda':
        return 'home';
      case 'jadwal':
        return 'schedule';
      case 'renungan':
        return 'devotions';
      case 'event':
        return 'events';
      case 'donasi':
        return 'donasi';
      case 'pelayanan':
        return 'ministries';
      case 'pengurus':
        return 'organization';
      case 'galeri':
        return 'gallery';
      case 'profile':
        return 'profile';
      default:
        return tabId;
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    if (currentSubSection) {
      setActiveTab(mapSubSectionToTab(currentSubSection));
    }
  }, [currentSubSection]);

  useEffect(() => {
    const handleDbUpdate = () => {
      loadAllData();
    };
    window.addEventListener('church_db_updated', handleDbUpdate);
    return () => {
      window.removeEventListener('church_db_updated', handleDbUpdate);
    };
  }, []);

  const loadAllData = () => {
    setAnnouncements(MockDatabase.getAnnouncements());
    setNews(MockDatabase.getNews());
    setDevotions(MockDatabase.getDevotions());
    setEvents(MockDatabase.getEvents());
    setGallery(MockDatabase.getGallery());
    setOrgs(MockDatabase.getOrganizations());
    setMinistries(MockDatabase.getMinistries());
    setComments(MockDatabase.getComments());
    setPrayers(MockDatabase.getPrayerRequests());
    setRegistrations(MockDatabase.getEventRegistrations());
    setCongregations(MockDatabase.getCongregations());
    setSchedules(MockDatabase.getSchedules());

    const allNotifs = MockDatabase.getNotifications();
    const jemaatNotifs = allNotifs.filter(
      (n) => n.targetGroup === 'all' || n.targetGroup === 'jemaat'
    );
    setNotifications(jemaatNotifs);

    // Check if new notification arrived
    if (jemaatNotifs.length > 0) {
      const latest = jemaatNotifs[0];
      const lastSeenId = localStorage.getItem('last_seen_notif_id');

      if (latest.id !== lastSeenId) {
        localStorage.setItem('last_seen_notif_id', latest.id);

        // A. If app is active in foreground -> show floating card in dashboard
        setActivePopupNotif(latest);

        // B. Always attempt to trigger native status bar notification for mobile devices
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(latest.title, {
                  body: latest.content,
                  icon: 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=192&auto=format&fit=crop&q=80',
                  badge: 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=96&auto=format&fit=crop&q=80',
                  vibrate: [200, 100, 200],
                  tag: latest.id,
                } as any);
              });
            } else {
              new Notification(latest.title, {
                body: latest.content,
                icon: 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=192&auto=format&fit=crop&q=80',
              });
            }
          } catch (err) {
            console.warn('Native notification trigger error:', err);
          }
        }
      }
    }
  };

  // Event registration logic
  const handleEventRegister = (event: Event) => {
    if (event.registeredCount >= event.quota) {
      showToast('Maaf, kuota pendaftaran event ini sudah penuh.', 'error');
      return;
    }
    
    const isAlreadyReg = registrations.some(r => r.eventId === event.id && r.userId === currentUser.id);
    if (isAlreadyReg) {
      showToast('Anda sudah terdaftar dalam event ini.', 'info');
      return;
    }

    const regId = `reg_${Date.now()}`;
    const newReg: EventRegistration = {
      id: regId,
      eventId: event.id,
      eventTitle: event.title,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      phone: eventRegPhone || '08123456789',
      registerDate: new Date().toISOString(),
      status: 'approved',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=CMS-REG-${regId}-${currentUser.name.replace(/\s+/g, '')}`,
      attended: false,
    };

    MockDatabase.registerForEvent(newReg);
    setRegistrations(MockDatabase.getEventRegistrations());
    setEvents(MockDatabase.getEvents()); // update count
    setRegisteredSuccess(newReg);
    setSelectedEvent(null);
  };

  // Add Comment Logic
  const handleAddComment = (targetId: string, targetType: 'news' | 'devotion', targetTitle: string) => {
    if (!newCommentText.trim()) return;

    const newCmt: Comment = {
      id: `cmt_${Date.now()}`,
      targetId,
      targetType,
      targetTitle,
      userName: currentUser.name,
      userEmail: currentUser.email,
      content: newCommentText,
      date: new Date().toISOString(),
      status: 'approved', // Auto approve for demo/speed, though admin can moderate
      likes: 0,
    };

    MockDatabase.saveComment(newCmt);
    setNewCommentText('');
    loadAllData();
  };

  // Add Prayer Request Logic
  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim()) return;

    const newReq: PrayerRequest = {
      id: `pry_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      phone: prayerPhone || '08123456789',
      content: newPrayer,
      date: new Date().toISOString(),
      isPrivate: isPrivatePrayer,
      status: 'pending',
    };

    MockDatabase.addPrayerRequest(newReq);
    setNewPrayer('');
    setIsPrivatePrayer(false);
    loadAllData();
    showToast('Permohonan doa Anda telah dikirimkan secara aman ke tim doa syafaat CMS.', 'success');
  };

  // Supporting prayer request count increment (Visual interactive like)
  const handleSupportPrayer = (id: string) => {
    // Local animation trigger/feedback
    const btn = document.getElementById(`pray-btn-${id}`);
    if (btn) {
      btn.classList.add('scale-125', 'text-red-500');
      setTimeout(() => btn.classList.remove('scale-125'), 200);
    }
    // We can show visual toast
    showToast('Anda setuju mendoakan pergumulan ini. Syafaat Anda terkirim!', 'success');
  };

  // Interactive countdown for hero / upcoming event
  useEffect(() => {
    const upcoming = events.find(e => e.status === 'upcoming');
    if (!upcoming) return;

    const targetDate = new Date(upcoming.dateTime).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [events]);

  // Devotion audio simulation progress
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  return (
    <div className="space-y-6">
      {/* Dynamic Sub-tab navigation header (iOS Segmented Control Style) */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex overflow-x-auto gap-2 no-scrollbar flex-1">
          {[
            { id: 'beranda', label: 'Beranda', icon: Church },
            { id: 'jadwal', label: 'Jadwal Ibadah', icon: Calendar },
            { id: 'renungan', label: 'Renungan', icon: BookOpen },
            { id: 'event', label: 'Event Gereja', icon: Award },
            { id: 'donasi', label: 'Kas/Donasi', icon: Coins },
            { id: 'pelayanan', label: 'Pelayanan', icon: Heart },
            { id: 'pengurus', label: 'Pengurus', icon: Users },
            { id: 'galeri', label: 'Galeri', icon: ImageIcon },
            { id: 'profile', label: 'Profil Saya', icon: User },
          ].map((subTab) => {
            const Icon = subTab.icon;
            const isActive = activeTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => {
                  const subSec = mapTabToSubSection(subTab.id);
                  setTab(`jemaat_${subSec}`);
                  setActiveTab(subTab.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-smooth cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-sm shadow-teal-500/10'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {subTab.label}
              </button>
            );
          })}
        </div>

        {/* Notification Bell Button */}
        <button
          onClick={() => setShowNotifModal(true)}
          title="Lihat Pemberitahuan & Notifikasi"
          className="relative p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors shrink-0 cursor-pointer border border-gray-200 flex items-center justify-center"
        >
          <Bell className="w-4 h-4 text-brand" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'beranda' && (
        <div className="space-y-8 animate-fade-in bg-[#070B14] p-6 -mx-6 md:-mx-8 -my-6 md:-my-8 min-h-screen text-slate-100">
          {/* Hero Welcome Banner */}
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#F59E0B] rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-blue-500/10 min-h-[220px] flex items-center">
            {/* Watermark Heart / Decorative Background elements */}
            <div className="absolute right-6 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <span className="bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
                Sistem Informasi Gereja (CMS)
              </span>
              <h2 className="font-display font-black text-2xl md:text-4xl tracking-tight uppercase text-white drop-shadow-md">
                Selamat Datang di {settings.churchName || 'SYSTEM MANAGEMENT CHURCH (CMS)'}
              </h2>
              <p className="text-xs md:text-sm text-slate-100/90 leading-relaxed max-w-2xl font-medium">
                Membangun jemaat yang bertumbuh, melayani dengan kasih, dan memuliakan nama Tuhan Yesus Kristus. Temukan informasi jadwal ibadah, warta jemaat, permohonan doa syafaat, serta salurkan persembahan kasih Anda melalui menu donasi.
              </p>
            </div>
          </div>

          {/* Stats Grid (Real-time Stats) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Total Jemaat Card */}
            <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Total Jemaat</p>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-white mt-2">{congregations.length}</p>
              <span className="bg-blue-500/15 text-blue-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-blue-500/20 mt-3">
                Jiwa Terdaftar
              </span>
            </div>

            {/* Acara Hari Ini Card */}
            <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Jadwal Event</p>
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-yellow-500 mt-2">{events.length}</p>
              <span className="bg-yellow-500/15 text-yellow-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-yellow-500/20 mt-3">
                Jadwal Ibadah & Event
              </span>
            </div>

            {/* Pokok Doa Card */}
            <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Pokok Doa</p>
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-4xl font-black text-rose-500 mt-2">{prayers.length}</p>
              <span className="bg-rose-500/15 text-rose-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-rose-500/20 mt-3">
                Permohonan Doa
              </span>
            </div>

            {/* Donasi Bulan Ini Card */}
            <div className="bg-[#0F172A]/90 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Donasi Bulan Ini</p>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-2">Rp 2.300.000</p>
              <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-black w-fit uppercase border border-emerald-500/20 mt-3">
                Persembahan Kas
              </span>
            </div>
          </div>

          {/* NOTIFIKASI PEMBERITAHUAN CARD SECTION */}
          {notifications.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-amber-300">
                      Pemberitahuan & Notifikasi Resmi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Pemberitahuan langsung dari pengurus gereja
                    </p>
                  </div>
                </div>

                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                  <button
                    onClick={() => {
                      Notification.requestPermission().then((perm) => {
                        if (perm === 'granted') {
                          showToast('✓ Notifikasi Bar HP Berhasil Diaktifkan!', 'success');
                        }
                      });
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1"
                  >
                    <span>🔔 Aktifkan Bar HP</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/50 p-4 rounded-2xl space-y-2 transition-all shadow-md group relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wide">
                        {notif.targetGroup === 'all' ? 'Semua Jemaat' : 'Khusus Jemaat'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.sentDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => {
                            MockDatabase.deleteNotification(notif.id, currentUser);
                            if (activePopupNotif?.id === notif.id) {
                              setActivePopupNotif(null);
                            }
                            loadAllData();
                            showToast('✓ Notifikasi berhasil dihapus.', 'info');
                          }}
                          title="Hapus Notifikasi Ini"
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {notif.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split Section (Warta & Upcoming Event Card) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Warta & Pengumuman Baru (occupies lg:col-span-2) */}
            <div className="lg:col-span-2 bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
                  Warta & Pengumuman Baru
                </h3>
                <button onClick={() => setActiveTab('jadwal')} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5">
                  Lihat Semua
                </button>
              </div>

              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-amber-500 text-[8px] font-black px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                          {ann.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ann.publishDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{ann.content}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAnnouncement(ann);
                      }}
                      className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] rounded-xl tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Upcoming Event Card (Yellow, Cool Youth Fellowship, RSVP button) */}
            {(() => {
              const coolYouthEvent = events.find((e) => e.id === 'cool_youth_fellowship_id') || events.find((e) => e.status === 'upcoming') || events[0];
              const eventTitle = coolYouthEvent ? coolYouthEvent.title : 'COOL YOUTH FELLOWSHIP';
              const eventLocation = coolYouthEvent ? coolYouthEvent.location : `Chapel / Gedung Utama - ${settings.churchName || 'SYSTEM MANAGEMENT CHURCH (CMS)'}`;
              
              let eventDateStr = '22 Juli 2026';
              let eventTimeStr = '19:00 WIB';
              if (coolYouthEvent && coolYouthEvent.dateTime) {
                try {
                  const d = new Date(coolYouthEvent.dateTime);
                  if (!isNaN(d.getTime())) {
                    eventDateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    eventTimeStr = `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
                  }
                } catch {
                  // Fallback
                }
              }
              const registeredCount = coolYouthEvent ? coolYouthEvent.registeredCount : 25;
              const maxQuota = coolYouthEvent ? coolYouthEvent.quota : 40;

              return (
                <div className="bg-[#FACC15] text-[#0F172A] p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[350px] shadow-2xl border border-yellow-500/20">
                  <div className="absolute top-[-10%] right-[-10%] w-36 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <span className="bg-black/10 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit">
                      Upcoming Event
                    </span>
                    
                    <h3 className="text-2xl font-black uppercase tracking-tight mt-6 leading-tight">
                      {eventTitle}
                    </h3>
                    <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0F172A]" />
                      {eventLocation}
                    </p>
                    
                    {/* Custom Info Box */}
                    <div className="mt-6 border-t border-black/10 pt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-extrabold uppercase text-slate-800">Tanggal</span>
                        <span className="font-mono font-bold">{eventDateStr}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-extrabold uppercase text-slate-800">Waktu</span>
                        <span className="font-mono font-bold">{eventTimeStr}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-extrabold uppercase text-slate-800">Kuota RSVP</span>
                        <span className="font-mono font-bold">{coolYouthRsvped ? registeredCount + 1 : registeredCount} / {maxQuota} Terisi</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCoolYouthRsvp}
                    className={`mt-6 font-extrabold text-xs uppercase tracking-widest py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg w-full cursor-pointer ${
                      coolYouthRsvped
                        ? 'bg-emerald-600 hover:bg-emerald-750 text-white'
                        : 'bg-[#1E293B] hover:bg-[#0F172A] text-white'
                    }`}
                  >
                    <span>{coolYouthRsvped ? 'Sudah RSVP (Batal)' : 'Daftar RSVP'}</span>
                    {coolYouthRsvped ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* BERITA GEREJA & PORTAL INFORMASI TERBARU (Kelola News Integration) */}
          <div className="bg-[#0F172A]/90 border border-slate-800/80 p-6 rounded-3xl space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                    Informasi Berita & Warta Kabar
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kabar sukacita, artikel, dan warta kegiatan terkini dari media gereja
                  </p>
                </div>
              </div>
            </div>

            {news.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada berita yang dipublikasikan.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-950">
                      <img
                        src={item.coverUrl || 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=600&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-indigo-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">
                        {item.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{item.author || 'Admin'}</span>
                          <span>{item.publishDate}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedNews(item)}
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-indigo-500/30 text-center"
                      >
                        Baca Selengkapnya
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KAS & DONASI JEMAAT TAB */}
      {activeTab === 'donasi' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-black text-gray-800 dark:text-white text-lg uppercase tracking-wider">Layanan Kas & Donasi Jemaat</h2>
              <p className="text-xs text-gray-400 mt-0.5">Salurkan persembahan persepuluhan, diakonia, maupun donasi pembangunan secara aman.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bank Transfer Card & Info */}
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50/40 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-800/50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-400">
                    <Coins className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-display font-bold text-sm uppercase">Transfer Rekening Bank</h3>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    Anda dapat menyalurkan donasi melalui transfer bank resmi {settings.churchName}. Silakan gunakan nomor rekening berikut:
                  </p>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100/30 dark:border-slate-800 shadow-sm space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Nama Bank</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{settings.bankName || 'BCA (Bank Central Asia)'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Nomor Rekening Kas</span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">{settings.bankAccountNo || '8290123456'}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(settings.bankAccountNo || '8290123456');
                            showToast('Nomor rekening berhasil disalin!', 'success');
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg transition-all border border-indigo-100/40 cursor-pointer"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Atas Nama Rekening</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{settings.bankAccountName || 'SYSTEM MANAGEMENT CHURCH (CMS)'}</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Donation Confirmation Form */}
                <div className="bg-gray-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                  <h4 className="font-display font-bold text-xs uppercase text-slate-700 dark:text-slate-300">Konfirmasi Transfer / Lapor Kas</h4>
                  <p className="text-[10px] text-gray-400">Laporkan bukti pengiriman dana agar tercatat di audit internal sekretariat bendahara gereja.</p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      showToast('Laporan donasi Anda berhasil dikirim! Tim bendahara gereja akan memvalidasi pengiriman dana ini.', 'success');
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[9px] font-semibold text-gray-500 uppercase">Nama Donatur</label>
                      <input type="text" required defaultValue={currentUser.name} className="w-full p-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-gray-500 uppercase">Jumlah Donasi (Rp)</label>
                        <input type="number" required placeholder="Contoh: 150000" className="w-full p-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-gray-500 uppercase">Jenis Persembahan</label>
                        <select className="w-full p-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900">
                          <option>Persepuluhan</option>
                          <option>Persembahan Kas Kasih</option>
                          <option>Donasi Pembangunan</option>
                          <option>Diakonia / Sosial</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-gray-500 uppercase">Catatan / Doa Penyerta</label>
                      <textarea placeholder="Tuliskan pesan atau doa penyerta..." className="w-full h-16 p-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 resize-none" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-brand text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">Kirim Konfirmasi</button>
                  </form>
                </div>
              </div>

              {/* QRIS Code Payment Scan */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-100">
                  Scan QRIS Pembayaran Instan
                </span>
                <p className="text-xs text-gray-500 max-w-sm">Scan menggunakan aplikasi M-Banking (BCA, Mandiri, dll) atau E-Wallet (Gopay, OVO, Dana, LinkAja, ShopeePay) Anda.</p>
                
                <div className="w-64 h-64 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                  {settings.qrisUrl ? (
                    <img src={settings.qrisUrl} alt="QRIS Donasi" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <QrCode className="w-32 h-32 text-gray-300" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{settings.churchName}</p>
                  <span className="text-[10px] text-gray-400 font-mono">NMID: ID1020030405060</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JADWAL IBADAH TAB */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="font-display font-bold text-gray-800 text-lg">Jadwal Pelayanan & Ibadah CMS</h2>
              <p className="text-xs text-gray-400">Jadwal Ibadah Raya Mingguan dan Kegiatan Persekutuan</p>
            </div>

            {/* Custom Interactive Schedule table/grid (Connected to Admin Panel) */}
            {schedules.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/50 border border-gray-100 rounded-2xl">
                <p className="text-xs text-gray-400 italic">Belum ada jadwal ibadah yang dikonfigurasi admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((sch) => {
                  const isReminded = !!reminders[sch.id];
                  return (
                    <div
                      key={sch.id}
                      className="p-5 bg-white border border-gray-200/80 rounded-2xl space-y-3 hover:border-brand transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-brand text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                            {sch.sessionName}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            {sch.dateDay || 'Setiap Minggu'}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-gray-800 text-base">{sch.title}</h3>
                        <p className="text-2xl font-bold font-mono text-brand">
                          {sch.time}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1.5 pt-3 border-t border-gray-100">
                          {sch.speaker && <p><strong>Pembicara:</strong> {sch.speaker}</p>}
                          {sch.worshipLeader && <p><strong>Petugas WL:</strong> {sch.worshipLeader}</p>}
                          {sch.location && <p><strong>Lokasi:</strong> {sch.location}</p>}
                          {sch.isOnline && (
                            <p className="text-emerald-600 font-bold flex items-center gap-1">
                              <span>🔴 Live Streaming Tersedia</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleReminder(sch.id, sch.title)}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all mt-2 cursor-pointer flex items-center justify-center gap-1 ${
                          isReminded
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-brand text-white hover:bg-brand-dark shadow-sm'
                        }`}
                      >
                        {isReminded ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                        {isReminded ? 'Sudah Diingatkan' : 'Ingatkan Saya'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Maps & Location Block */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <span className="bg-teal-50 text-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Lokasi Fisik CMS</span>
              <h3 className="font-display font-bold text-gray-800 text-lg">{settings.churchName}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{settings.address}</p>
              
              <div className="text-xs text-gray-500 space-y-1.5">
                <p><strong>Telepon Sekretariat:</strong> {settings.phone}</p>
                <p><strong>Email:</strong> {settings.email}</p>
                <p><strong>Pintu Masuk Utama:</strong> Parkiran Utara & Basemen khusus roda dua</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={settings.mapsLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" /> Google Maps Direct
                </a>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="h-64 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative">
              <iframe
                title="Google Maps CMS"
                src={settings.mapsEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      {/* RENUNGAN TAB */}
      {activeTab === 'renungan' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-gray-800 text-lg">Manna Surgawi - Renungan Harian</h2>
              <p className="text-xs text-gray-400">Hidup berkemenangan di dalam sabda firman-Nya setiap hari.</p>
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari Renungan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs bg-white border border-gray-200 rounded-xl focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Devotion List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devotions
              .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-smooth flex flex-col justify-between group"
                >
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={dev.coverUrl}
                      alt={dev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {dev.category}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] bg-white/20 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded font-mono font-bold">
                        {dev.scripture}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm group-hover:text-brand transition-colors">
                        {dev.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-4 leading-relaxed mt-1">
                        {dev.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-3 text-[10px] text-gray-400">
                      <span>Tanggal: {dev.publishDate}</span>
                      <button
                        onClick={() => setSelectedDevotion(dev)}
                        className="px-3.5 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-semibold"
                      >
                        Baca Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* EVENT TAB */}
      {activeTab === 'event' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-gray-800 text-lg">Kegiatan & Event CMS</h2>
            <p className="text-xs text-gray-400">Ikuti pertumbuhan rohani jemaat dengan mendaftarkan diri pada kegiatan yang diadakan gereja kami.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => {
              const isAlreadyRegistered = registrations.some(r => r.eventId === evt.id && r.userId === currentUser.id);
              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-smooth flex flex-col justify-between group"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {evt.status === 'upcoming' ? 'Akan Datang' : 'Sedang Berlangsung'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-gray-800 text-base leading-snug group-hover:text-brand transition-colors">
                        {evt.title}
                      </h3>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand" /> {evt.location}</p>
                        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand" /> {new Date(evt.dateTime).toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed pt-1">
                        {evt.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="text-[10px] text-gray-400">
                        <span>Terdaftar: <strong>{evt.registeredCount}</strong> / {evt.quota} Jemaat</span>
                        <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div style={{ width: `${(evt.registeredCount / evt.quota) * 100}%` }} className="bg-brand h-full" />
                        </div>
                      </div>

                      {isAlreadyRegistered ? (
                        <button
                          onClick={() => {
                            const found = registrations.find(r => r.eventId === evt.id && r.userId === currentUser.id);
                            if (found) setRegisteredSuccess(found);
                          }}
                          className="px-4 py-2 bg-green-50 text-green-700 border border-green-100 font-bold text-xs rounded-xl flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Lihat Tiket QR
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-4 py-2 bg-brand text-white hover:bg-brand-dark font-bold text-xs rounded-xl shadow-sm transition-colors"
                        >
                          Daftar Event
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PELAYANAN TAB */}
      {activeTab === 'pelayanan' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-gray-800 text-lg">Bidang Pelayanan Jemaat CMS</h2>
            <p className="text-xs text-gray-400">Sambut panggilan pelayanan untuk memperlebar kerajaan Allah dengan terlibat di komisi jemaat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ministries.map((min) => (
              <div
                key={min.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-brand transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="bg-brand-light text-brand text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {min.category}
                  </span>
                  <h3 className="font-display font-bold text-gray-800 text-sm">{min.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{min.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 mt-4 text-[10px] text-gray-400 space-y-1">
                  <p><strong>Koordinator:</strong> {min.leader}</p>
                  <p><strong>Jadwal:</strong> {min.schedule}</p>
                  <p><strong>Kontak:</strong> <a href={`tel:${min.contact}`} className="text-brand hover:underline">{min.contact}</a></p>
                  <button
                    onClick={() => showToast(`Terima kasih atas kerinduan Anda bergabung di ${min.name}. Pengurus pelayanan akan menghubungi Anda segera!`, 'success')}
                    className="w-full mt-3 py-2 bg-brand/10 text-brand font-bold text-xs rounded-xl hover:bg-brand hover:text-white transition-all cursor-pointer"
                  >
                    Bergabung Melayani
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENGURUS/ORGANISASI TAB */}
      {activeTab === 'pengurus' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display font-bold text-gray-800 text-xl">Struktur Majelis Jemaat & Pengurus Gereja</h2>
            <p className="text-xs text-gray-400">Para hamba Tuhan yang melayani dalam penggembalaan dan tata kelola organisasi gereja CMS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {orgs.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center space-y-4 hover:border-brand transition-smooth relative group overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-600 to-amber-500" />
                <div className="w-24 h-24 rounded-full border-2 border-brand/20 p-1 mx-auto overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={org.photoUrl}
                    alt={org.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-gray-800 text-sm leading-tight">{org.name}</h3>
                  <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider block bg-teal-50 px-2 py-0.5 rounded-full w-max mx-auto">
                    {org.roleName}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-mono">{org.period}</span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed text-center line-clamp-3">
                  {org.description}
                </p>

                <div className="pt-3 border-t border-gray-50 text-[10px]">
                  <span className="text-gray-400">Kontak Resmi:</span>
                  <p className="font-semibold text-gray-700 truncate">{org.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALERI TAB */}
      {activeTab === 'galeri' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-gray-800 text-lg">Dokumentasi & Galeri CMS</h2>
            <p className="text-xs text-gray-400">Mengabadikan sukacita persekutuan dan momen-momen pelayanan di CMS.</p>
          </div>

          {/* Lazy Loaded Grid structure */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGallery(g)}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:border-brand transition-smooth group relative"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={g.url}
                    alt={g.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" />
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-semibold truncate leading-none opacity-0 group-hover:opacity-100 transition-all">
                    {g.title}
                  </span>
                </div>
                <div className="p-2 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-medium">
                  <span className="truncate">{g.category}</span>
                  <span className="font-mono">{g.uploadDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFIL TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          {/* Cover Header */}
          <div className="bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -z-10" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 p-0.5 overflow-hidden shadow-lg flex-shrink-0 bg-slate-800">
                <img
                  src={currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center md:text-left space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="font-display font-bold text-white text-xl md:text-2xl tracking-tight leading-tight truncate">
                    {currentUser.name}
                  </h2>
                  <span className="bg-brand text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand/30 w-max mx-auto md:mx-0">
                    Jemaat CMS
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{currentUser.email}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Terdaftar Sejak: {currentUser.joinDate || '12 Januari 2022'}
                </p>
              </div>

              {/* Action Buttons on desktop/tablet */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm border border-slate-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Profil
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-bold text-xs rounded-xl shadow-sm border border-rose-500/20 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out / Keluar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left/Middle Column: Details Grid */}
            <div className="md:col-span-2 space-y-6">
              {/* Membership Details */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="border-b border-gray-50 pb-3">
                  <h3 className="font-display font-bold text-gray-800 text-sm">Informasi Detail Keanggotaan</h3>
                  <p className="text-[10px] text-gray-400">Data pribadi Anda yang terdaftar di database jemaat CMS.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">No. Telepon</span>
                    <p className="font-semibold text-gray-750">{currentUser.phone || '-'}</p>
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Komisi Jemaat</span>
                    <p className="font-semibold text-gray-750">{currentUser.komisi || 'Umum'}</p>
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Status Baptis</span>
                    <p className="font-semibold text-gray-750">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentUser.statusBaptis === 'Sudah' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {currentUser.statusBaptis === 'Sudah' ? '✓ Sudah Dibaptis' : '✗ Belum Dibaptis'}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Status Pernikahan</span>
                    <p className="font-semibold text-gray-750">{currentUser.statusPernikahan || 'Belum Menikah'}</p>
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Keluarga / Relasi</span>
                    <p className="font-semibold text-gray-750">{currentUser.keluarga || '-'}</p>
                  </div>

                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Bidang Pelayanan</span>
                    <p className="font-semibold text-gray-750">{currentUser.pelayanan || 'Tidak / Belum Terlibat'}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Alamat Terdaftar</span>
                    <p className="font-semibold text-gray-750 leading-relaxed">{currentUser.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Event Registrations */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-gray-800 text-sm">Tiket Event Saya ({registrations.filter(r => r.userId === currentUser.id).length})</h3>
                    <p className="text-[10px] text-gray-400">Daftar keikutsertaan Anda dalam kegiatan dan seminar CMS.</p>
                  </div>
                  <button
                    onClick={() => setTab('jemaat_events')}
                    className="text-[10px] text-brand hover:underline font-bold cursor-pointer"
                  >
                    Daftar Event Baru →
                  </button>
                </div>

                {registrations.filter(r => r.userId === currentUser.id).length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                    <Calendar className="w-8 h-8 mx-auto text-gray-300" />
                    <p>Anda belum mendaftar untuk kegiatan apa pun saat ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registrations
                      .filter(r => r.userId === currentUser.id)
                      .map((reg) => (
                        <div key={reg.id} className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-xs text-gray-800 truncate">{reg.eventTitle}</h4>
                            <p className="text-[10px] text-gray-400">Didaftar pada: {reg.registerDate}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                              reg.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              Status: {reg.status === 'approved' ? 'Terverifikasi' : 'Pending'}
                            </span>
                          </div>
                          <button
                            onClick={() => setRegisteredSuccess(reg)}
                            className="px-3 py-1.5 bg-brand text-white font-bold text-[10px] rounded-lg hover:bg-brand-dark transition-colors shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> QR Tiket
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Membership Card Widget */}
            <div className="space-y-6">
              {/* PWA / Digital Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-gray-800 text-sm">Kartu Jemaat Digital</h3>
                <p className="text-[10px] text-gray-400">Gunakan kartu digital ini untuk presensi otomatis saat menghadiri kegiatan gereja.</p>

                {/* Digital Card Design */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 p-5 rounded-2xl border border-slate-850 shadow-lg text-white space-y-6 relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between">
                  {/* Watermark Logo */}
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Part */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Church className="w-5 h-5 text-teal-400" />
                      <div className="leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">KARTU ANGGOTA</span>
                        <p className="text-[8px] font-semibold text-slate-300">CMS PORTAL</p>
                      </div>
                    </div>
                    <span className="text-[8px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-bold font-mono">PWA LIVE</span>
                  </div>

                  {/* Mid Part */}
                  <div className="flex justify-between items-end gap-3 flex-1 pt-2">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div>
                        <span className="text-[7px] text-slate-400 uppercase tracking-wider block leading-none">NAMA LENGKAP</span>
                        <p className="text-xs font-black truncate">{currentUser.name}</p>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-400 uppercase tracking-wider block leading-none">ID ANGGOTA</span>
                        <p className="text-[9px] font-mono font-bold text-slate-300">{currentUser.id}</p>
                      </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="w-16 h-16 bg-white p-1 rounded-lg shadow flex items-center justify-center overflow-hidden shrink-0">
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[9px] text-gray-455 leading-relaxed">
                    Kartu ini diterbitkan oleh <strong>{settings.churchName}</strong> dan dilindungi enkripsi sistem PWA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS SECTION */}
      <AnimatePresence>
        {/* News Detail Modal with comments */}
        {selectedNews && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-100"
            >
              {/* Header Image */}
              <div className="h-48 relative overflow-hidden flex-shrink-0">
                <img src={selectedNews.coverUrl} alt={selectedNews.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                >
                  <Check className="w-4 h-4 rotate-45" /> {/* simple cross */}
                </button>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {selectedNews.category}
                  </span>
                  <h3 className="font-display font-bold text-lg mt-1 tracking-tight">
                    {selectedNews.title}
                  </h3>
                </div>
              </div>

              {/* Scrollable Content & comments */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-600 leading-relaxed">
                <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-gray-50 pb-3">
                  <span>Diterbitkan: {selectedNews.publishDate}</span>
                  <span>Oleh: {selectedNews.author}</span>
                </div>

                <p className="whitespace-pre-line text-xs text-gray-700 leading-relaxed">
                  {selectedNews.content}
                </p>

                {/* Likes engagement button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectedNews.likes += 1;
                      alert('Satu apresiasi sukacita terkirim!');
                      loadAllData();
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                    Beri Dukungan Kasih ({selectedNews.likes})
                  </button>
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <h4 className="font-display font-bold text-gray-800 text-sm">
                    Diskusi Jemaat ({comments.filter((c) => c.targetId === selectedNews.id && c.status === 'approved').length})
                  </h4>

                  <div className="space-y-3">
                    {comments
                      .filter((c) => c.targetId === selectedNews.id && c.status === 'approved')
                      .map((cmt) => (
                        <div key={cmt.id} className="p-3 bg-gray-50 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-gray-800 font-semibold">{cmt.userName}</strong>
                            <span className="text-gray-400">{new Date(cmt.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-gray-600">{cmt.content}</p>
                        </div>
                      ))}
                  </div>

                  {/* Add comment Form */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Tuliskan apresiasi atau tanggapan Anda..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 p-2.5 text-xs rounded-xl border border-gray-200 focus:border-brand"
                    />
                    <button
                      onClick={() => handleAddComment(selectedNews.id, 'news', selectedNews.title)}
                      className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Devotion Detail Modal with comments */}
        {selectedDevotion && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-100"
            >
              <div className="h-44 relative overflow-hidden flex-shrink-0">
                <img src={selectedDevotion.coverUrl} alt={selectedDevotion.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <button
                  onClick={() => {
                    setSelectedDevotion(null);
                    setIsPlayingAudio(false);
                    setAudioProgress(0);
                  }}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md"
                >
                  <Check className="w-4 h-4 rotate-45" />
                </button>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {selectedDevotion.category}
                  </span>
                  <h3 className="font-display font-bold text-lg mt-1">
                    {selectedDevotion.title}
                  </h3>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-600 leading-relaxed">
                {/* Audio Podcast Player Simulation */}
                <div className="p-4 bg-teal-50/30 border border-teal-100/40 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="p-3 bg-brand text-white rounded-full hover:bg-brand-dark shadow-sm transition-all"
                    >
                      {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Audio Renungan</span>
                      <span className="text-xs font-semibold text-gray-700">Dengarkan Versi Audio Siniar</span>
                    </div>
                  </div>
                  {/* Progress simulation */}
                  {isPlayingAudio && (
                    <div className="flex-1 max-w-[120px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div style={{ width: `${audioProgress}%` }} className="bg-brand h-full" />
                    </div>
                  )}
                </div>

                <blockquote className="border-l-4 border-brand pl-4 italic font-semibold text-gray-700 bg-gray-50 p-3 rounded-r-xl">
                  BACAAN FIRMAN: {selectedDevotion.scripture}
                </blockquote>

                <p className="whitespace-pre-line text-xs text-gray-700 leading-relaxed rich-text-content">
                  {selectedDevotion.content}
                </p>

                {/* Commenting directly */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <h4 className="font-display font-bold text-gray-800 text-sm">
                    Komentar Jemaat ({comments.filter((c) => c.targetId === selectedDevotion.id && c.status === 'approved').length})
                  </h4>

                  <div className="space-y-3">
                    {comments
                      .filter((c) => c.targetId === selectedDevotion.id && c.status === 'approved')
                      .map((cmt) => (
                        <div key={cmt.id} className="p-3 bg-gray-50 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-gray-800 font-semibold">{cmt.userName}</strong>
                            <span className="text-gray-400">{new Date(cmt.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-gray-600">{cmt.content}</p>
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Bagikan berkat atau ketikan amin..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 p-2.5 text-xs rounded-xl border border-gray-200 focus:border-brand"
                    />
                    <button
                      onClick={() => handleAddComment(selectedDevotion.id, 'devotion', selectedDevotion.title)}
                      className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-dark"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="font-display font-bold text-gray-800 text-sm">
                  Edit Profil Saya
                </h3>
                <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {/* Photo URL / Offline Upload (Base64) Option */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 text-left">
                    Foto Profil (URL Gambar)
                  </label>
                  <div className="flex gap-3 items-center">
                    <img 
                      src={editPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-full object-cover border border-gray-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 text-left">
                      <input
                        type="text"
                        value={editPhotoUrl}
                        onChange={(e) => setEditPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... atau base64"
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="profile-photo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1 * 1024 * 1024) {
                              alert('Ukuran file maksimal 1MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setEditPhotoUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="profile-photo-upload"
                        className="text-[10px] text-brand hover:underline font-bold mt-1 inline-block cursor-pointer"
                      >
                        Atau Unggah Foto Baru (Pilih File)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-left">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Komisi Jemaat
                    </label>
                    <select
                      value={editKomisi}
                      onChange={(e) => setEditKomisi(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
                    >
                      <option value="Pemuda">Pemuda</option>
                      <option value="Anak-anak">Anak-anak</option>
                      <option value="Remaja">Remaja</option>
                      <option value="Dewasa">Dewasa</option>
                      <option value="Wanita">Wanita</option>
                      <option value="Pria">Pria</option>
                      <option value="Lansia">Lansia</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Status Baptis
                    </label>
                    <select
                      value={editBaptis}
                      onChange={(e) => setEditBaptis(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
                    >
                      <option value="Sudah">Sudah</option>
                      <option value="Belum">Belum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Status Pernikahan
                    </label>
                    <select
                      value={editNikah}
                      onChange={(e) => setEditNikah(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
                    >
                      <option value="Sudah Menikah">Sudah Menikah</option>
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Cerai">Cerai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Keluarga / Relasi
                    </label>
                    <input
                      type="text"
                      value={editKeluarga}
                      onChange={(e) => setEditKeluarga(e.target.value)}
                      placeholder="e.g. Anak (Orang tua: Budi)"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Bidang Pelayanan
                    </label>
                    <input
                      type="text"
                      value={editPelayanan}
                      onChange={(e) => setEditPelayanan(e.target.value)}
                      placeholder="e.g. Pemain Musik (Keyboard)"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full h-16 p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand resize-none"
                    placeholder="Tuliskan alamat tinggal lengkap..."
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition-colors shadow-sm cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Event Register Prompt Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full p-6 border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="font-display font-bold text-gray-800 text-sm">
                  Konfirmasi Pendaftaran Event
                </h3>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
              </div>

              <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100/50 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">{selectedEvent.title}</p>
                  <p className="text-gray-500 mt-1">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Nama Pendaftar (Sesuai Profil)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.name}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.email}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / HP Aktif
                  </label>
                  <input
                    type="tel"
                    required
                    value={eventRegPhone}
                    onChange={(e) => setEventRegPhone(e.target.value)}
                    placeholder="e.g. 0812xxxxxxxx"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <button
                onClick={() => handleEventRegister(selectedEvent)}
                className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
              >
                Konfirmasi Pendaftaran
              </button>
            </motion.div>
          </div>
        )}

        {/* Event Registration QR Code Ticket Success Modal */}
        {registeredSuccess && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100 space-y-4 relative"
            >
              {/* Confetti-like Flare */}
              <div className="absolute top-0 inset-x-0 h-2.5 bg-brand" />
              
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-gray-800 text-sm">
                  Pendaftaran Anda Berhasil!
                </h3>
                <p className="text-xs text-gray-400">Tunjukkan QR Code berikut di loket presensi kehadiran fisik.</p>
              </div>

              {/* QR Code Canvas/Image */}
              <div className="p-4 bg-gray-50 rounded-2xl w-max mx-auto border border-gray-100 relative">
                <img src={registeredSuccess.qrCodeUrl} alt="QR Code Ticket" className="w-44 h-44 object-contain" referrerPolicy="no-referrer" />
                <QrCode className="w-5 h-5 text-gray-400 absolute bottom-2 right-2" />
              </div>

              <div className="p-3 bg-teal-50/30 rounded-xl text-left border border-teal-100/30 text-[10px] space-y-1">
                <p className="truncate"><strong>Event:</strong> {registeredSuccess.eventTitle}</p>
                <p><strong>Pendaftar:</strong> {registeredSuccess.userName}</p>
                <p><strong>ID Tiket:</strong> <code className="font-mono">{registeredSuccess.id}</code></p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => showToast('✓ Tiket pendaftaran berhasil disimpan ke galeri ponsel Anda!', 'success')}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Unduh Tiket
                </button>
                <button
                  onClick={() => setRegisteredSuccess(null)}
                  className="flex-1 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition-colors"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 flex flex-col border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-brand" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pengumuman Resmi</span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-gray-400 hover:text-gray-650 p-1.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <span className="bg-brand/10 text-brand text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {selectedAnnouncement.category}
                </span>
                <h3 className="font-display font-bold text-gray-950 text-base leading-tight">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  Dipublikasikan: {selectedAnnouncement.publishDate}
                </p>
              </div>

              <div className="text-xs text-gray-600 leading-relaxed max-h-[40vh] overflow-y-auto whitespace-pre-wrap pt-2 border-t border-gray-50">
                {selectedAnnouncement.content}
              </div>

              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Selesai Membaca
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* News Detail Modal */}
        {selectedNews && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="relative aspect-video bg-gray-100">
                <img src={selectedNews.coverUrl} alt={selectedNews.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-indigo-100">
                    {selectedNews.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Penulis: {selectedNews.author || 'Admin'} • {selectedNews.publishDate}
                  </span>
                </div>

                <h3 className="font-display font-black text-gray-900 text-lg leading-snug">
                  {selectedNews.title}
                </h3>

                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap pt-2 border-t border-gray-100">
                  {selectedNews.content}
                </div>

                {/* Comment Section */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <h4 className="font-display font-bold text-gray-800 text-xs">
                    Komentar & Respon Jemaat ({comments.filter((c) => c.targetId === selectedNews.id && c.status === 'approved').length})
                  </h4>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments
                      .filter((c) => c.targetId === selectedNews.id && c.status === 'approved')
                      .map((cmt) => (
                        <div key={cmt.id} className="p-3 bg-gray-50 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-gray-800 font-semibold">{cmt.userName}</strong>
                            <span className="text-gray-400">{new Date(cmt.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-gray-600">{cmt.content}</p>
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Tulis tanggapan atau komentar..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 p-2 text-xs rounded-xl border border-gray-200 focus:border-brand"
                    />
                    <button
                      onClick={() => handleAddComment(selectedNews.id, 'news', selectedNews.title)}
                      className="p-2 bg-brand text-white rounded-xl hover:bg-brand-dark cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notification History & Dismiss Modal */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full p-6 flex flex-col border border-gray-100 space-y-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand" />
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">
                      Pemberitahuan & Notifikasi ({notifications.length})
                    </h3>
                    <p className="text-[10px] text-gray-400">Notifikasi resmi dan kabar terkini untuk jemaat</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="text-gray-400 hover:text-gray-650 p-1.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400 font-medium">Tidak ada notifikasi atau pemberitahuan aktif saat ini.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-2 relative group hover:border-teal-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] bg-teal-50 text-brand px-2 py-0.5 rounded font-extrabold uppercase border border-teal-100">
                            {item.targetGroup === 'all' ? 'Semua Jemaat' : item.targetGroup}
                          </span>
                          <h4 className="font-bold text-gray-900 text-xs mt-1.5">{item.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            MockDatabase.deleteNotification(item.id, currentUser);
                            if (activePopupNotif?.id === item.id) {
                              setActivePopupNotif(null);
                            }
                            loadAllData();
                            showToast('✓ Notifikasi berhasil dihapus.', 'info');
                          }}
                          title="Hapus Notifikasi Ini"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed font-sans">{item.content}</p>

                      <div className="text-[10px] text-gray-400 font-mono pt-1 border-t border-gray-100 flex justify-between items-center">
                        <span>{new Date(item.sentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>{new Date(item.sentDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Bersihkan seluruh notifikasi di dashboard Anda?')) {
                        MockDatabase.clearAllNotifications(currentUser);
                        loadAllData();
                        showToast('Seluruh notifikasi telah dibersihkan.', 'info');
                      }
                    }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bersihkan Semua
                  </button>
                )}
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer ml-auto"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Gallery Image Detail Modal */}
        {selectedGallery && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col border border-slate-800"
            >
              <div className="relative aspect-video bg-gray-100">
                <img src={selectedGallery.url} alt={selectedGallery.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  onClick={() => setSelectedGallery(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-2 text-white">
                <span className="bg-teal-500/20 text-teal-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-teal-500/30">
                  {selectedGallery.category}
                </span>
                <h3 className="font-display font-bold text-base leading-tight">
                  {selectedGallery.title}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Dokumentasi: {selectedGallery.date}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedGallery.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Active Notification Popup Card overlay for in-app alert */}
        <AnimatePresence>
          {activePopupNotif && (
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[95] pointer-events-auto">
              <motion.div
                initial={{ y: -50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-r from-amber-500 via-amber-600 to-teal-700 text-white p-4 rounded-3xl shadow-2xl border border-amber-300/40 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-black/20 rounded-2xl border border-white/20 text-xl">
                      🔔
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 bg-black/20 px-2 py-0.5 rounded-full">
                        Pemberitahuan Baru
                      </span>
                      <h4 className="font-extrabold text-sm text-white mt-1 leading-tight">
                        {activePopupNotif.title}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePopupNotif(null)}
                    className="p-1 hover:bg-black/20 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-amber-50 font-medium mt-2 leading-relaxed bg-black/20 p-3 rounded-2xl border border-white/10">
                  {activePopupNotif.content}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-amber-200 font-mono">
                    {new Date(activePopupNotif.sentDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                      <button
                        onClick={() => {
                          Notification.requestPermission().then((perm) => {
                            if (perm === 'granted') {
                              showToast('✓ Notifikasi Bar HP Berhasil Diaktifkan!', 'success');
                            }
                          });
                        }}
                        className="text-[10px] bg-white text-slate-900 px-3 py-1.5 rounded-xl font-bold hover:bg-amber-100 transition-all cursor-pointer"
                      >
                        🔔 Aktifkan Bar HP
                      </button>
                    )}
                    <button
                      onClick={() => setActivePopupNotif(null)}
                      className="text-[10px] bg-black/30 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-black/50 transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                : toast.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400/30'
                : 'bg-teal-500/90 text-white border-teal-400/30'
            }`}>
              <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                {toast.type === 'success' ? (
                  <Check className="w-4 h-4 text-white" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-white" />
                ) : (
                  <Info className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 pt-0.5 leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
