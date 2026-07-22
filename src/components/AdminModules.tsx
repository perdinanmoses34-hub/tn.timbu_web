/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Megaphone,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Bell,
  Award,
  ShieldAlert,
  Image as ImageIcon,
  Database,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  Eye,
  QrCode,
  CheckCircle2,
  CheckCircle,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { MockDatabase } from '../db/mockDb';
import {
  Announcement,
  News,
  Devotion,
  Event as ChurchEvent,
  Congregation,
  Comment,
  Notification,
  Ministry,
  Organization,
  Gallery,
  ChurchSettings,
  Role,
  User,
  ServiceSchedule,
} from '../types';
import {
  initGoogleDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
} from '../lib/googleDriveSync';
import firebaseConfig from '../../firebase-applet-config.json';

// Helper function to compress uploaded images for Base64 storage
const compressImageFile = (file: File, maxWidth = 300, maxHeight = 300, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

interface AdminModulesProps {
  activeTab: string;
  setTab: (tab: string) => void;
  currentUser: { id: string; name: string; role: Role; email: string };
  settings: ChurchSettings;
  onSettingsSaved: (newSettings: ChurchSettings) => void;
}

export default function AdminModules({
  activeTab,
  setTab,
  currentUser,
  settings,
  onSettingsSaved,
}: AdminModulesProps) {
  // Common search states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Loaders
  const [news, setNews] = useState<News[]>([]);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [devs, setDevs] = useState<Devotion[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [congs, setCongs] = useState<Congregation[]>([]);
  const [comms, setComms] = useState<Comment[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);

  // Editing forms state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Custom Event Registrants check-in subview
  const [selectedEventIdForRegistrants, setSelectedEventIdForRegistrants] = useState<string | null>(null);
  const [eventRegs, setEventRegs] = useState<any[]>([]);
  const [manualCheckinId, setManualCheckinId] = useState('');

  // Excel Import Simulated text input
  const [excelImportJson, setExcelImportJson] = useState('');

  // Notification Broadcast Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifTargetGroup, setNotifTargetGroup] = useState<'all' | 'admin' | 'jemaat'>('all');

  // DB Restore text state
  const [restoreJson, setRestoreJson] = useState('');

  // Google Sheets Sync state
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('church_sync_sheet_url') || 'https://docs.google.com/spreadsheets/d/1ejgcYFq4JZCyyLeSu3RgBWlj6kcw2h1dRmV17yt43Ck/edit';
  });
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncLogs, setSheetSyncLogs] = useState<string[]>([]);
  const [selectedTablesToSync, setSelectedTablesToSync] = useState<string[]>([
    "settings",
    "users",
    "announcements",
    "devotions",
    "events",
    "service_schedules",
    "prayer_requests",
    "gallery"
  ]);

  // Google Drive Sync state
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [gdriveAutoSync, setGdriveAutoSync] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gdrive_sync_auto') === 'true';
    }
    return false;
  });
  const [isSyncingGDrive, setIsSyncingGDrive] = useState(false);
  const [gdriveSyncLogs, setGdriveSyncLogs] = useState<string[]>([]);
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (user, token) => {
        setGdriveUser(user);
        setGdriveToken(token);
        sessionStorage.setItem('gdrive_access_token', token);
      },
      () => {
        setGdriveUser(null);
        setGdriveToken(null);
        sessionStorage.removeItem('gdrive_access_token');
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

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
    setNews(MockDatabase.getNews());
    setAnns(MockDatabase.getAnnouncements());
    setDevs(MockDatabase.getDevotions());
    setEvents(MockDatabase.getEvents());
    setCongs(MockDatabase.getCongregations());
    setComms(MockDatabase.getComments());
    setNotifs(MockDatabase.getNotifications());
    setMinistries(MockDatabase.getMinistries());
    setOrgs(MockDatabase.getOrganizations());
    setGallery(MockDatabase.getGallery());
    setUsers(MockDatabase.getUsers());
    setSchedules(MockDatabase.getSchedules());

    if (selectedEventIdForRegistrants) {
      const regs = MockDatabase.getEventRegistrations();
      setEventRegs(regs.filter((r) => r.eventId === selectedEventIdForRegistrants));
    }
  };

  // NEWS ACTIONS
  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    const item: News = editingItem;
    MockDatabase.saveNews(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      MockDatabase.deleteNews(id, currentUser);
      loadAllData();
    }
  };

  // ANNOUNCEMENTS ACTIONS
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Announcement = editingItem;
    MockDatabase.saveAnnouncement(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Yakin ingin menghapus pengumuman ini?')) {
      MockDatabase.deleteAnnouncement(id, currentUser);
      loadAllData();
    }
  };

  // DEVOTIONS ACTIONS
  const handleSaveDevotion = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Devotion = editingItem;
    MockDatabase.saveDevotion(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteDevotion = (id: string) => {
    if (confirm('Yakin ingin menghapus renungan ini?')) {
      MockDatabase.deleteDevotion(id, currentUser);
      loadAllData();
    }
  };

  // EVENTS ACTIONS
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ChurchEvent = editingItem;
    MockDatabase.saveEvent(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Yakin ingin menghapus event ini?')) {
      MockDatabase.deleteEvent(id, currentUser);
      loadAllData();
    }
  };

  // SCHEDULE ACTIONS
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const item: ServiceSchedule = {
      id: editingItem.id || `sch_${Date.now()}`,
      sessionName: editingItem.sessionName || 'Sesi Baru',
      title: editingItem.title || 'Ibadah Raya',
      time: editingItem.time || '07.00 WIB',
      speaker: editingItem.speaker || '',
      worshipLeader: editingItem.worshipLeader || '',
      location: editingItem.location || 'Main Sanctuary (Lt. 1)',
      category: editingItem.category || 'Ibadah Raya',
      dateDay: editingItem.dateDay || 'Setiap Hari Minggu',
      isOnline: !!editingItem.isOnline,
      notes: editingItem.notes || ''
    };
    
    MockDatabase.saveSchedule(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Yakin ingin menghapus jadwal ibadah ini?')) {
      MockDatabase.deleteSchedule(id, currentUser);
      loadAllData();
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCheckinId.trim()) return;
    
    // Check in the attendee
    const success = MockDatabase.checkInAttendee(manualCheckinId, currentUser);
    if (success) {
      alert('Selesai! Kehadiran jemaat berhasil divalidasi dan di-check-in secara real-time.');
      setManualCheckinId('');
      loadAllData();
    } else {
      alert('Maaf, ID tiket registrasi tidak valid.');
    }
  };

  // CONGREGATION DATABASE ACTIONS
  const handleSaveCongregation = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Congregation = editingItem;
    MockDatabase.saveCongregation(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteCongregation = (id: string) => {
    if (confirm('Yakin ingin menghapus jemaat ini dari database?')) {
      MockDatabase.deleteCongregation(id, currentUser);
      loadAllData();
    }
  };

  // USER LOGIN CREDENTIAL ACTIONS
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const item: User = editingItem;
    MockDatabase.saveUser(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Yakin ingin menghapus akun pengguna ini dari database?')) {
      MockDatabase.deleteUser(id, currentUser);
      loadAllData();
    }
  };

  // MINISTRIES ACTIONS
  const handleSaveMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Ministry = editingItem;
    MockDatabase.saveMinistry(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteMinistry = (id: string) => {
    if (confirm('Yakin ingin menghapus pelayanan ini?')) {
      MockDatabase.deleteMinistry(id, currentUser);
      loadAllData();
    }
  };

  // ORGANIZATIONS ACTIONS
  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Organization = editingItem;
    MockDatabase.saveOrganization(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteOrganization = (id: string) => {
    if (confirm('Yakin ingin menghapus pengurus ini?')) {
      MockDatabase.deleteOrganization(id, currentUser);
      loadAllData();
    }
  };

  // GALLERY ACTIONS
  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Gallery = editingItem;
    MockDatabase.saveGallery(item, currentUser);
    setIsCreatingNew(false);
    setEditingItem(null);
    loadAllData();
  };

  const handleDeleteGallery = (id: string) => {
    if (confirm('Yakin ingin menghapus galeri ini?')) {
      MockDatabase.deleteGallery(id, currentUser);
      loadAllData();
    }
  };

  // Export Congregation database to JSON (Simulated Excel Download)
  const handleExportCongregation = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(congs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", `Data_Jemaat_CMS_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    alert('Ekspor Berhasil! File JSON database jemaat terdownload (Kompatibel dengan sistem audit Kemenag/Sistem internal Excel).');
  };

  // Import Congregation simulated upload
  const handleImportCongregation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelImportJson.trim()) return;

    try {
      const parsed = JSON.parse(excelImportJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        if (item.name) {
          const newC: Congregation = {
            id: item.id || `cong_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: item.name,
            photoUrl: item.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            address: item.address || 'Jakarta',
            phone: item.phone || '0812xxxx',
            email: item.email || 'jemaat@gkhk.or.id',
            isBaptized: item.isBaptized ?? true,
            isMarried: item.isMarried ?? false,
            familyMembers: item.familyMembers || 'Lajang',
            commission: item.commission || 'Pemuda',
            ministry: item.ministry || 'Pelayanan Umum',
            joinDate: item.joinDate || new Date().toISOString().split('T')[0],
          };
          MockDatabase.saveCongregation(newC, currentUser);
        }
      });
      alert('Impor Berhasil! Jemaat baru telah ditambahkan ke database.');
      setExcelImportJson('');
      loadAllData();
    } catch (e) {
      alert('Impor Gagal. Format JSON tidak valid atau struktur tidak cocok.');
    }
  };

  // COMMENT MODERATION ACTIONS
  const handleModerateComment = (id: string, action: 'approved' | 'rejected' | 'spam') => {
    MockDatabase.moderateComment(id, action, currentUser);
    loadAllData();
  };

  // NOTIFICATION BROADCAST ACTIONS
  const handleBroadcastNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) return;

    const notif: Notification = {
      id: `notif_${Date.now()}`,
      title: notifTitle,
      content: notifContent,
      targetGroup: notifTargetGroup,
      sentDate: new Date().toISOString(),
      sentBy: currentUser.email,
    };

    MockDatabase.broadcastNotification(notif, currentUser);
    setNotifTitle('');
    setNotifContent('');
    loadAllData();
    alert('Push Notification FCM Berhasil Dikirimkan ke semua perangkat jemaat terdaftar secara real-time!');
  };

  // DATABASE RESTORE & BACKUP ACTIONS
  const handleDownloadFullBackup = () => {
    const backupStr = MockDatabase.exportDatabase();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupStr);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", `Full_Backup_CMS_DB_${Date.now()}.json`);
    dlAnchorElem.click();
    alert('Ekspor Full Database Berhasil!');
  };

  const handleRestoreDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJson.trim()) return;

    const success = MockDatabase.restoreDatabase(restoreJson, currentUser);
    if (success) {
      alert('RESTORASI BERHASIL! Seluruh koleksi Firestore lokal berhasil di-overwrite dari backup.');
      setRestoreJson('');
      loadAllData();
    } else {
      alert('Restorasi Gagal. Pastikan file JSON backup valid.');
    }
  };

  // SETTINGS SAVED
  const [churchName, setChurchName] = useState(settings.churchName || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#1e3a8a');
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState(settings.mapsEmbedUrl || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [footerText, setFooterText] = useState(settings.footerText || '');
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(settings.seoDescription || '');
  const [facebook, setFacebook] = useState(settings.socialMedia?.facebook || '');
  const [instagram, setInstagram] = useState(settings.socialMedia?.instagram || '');
  const [youtube, setYoutube] = useState(settings.socialMedia?.youtube || '');
  const [tiktok, setTiktok] = useState(settings.socialMedia?.tiktok || '');
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [bankAccountNo, setBankAccountNo] = useState(settings.bankAccountNo || '');
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName || '');
  const [qrisUrl, setQrisUrl] = useState(settings.qrisUrl || '');
  const [adminWelcomeText, setAdminWelcomeText] = useState(settings.adminWelcomeText || '');
  const [adminSubText, setAdminSubText] = useState(settings.adminSubText || '');
  const [newMenuLabel, setNewMenuLabel] = useState('');

  // Ref to track last synced settings string to prevent wiping user input during polling
  const lastSettingsRef = useRef(JSON.stringify(settings));

  // Keep state synced with props ONLY when settings content has actually changed from external sources
  useEffect(() => {
    const newSettingsStr = JSON.stringify(settings);
    if (newSettingsStr !== lastSettingsRef.current) {
      lastSettingsRef.current = newSettingsStr;
      setChurchName(settings.churchName || '');
      setLogoUrl(settings.logoUrl || '');
      setBannerUrl(settings.bannerUrl || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setPrimaryColor(settings.primaryColor || '#1e3a8a');
      setMapsEmbedUrl(settings.mapsEmbedUrl || '');
      setWebsite(settings.website || '');
      setFooterText(settings.footerText || '');
      setSeoTitle(settings.seoTitle || '');
      setSeoDescription(settings.seoDescription || '');
      setFacebook(settings.socialMedia?.facebook || '');
      setInstagram(settings.socialMedia?.instagram || '');
      setYoutube(settings.socialMedia?.youtube || '');
      setTiktok(settings.socialMedia?.tiktok || '');
      setBankName(settings.bankName || '');
      setBankAccountNo(settings.bankAccountNo || '');
      setBankAccountName(settings.bankAccountName || '');
      setQrisUrl(settings.qrisUrl || '');
      setAdminWelcomeText(settings.adminWelcomeText || '');
      setAdminSubText(settings.adminSubText || '');
    }
  }, [settings]);

  const [customMenus, setCustomMenus] = useState<any[]>(() => {
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
      { id: 'admin_schedules', label: 'Kelola Jadwal Ibadah', visible: true },
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ChurchSettings = {
      ...settings,
      churchName: churchName.trim() || 'System Management Church',
      logoUrl,
      bannerUrl,
      address,
      phone,
      email,
      primaryColor,
      mapsEmbedUrl,
      website,
      footerText,
      seoTitle,
      seoDescription,
      socialMedia: {
        facebook,
        instagram,
        youtube,
        tiktok,
      },
      bankName,
      bankAccountNo,
      bankAccountName,
      qrisUrl,
      adminWelcomeText,
      adminSubText,
      customMenus,
    };
    
    lastSettingsRef.current = JSON.stringify(updated);
    MockDatabase.saveSettings(updated, currentUser);
    localStorage.setItem('church_custom_menus', JSON.stringify(customMenus));
    window.dispatchEvent(new Event('church_menus_updated'));
    window.dispatchEvent(new Event('church_db_updated'));
    onSettingsSaved(updated);
    alert('Pengaturan gereja & konfigurasi aplikasi berhasil disimpan!');
  };

  const handleResetSettings = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan seluruh Pengaturan Sistem ke konfigurasi awal (default)?")) {
      const res = MockDatabase.resetSettings(currentUser);
      setChurchName(res.churchName || '');
      setLogoUrl(res.logoUrl || '');
      setBannerUrl(res.bannerUrl || '');
      setAddress(res.address || '');
      setPhone(res.phone || '');
      setEmail(res.email || '');
      setPrimaryColor(res.primaryColor || '#1e3a8a');
      setMapsEmbedUrl(res.mapsEmbedUrl || '');
      setWebsite(res.website || '');
      setFooterText(res.footerText || '');
      setSeoTitle(res.seoTitle || '');
      setSeoDescription(res.seoDescription || '');
      setFacebook(res.socialMedia?.facebook || '');
      setInstagram(res.socialMedia?.instagram || '');
      setYoutube(res.socialMedia?.youtube || '');
      setTiktok(res.socialMedia?.tiktok || '');
      setBankName(res.bankName || '');
      setBankAccountNo(res.bankAccountNo || '');
      setBankAccountName(res.bankAccountName || '');
      setQrisUrl(res.qrisUrl || '');
      setAdminWelcomeText(res.adminWelcomeText || '');
      setAdminSubText(res.adminSubText || '');
      onSettingsSaved(res);
      window.dispatchEvent(new Event('church_db_updated'));
      alert('Pengaturan sistem berhasil dikembalikan ke default!');
    }
  };

  const handleResetMenus = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan susunan menu sidebar ke default?")) {
      localStorage.removeItem('church_custom_menus');
      const defaultList = [
        { id: 'admin_dashboard', label: 'Dashboard Admin', visible: true },
        { id: 'admin_news', label: 'Kelola Berita', visible: true },
        { id: 'admin_announcements', label: 'Kelola Pengumuman', visible: true },
        { id: 'admin_devotions', label: 'Kelola Renungan', visible: true },
        { id: 'admin_events', label: 'Kelola Event', visible: true },
        { id: 'admin_schedules', label: 'Kelola Jadwal Ibadah', visible: true },
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
      setCustomMenus(defaultList);
      window.dispatchEvent(new Event('church_menus_updated'));
      alert('Susunan menu berhasil dikembalikan ke default!');
    }
  };

  const handleSyncGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      alert("Masukkan URL Google Sheet terlebih dahulu!");
      return;
    }
    setIsSyncingSheet(true);
    setSheetSyncLogs(["Memulai sinkronisasi Google Sheet...", "Mengekstrak ID dari URL..."]);
    
    try {
      localStorage.setItem('church_sync_sheet_url', sheetUrl.trim());
      const res = await MockDatabase.syncFromGoogleSheet(sheetUrl.trim(), selectedTablesToSync);
      if (res.success) {
        const hasErrors = res.logs && res.logs.some((log: string) => log.includes("Gagal") || log.includes("tidak ditemukan"));
        setSheetSyncLogs(prev => [
          ...prev, 
          ...(res.logs || []), 
          hasErrors 
            ? "⚠ Sinkronisasi selesai dengan beberapa peringatan/error. Silakan periksa log di atas." 
            : "Sinkronisasi berhasil! Seluruh data lokal dan cloud tersinkronisasi sempurna."
        ]);
        loadAllData();
        onSettingsSaved(MockDatabase.getSettings());
        if (hasErrors) {
          alert("Sinkronisasi Google Sheet selesai dengan beberapa peringatan/error. Silakan periksa detail log.");
        } else {
          alert("Google Sheet berhasil disinkronkan!");
        }
      } else {
        setSheetSyncLogs(prev => [...prev, ...res.logs, "SINKRONISASI GAGAL!"]);
        alert("Gagal melakukan sinkronisasi Google Sheet. Silakan periksa log.");
      }
    } catch (err: any) {
      setSheetSyncLogs(prev => [...prev, `Error: ${err.message || err}`]);
      alert("Terjadi kesalahan koneksi server.");
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleConnectGDrive = async () => {
    try {
      setDomainError(null);
      const res = await signInWithGoogleDrive();
      if (res) {
        setGdriveUser(res.user);
        setGdriveToken(res.accessToken);
        setGdriveSyncLogs(prev => [...prev, `Terhubung ke: ${res.user.email}`]);
        
        setIsSyncingGDrive(true);
        setGdriveSyncLogs(prev => [...prev, "Mengecek file database di Google Drive..."]);
        const syncRes = await MockDatabase.syncWithGoogleDrive(res.accessToken, 'pull');
        if (syncRes.success) {
          setGdriveSyncLogs(prev => [...prev, "✔ Database ditemukan di Drive & berhasil dimuat ke lokal!"]);
          loadAllData();
          onSettingsSaved(MockDatabase.getSettings());
        } else {
          setGdriveSyncLogs(prev => [...prev, "Database belum ada di Drive. Mengunggah database lokal saat ini..."]);
          const pushRes = await MockDatabase.syncWithGoogleDrive(res.accessToken, 'push');
          if (pushRes.success) {
            setGdriveSyncLogs(prev => [...prev, "✔ Berhasil mencadangkan database lokal ke Drive!"]);
          } else {
            setGdriveSyncLogs(prev => [...prev, `✖ Gagal mengunggah database lokal: ${pushRes.message}`]);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setDomainError(window.location.hostname);
        setGdriveSyncLogs(prev => [
          ...prev, 
          `✖ Gagal menghubungkan ke Google Drive: Domain '${window.location.hostname}' tidak diotorisasi di Firebase.`,
          `Silakan tambahkan domain ini ke daftar Authorized Domains di Firebase Console.`
        ]);
      } else {
        setGdriveSyncLogs(prev => [...prev, `✖ Kesalahan: ${err.message || err}`]);
      }
    } finally {
      setIsSyncingGDrive(false);
    }
  };

  const handleDisconnectGDrive = async () => {
    if (window.confirm("Apakah Anda yakin ingin memutuskan hubungan dengan Google Drive?")) {
      await signOutGoogleDrive();
      setGdriveUser(null);
      setGdriveToken(null);
      setGdriveSyncLogs(prev => [...prev, "Hubungan Google Drive diputuskan."]);
    }
  };

  const handleGDriveSync = async (direction: 'pull' | 'push') => {
    let token = gdriveToken || (typeof window !== 'undefined' ? sessionStorage.getItem('gdrive_access_token') : null);
    
    // If no token exists, prompt sign in first
    if (!token) {
      setGdriveSyncLogs(prev => [
        ...prev,
        "Token Google Drive tidak ditemukan. Membuka koneksi Google Drive..."
      ]);
      try {
        const res = await signInWithGoogleDrive();
        if (res) {
          setGdriveUser(res.user);
          setGdriveToken(res.accessToken);
          token = res.accessToken;
        } else {
          return;
        }
      } catch (e: any) {
        setGdriveSyncLogs(prev => [...prev, `✖ Gagal menghubungkan Google Drive: ${e.message || e}`]);
        return;
      }
    }

    const directionWord = direction === 'pull' ? 'MENGUNDUH (PULL)' : 'MENGUNGGAH (PUSH)';

    setIsSyncingGDrive(true);
    setGdriveSyncLogs(prev => [...prev, `Memulai sinkronisasi: ${directionWord}...`]);
    try {
      let res = await MockDatabase.syncWithGoogleDrive(token, direction);
      
      // Auto-retry if token expired or 401 error
      if (!res.success && (res.message?.includes('kedaluwarsa') || res.message?.includes('expired') || res.message?.includes('401'))) {
        setGdriveSyncLogs(prev => [...prev, "⚠️ Token Google Drive kedaluwarsa. Memperbarui token otomatis..."]);
        try {
          const authRes = await signInWithGoogleDrive();
          if (authRes) {
            setGdriveUser(authRes.user);
            setGdriveToken(authRes.accessToken);
            token = authRes.accessToken;
            setGdriveSyncLogs(prev => [...prev, "✔ Token berhasil diperbarui! Melanjutkan sinkronisasi..."]);
            res = await MockDatabase.syncWithGoogleDrive(token, direction);
          }
        } catch (reAuthErr: any) {
          sessionStorage.removeItem('gdrive_access_token');
          setGdriveToken(null);
          setGdriveSyncLogs(prev => [
            ...prev,
            `✖ Gagal memperbarui token: ${reAuthErr.message || reAuthErr}. Silakan klik "Hubungkan Google Drive Saya" kembali.`
          ]);
          return;
        }
      }

      if (res.success) {
        setGdriveSyncLogs(prev => [...prev, `✔ ${res.message}`]);
        loadAllData();
        onSettingsSaved(MockDatabase.getSettings());
      } else {
        setGdriveSyncLogs(prev => [...prev, res.message.startsWith('✖') ? res.message : `✖ ${res.message}`]);
      }
    } catch (err: any) {
      setGdriveSyncLogs(prev => [...prev, `✖ Gagal: ${err.message || err}`]);
    } finally {
      setIsSyncingGDrive(false);
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setGdriveAutoSync(checked);
    localStorage.setItem('gdrive_sync_auto', String(checked));
    setGdriveSyncLogs(prev => [...prev, `Sinkronisasi Otomatis ${checked ? 'diaktifkan' : 'dinonaktifkan'}.`]);
  };

  return (
    <div className="space-y-6">
      {/* MOBILE & DESKTOP ADMIN MODULE SELECTOR BAR */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl text-xs font-black">
              ⚙️
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                Pilih Panel Pengaturan & Modul Admin
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Geser/swipe ke samping untuk berpindah panel pengaturan secara langsung
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
            {activeTab}
          </span>
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
            { id: 'admin_schedules', label: '⏰ Kelola Jadwal Ibadah' },
            { id: 'admin_devotions', label: '📖 Renungan' },
            { id: 'admin_ministries', label: '🤝 Kelola Pelayanan' },
            { id: 'admin_organizations', label: '🏢 Organisasi' },
            { id: 'admin_gallery', label: '🖼️ Kelola Galeri' },
            { id: 'admin_notifications', label: '🔔 Kirim Notifikasi' },
            { id: 'admin_comments', label: '💬 Moderasi Komentar' },
          ].map((m) => {
            const isActive = activeTab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg scale-105 ring-2 ring-amber-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm min-h-[500px]">
      {/* MODULES HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-gray-800 text-base uppercase tracking-tight">
            {activeTab.replace('admin_', 'Manajemen ').replace('_', ' ')}
          </h2>
          <p className="text-xs text-gray-400">Panel pengurus untuk memperbaharui modul</p>
        </div>
        
        {/* Dynamic add button for appropriate lists */}
        {['admin_news', 'admin_announcements', 'admin_devotions', 'admin_events', 'admin_schedules', 'admin_congregation', 'admin_users'].includes(activeTab) && !editingItem && !isCreatingNew && (
          <button
            onClick={() => {
              setIsCreatingNew(true);
              // Setup default structures
              if (activeTab === 'admin_news') {
                setEditingItem({ id: `news_${Date.now()}`, title: '', content: '', category: 'Ibadah', coverUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400', author: currentUser.name, publishDate: new Date().toISOString().split('T')[0], status: 'draft', likes: 0, views: 0, commentsCount: 0 });
              } else if (activeTab === 'admin_announcements') {
                setEditingItem({ id: `ann_${Date.now()}`, title: '', content: '', priority: 'medium', category: 'Warta', publishDate: new Date().toISOString().split('T')[0], expiryDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], isPinned: false });
              } else if (activeTab === 'admin_devotions') {
                setEditingItem({ id: `dev_${Date.now()}`, title: '', content: '', scripture: 'Yohanes 3:16', category: 'Umum', coverUrl: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400', publishDate: new Date().toISOString().split('T')[0] });
              } else if (activeTab === 'admin_events') {
                setEditingItem({ id: `evt_${Date.now()}`, title: '', content: '', bannerUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400', location: 'CMS Jakarta', dateTime: new Date().toISOString().slice(0, 16), countdownDate: new Date().toISOString(), quota: 100, registeredCount: 0, status: 'upcoming', isRegistrationOpen: true });
              } else if (activeTab === 'admin_schedules') {
                setEditingItem({ id: `sch_${Date.now()}`, sessionName: 'Sesi I (Pagi)', title: '', time: '07.00 WIB', speaker: '', worshipLeader: '', location: 'Main Sanctuary (Lt. 1)', category: 'Ibadah Raya', dateDay: 'Setiap Hari Minggu', isOnline: false, notes: '' });
              } else if (activeTab === 'admin_congregation') {
                setEditingItem({ id: `cong_${Date.now()}`, name: '', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', address: '', phone: '', email: '', isBaptized: true, isMarried: false, familyMembers: 'Lajang', commission: 'Pemuda', ministry: 'Praise Worship', joinDate: new Date().toISOString().split('T')[0] });
              } else if (activeTab === 'admin_users') {
                setEditingItem({ id: `usr_${Date.now()}`, email: '', name: '', role: 'JEMAAT', password: 'church123', phone: '', komisi: '', joinDate: new Date().toISOString().split('T')[0] });
              }
            }}
            className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Baru
          </button>
        )}
      </div>

      {/* FORM MODE */}
      {editingItem && ['admin_news', 'admin_announcements', 'admin_devotions', 'admin_events', 'admin_schedules', 'admin_congregation', 'admin_users'].includes(activeTab) && (
        <div className="animate-fade-in max-w-xl mx-auto bg-gray-50/50 border border-gray-100 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display font-semibold text-gray-800 text-sm">
              {isCreatingNew ? 'Buat Entri Baru' : 'Edit Entri'}
            </h3>
            <button
              onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          </div>

          {/* DYNAMIC FORMS ACCORDING TO TAB */}
          {activeTab === 'admin_news' && (
            <form onSubmit={handleSaveNews} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Judul Berita</label>
                <input type="text" required value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Konten Berita</label>
                <textarea required value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-32 p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kategori</label>
                  <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Status</label>
                  <select value={editingItem.status} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                    <option value="draft">Draft (Arsip)</option>
                    <option value="published">Publish (Publik)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">URL Cover Image</label>
                <input type="text" value={editingItem.coverUrl} onChange={(e) => setEditingItem({ ...editingItem, coverUrl: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl">Simpan Berita</button>
            </form>
          )}

          {activeTab === 'admin_announcements' && (
            <form onSubmit={handleSaveAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Judul Pengumuman</label>
                <input type="text" required value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Konten Warta</label>
                <textarea required value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-24 p-2.5 bg-white border border-gray-200 rounded-xl text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Prioritas</label>
                  <select value={editingItem.priority} onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value as any })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                    <option value="low">Rendah (Low)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="high">Penting (High)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kategori</label>
                  <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" checked={editingItem.isPinned} onChange={(e) => setEditingItem({ ...editingItem, isPinned: e.target.checked })} className="rounded" />
                <label htmlFor="pinned" className="text-xs text-gray-600">Sematkan di Atas (Pin Announcement)</label>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl">Simpan Warta</button>
            </form>
          )}

          {activeTab === 'admin_devotions' && (
            <form onSubmit={handleSaveDevotion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Judul Renungan</label>
                <input type="text" required value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Ayat Alkitab</label>
                  <input type="text" value={editingItem.scripture} onChange={(e) => setEditingItem({ ...editingItem, scripture: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kategori</label>
                  <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Ulasan Naskah Renungan</label>
                <textarea required value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-32 p-2.5 bg-white border border-gray-200 rounded-xl text-xs resize-none" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl">Simpan Renungan</button>
            </form>
          )}

          {activeTab === 'admin_events' && (
            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Judul Event / Seminar</label>
                <input type="text" required value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Deskripsi Acara</label>
                <textarea required value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-24 p-2.5 bg-white border border-gray-200 rounded-xl text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Lokasi Fisik</label>
                  <input type="text" value={editingItem.location} onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Tanggal & Jam</label>
                  <input type="datetime-local" value={editingItem.dateTime} onChange={(e) => setEditingItem({ ...editingItem, dateTime: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Kuota Maksimal (Jemaat)</label>
                  <input type="number" value={editingItem.quota} onChange={(e) => setEditingItem({ ...editingItem, quota: parseInt(e.target.value) })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Status Pendaftaran</label>
                  <select value={editingItem.isRegistrationOpen ? 'open' : 'closed'} onChange={(e) => setEditingItem({ ...editingItem, isRegistrationOpen: e.target.value === 'open' })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                    <option value="open">Dibuka (Registration Open)</option>
                    <option value="closed">Ditutup</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl">Simpan Event</button>
            </form>
          )}

          {activeTab === 'admin_schedules' && (
            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Nama Sesi / Label</label>
                  <input
                    type="text"
                    required
                    value={editingItem.sessionName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, sessionName: e.target.value })}
                    placeholder="Contoh: Sesi I (Pagi)"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Nama / Judul Ibadah</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Contoh: Ibadah Raya 1"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    required
                    value={editingItem.time || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                    placeholder="Contoh: 07.00 WIB"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Hari / Rutinitas</label>
                  <input
                    type="text"
                    value={editingItem.dateDay || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, dateDay: e.target.value })}
                    placeholder="Contoh: Setiap Hari Minggu"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Pembicara / Pengkhotbah</label>
                  <input
                    type="text"
                    value={editingItem.speaker || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, speaker: e.target.value })}
                    placeholder="Contoh: Pdt. Dr. Samuel Wijaya"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Petugas WL</label>
                  <input
                    type="text"
                    value={editingItem.worshipLeader || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, worshipLeader: e.target.value })}
                    placeholder="Contoh: Sdr. David Haryono"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">Lokasi / Ruangan</label>
                <input
                  type="text"
                  value={editingItem.location || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  placeholder="Contoh: Main Sanctuary (Lt. 1)"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Kategori</label>
                  <select
                    value={editingItem.category || 'Ibadah Raya'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="Ibadah Raya">Ibadah Raya</option>
                    <option value="Pemuda">Pemuda (Youth)</option>
                    <option value="Sekolah Minggu">Sekolah Minggu</option>
                    <option value="Persekutuan">Persekutuan / Doa</option>
                    <option value="Khusus">Ibadah Khusus</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isOnlineCheckAdmin"
                    checked={!!editingItem.isOnline}
                    onChange={(e) => setEditingItem({ ...editingItem, isOnline: e.target.checked })}
                    className="w-4 h-4 rounded text-brand border-gray-300"
                  />
                  <label htmlFor="isOnlineCheckAdmin" className="text-xs font-semibold text-gray-700">Live Streaming Online</label>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">Simpan Jadwal Ibadah</button>
            </form>
          )}

          {activeTab === 'admin_congregation' && (
            <form onSubmit={handleSaveCongregation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Nama Lengkap Jemaat</label>
                  <input type="text" required value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Nomor Telepon</label>
                  <input type="tel" required value={editingItem.phone} onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Alamat Email</label>
                  <input type="email" value={editingItem.email} onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Alamat Tempat Tinggal</label>
                  <input type="text" value={editingItem.address} onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Komisi</label>
                  <select value={editingItem.commission} onChange={(e) => setEditingItem({ ...editingItem, commission: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                    <option value="Anak">Anak</option>
                    <option value="Remaja">Remaja</option>
                    <option value="Pemuda">Pemuda</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Pria">Pria</option>
                    <option value="Lansia">Lansia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Baptis</label>
                  <select value={editingItem.isBaptized ? 'yes' : 'no'} onChange={(e) => setEditingItem({ ...editingItem, isBaptized: e.target.value === 'yes' })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                    <option value="yes">Sudah Baptis</option>
                    <option value="no">Belum Baptis</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl">Simpan Anggota Jemaat</button>
            </form>
          )}

          {activeTab === 'admin_users' && (
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Nama Lengkap</label>
                  <input type="text" required value={editingItem.name || ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Role / Hak Akses</label>
                  <select value={editingItem.role || 'JEMAAT'} onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value as Role })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand">
                    <option value="JEMAAT">JEMAAT (Member)</option>
                    <option value="ADMIN">ADMIN (Staff/Pelayan)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Pastor/Majelis)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Email / Username Login</label>
                  <input type="email" required value={editingItem.email || ''} onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Kata Sandi / Password</label>
                  <input type="text" required placeholder="Sandi login (contoh: church123)" value={editingItem.password || ''} onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-brand" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">No. Telepon / WhatsApp</label>
                  <input type="tel" value={editingItem.phone || ''} onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Komisi Pelayanan / Bidang</label>
                  <input type="text" placeholder="e.g., Pemuda, Multimedia, Majelis" value={editingItem.komisi || ''} onChange={(e) => setEditingItem({ ...editingItem, komisi: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-brand-dark transition-colors">Simpan Akun Pengguna</button>
            </form>
          )}
        </div>
      )}

      {/* LIST VIEWS */}
      {!editingItem && ['admin_news', 'admin_announcements', 'admin_devotions', 'admin_events', 'admin_congregation', 'admin_users'].includes(activeTab) && (
        <div className="space-y-4">
          {/* Kelola Berita List */}
          {activeTab === 'admin_news' && (
            <div className="space-y-3">
              {news.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4 transition-colors">
                  <div className="min-w-0">
                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
                    <h4 className="font-semibold text-gray-800 text-sm mt-1 truncate">{item.title}</h4>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Penulis: {item.author} | Status: <strong className="uppercase">{item.status}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-teal-50 hover:text-brand border border-gray-100 hover:border-teal-200 text-gray-500 rounded-xl transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteNews(item.id)} className="p-2 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-100 hover:border-red-200 text-gray-500 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kelola Pengumuman List */}
          {activeTab === 'admin_announcements' && (
            <div className="space-y-3">
              {anns.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.isPinned && <span className="bg-amber-500 text-slate-950 font-extrabold text-[8px] px-1.5 py-0.25 rounded">PIN</span>}
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mt-1 truncate">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-teal-50 hover:text-brand border border-gray-100 text-gray-500 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteAnnouncement(item.id)} className="p-2 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-100 text-gray-500 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kelola Renungan List */}
          {activeTab === 'admin_devotions' && (
            <div className="space-y-3">
              {devs.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] bg-brand-light text-brand px-2 py-0.5 rounded font-bold uppercase">{item.scripture}</span>
                    <h4 className="font-semibold text-gray-800 text-sm mt-1 truncate">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-teal-50 hover:text-brand border border-gray-100 text-gray-500 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteDevotion(item.id)} className="p-2 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-100 text-gray-500 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kelola Event List + Checkin Attendee Panel */}
          {activeTab === 'admin_events' && (
            <div className="space-y-6">
              {/* Manual Ticket Presensi QR Check-in Simulation */}
              <div className="bg-amber-50/20 border border-amber-100/50 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <h3 className="font-display font-bold text-gray-800 text-sm">Validasi & Presensi Kehadiran Event (Check-In)</h3>
                </div>
                <p className="text-xs text-gray-500">Gunakan scanner tiket virtual untuk melakukan validasi presensi kehadiran jemaat ke lokasi event.</p>
                <form onSubmit={handleManualCheckIn} className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan ID Tiket Registrasi (e.g. reg_1)"
                    value={manualCheckinId}
                    onChange={(e) => setManualCheckinId(e.target.value)}
                    className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:border-brand"
                  />
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Check-In
                  </button>
                </form>
              </div>

              {/* Event lists */}
              <div className="space-y-3">
                {events.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{item.status}</span>
                      <h4 className="font-semibold text-gray-800 text-sm mt-1 truncate">{item.title}</h4>
                      <span className="text-[10px] text-gray-400">Terdaftar: {item.registeredCount} / {item.quota} jemaat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedEventIdForRegistrants(item.id);
                          const regs = MockDatabase.getEventRegistrations();
                          setEventRegs(regs.filter((r) => r.eventId === item.id));
                        }}
                        className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-gray-100 rounded-xl text-xs flex items-center gap-1"
                        title="Lihat Daftar Peserta Terdaftar"
                      >
                        <Eye className="w-3.5 h-3.5" /> Peserta
                      </button>
                      <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-teal-50 border border-gray-100 text-gray-500 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteEvent(item.id)} className="p-2 bg-white hover:bg-red-50 border border-gray-100 text-gray-500 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Registrants display drawer-like subview */}
              {selectedEventIdForRegistrants && (
                <div className="p-5 bg-blue-50/10 border border-blue-100/30 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="font-display font-semibold text-gray-800 text-xs uppercase">Daftar Pendaftar Terkonfirmasi:</h4>
                    <button onClick={() => setSelectedEventIdForRegistrants(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Tutup Detail</button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {eventRegs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Belum ada jemaat mendaftar untuk event ini.</p>
                    ) : (
                      eventRegs.map((reg) => (
                        <div key={reg.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{reg.userName}</p>
                            <p className="text-[10px] text-gray-400">{reg.userEmail} | WA: {reg.phone}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                              reg.attended ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {reg.attended ? 'Sudah Presensi' : 'Belum Presensi'}
                            </span>
                            <span className="font-mono text-[9px] text-gray-400">ID: {reg.id}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Kelola Jadwal Ibadah */}
          {activeTab === 'admin_schedules' && !editingItem && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-900 uppercase">Jadwal Ibadah Terhubung</h4>
                  <p className="text-[11px] text-amber-700">Perubahan jadwal di sini akan langsung diperbarui pada Dashboard Jemaat.</p>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingNew(true);
                    setEditingItem({
                      id: `sch_${Date.now()}`,
                      sessionName: 'Sesi Baru',
                      title: 'Ibadah Raya',
                      time: '07.00 WIB',
                      speaker: 'Pdt. Dr. Samuel Wijaya',
                      worshipLeader: 'Sdr. David Haryono',
                      location: 'Main Sanctuary (Lt. 1)',
                      category: 'Ibadah Raya',
                      dateDay: 'Setiap Hari Minggu',
                      isOnline: false,
                      notes: ''
                    });
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 bg-brand text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-brand-dark transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Jadwal
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-400">Belum ada jadwal ibadah. Klik "Tambah Jadwal" untuk membuat baru.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.map((sch) => (
                    <div key={sch.id} className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3 shadow-sm hover:border-brand transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-md uppercase">
                            {sch.sessionName}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {sch.dateDay || 'Minggu'}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-gray-800 text-sm">{sch.title}</h3>
                        <p className="text-xl font-bold font-mono text-brand">{sch.time}</p>
                        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                          {sch.speaker && <p><strong>Pengkhotbah:</strong> {sch.speaker}</p>}
                          {sch.worshipLeader && <p><strong>WL:</strong> {sch.worshipLeader}</p>}
                          {sch.location && <p><strong>Lokasi:</strong> {sch.location}</p>}
                          {sch.isOnline && <p className="text-emerald-600 font-bold">✔ Live Streaming</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditingItem(sch);
                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-600 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kelola Jemaat Database */}
          {activeTab === 'admin_congregation' && (
            <div className="space-y-6">
              {/* Import/Export Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-teal-50/10 border border-teal-100/40 rounded-2xl space-y-2">
                  <h4 className="font-display font-bold text-gray-800 text-xs">Simulasi Impor Excel / JSON</h4>
                  <p className="text-[10px] text-gray-400">Tempel baris teks/JSON data jemaat untuk dimasukkan serentak ke database.</p>
                  <form onSubmit={handleImportCongregation} className="space-y-2">
                    <textarea
                      placeholder='e.g. [{"name": "Yohanes", "phone": "081223", "commission": "Pemuda"}]'
                      value={excelImportJson}
                      onChange={(e) => setExcelImportJson(e.target.value)}
                      className="w-full h-12 p-2 bg-white border border-gray-200 rounded-xl text-[10px] font-mono resize-none"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-brand text-white font-bold text-[10px] rounded-lg flex items-center gap-1.5">
                      <Upload className="w-3 h-3" /> Impor Database
                    </button>
                  </form>
                </div>

                <div className="p-4 bg-amber-50/10 border border-amber-100/40 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-gray-800 text-xs">Ekspor Database Jemaat</h4>
                    <p className="text-[10px] text-gray-400">Download seluruh database jemaat CMS dalam format file JSON/Excel terstruktur untuk kebutuhan cetak kartu atau pelaporan.</p>
                  </div>
                  <button onClick={handleExportCongregation} className="mt-3 w-max px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Ekspor ke Excel/JSON
                  </button>
                </div>
              </div>

              {/* Congregation Table List */}
              <div className="space-y-3">
                {congs.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.photoUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-semibold text-gray-800 text-xs">{item.name}</h4>
                        <span className="text-[9px] text-gray-400">{item.commission} | WA: {item.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-teal-50 border border-gray-100 text-gray-500 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCongregation(item.id)} className="p-2 bg-white hover:bg-red-50 border border-gray-100 text-gray-500 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kelola Akun & Sandi List */}
          {activeTab === 'admin_users' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-2xl flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed">
                    Sistem Manajemen Akun & Hak Akses. Pengurus dapat mengelola username (email), mengubah kata sandi, meriset akses, dan mengatur peran (Super Admin, Admin Staff, Jemaat) secara langsung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Atur ulang kata sandi seluruh akun pengguna ke standar "church123"?')) {
                      users.forEach((u) => {
                        MockDatabase.saveUser({ ...u, password: 'church123' }, currentUser);
                      });
                      loadAllData();
                      alert('Berhasil mengatur ulang seluruh kata sandi pengguna ke "church123"!');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl shadow-sm transition-all flex-shrink-0 cursor-pointer"
                >
                  🔄 Reset Semua Sandi ke Standar
                </button>
              </div>

              <div className="space-y-3">
                {users.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 uppercase">
                        {item.name ? item.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-800 text-xs">{item.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                            item.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.role}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4 text-[10px] text-gray-500">
                          <span><strong>Email / Username:</strong> <code className="text-slate-800 font-mono font-medium">{item.email}</code></span>
                          <span><strong>Kata Sandi:</strong> <code className="bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-amber-700 font-mono font-bold select-all">{item.password || 'church123'}</code></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          const newPassword = prompt(`Masukkan kata sandi baru untuk ${item.name} (${item.email}):`, item.password || 'church123');
                          if (newPassword !== null && newPassword.trim() !== '') {
                            MockDatabase.saveUser({ ...item, password: newPassword.trim() }, currentUser);
                            loadAllData();
                            alert(`Kata sandi untuk ${item.name} berhasil diperbarui menjadi "${newPassword.trim()}"!`);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                        title="Atur Ulang Kata Sandi"
                      >
                        🔑 Ganti Sandi
                      </button>
                      <button onClick={() => setEditingItem(item)} className="p-2 bg-white hover:bg-blue-50 border border-gray-100 text-gray-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-colors cursor-pointer" title="Edit Data Akun"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteUser(item.id)} className="p-2 bg-white hover:bg-red-50 border border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-200 rounded-xl transition-colors cursor-pointer" title="Hapus Akun"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Moderasi Komentar */}
          {activeTab === 'admin_comments' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  Sistem moderasi aktif. Semua komentar bernada negatif atau SPAM promosi komersial wajib di-REJECT atau dimasukkan ke daftar SPAM agar terhapus otomatis demi menjaga kekudusan portal.
                </p>
              </div>

              <div className="space-y-3">
                {comms.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 text-xs">Tidak ada komentar baru masuk.</p>
                ) : (
                  comms.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-gray-800 font-semibold">{item.userName}</strong>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Pada: {item.targetTitle} ({item.targetType})</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${
                          item.status === 'approved' ? 'bg-green-50 text-green-700' : item.status === 'spam' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-mono">"{item.content}"</p>

                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2 justify-end">
                        {item.status !== 'approved' && (
                          <button onClick={() => handleModerateComment(item.id, 'approved')} className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-100 flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                        )}
                        {item.status !== 'spam' && (
                          <button onClick={() => handleModerateComment(item.id, 'spam')} className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Spam</button>
                        )}
                        <button onClick={() => { if (confirm('Hapus komentar ini selamanya?')) MockDatabase.deleteComment(item.id, currentUser); loadAllData(); }} className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-bold rounded-lg">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Kirim Notifikasi FCM Broadcast */}
          {activeTab === 'admin_notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 border border-gray-100 rounded-2xl space-y-4 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand" />
                  <h3 className="font-display font-bold text-gray-800 text-sm">Kirim Broadcast Notifikasi (FCM)</h3>
                </div>
                <p className="text-xs text-gray-500">Kirimkan notifikasi push secara langsung ke ponsel seluruh jemaat.</p>

                <form onSubmit={handleBroadcastNotification} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Judul Notifikasi</label>
                    <input type="text" required value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Pembagian Warta Jemaat Paskah" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Konten Notifikasi</label>
                    <textarea required value={notifContent} onChange={(e) => setNotifContent(e.target.value)} placeholder="Tuliskan pesan singkat..." className="w-full h-24 p-2.5 bg-white border border-gray-200 rounded-xl text-xs resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Grup Target Penerima</label>
                    <select value={notifTargetGroup} onChange={(e) => setNotifTargetGroup(e.target.value as any)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs">
                      <option value="all">Seluruh Jemaat & Admin (Semua)</option>
                      <option value="jemaat">Hanya Jemaat Saja</option>
                      <option value="admin">Hanya Pengurus (Admin/Superadmin)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl shadow-sm">Kirim Broadcast Sekarang</button>
                </form>
              </div>

              {/* Log/Notifikasi Terkirim */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-gray-800 text-xs uppercase tracking-wide">
                    Riwayat Notifikasi Terkirim ({notifs.length})
                  </h4>
                  {notifs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat notifikasi terkirim? Notifikasi tidak akan lagi muncul di dashboard jemaat.')) {
                          MockDatabase.clearAllNotifications(currentUser);
                          loadAllData();
                        }
                      }}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus Semua
                    </button>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
                  {notifs.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-xs">Belum ada riwayat notifikasi terkirim.</p>
                  ) : (
                    notifs.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white border border-gray-100 rounded-2xl space-y-1 hover:border-teal-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-400">{new Date(item.sentDate).toLocaleDateString('id-ID')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] bg-teal-50 text-brand px-1.5 py-0.25 rounded font-extrabold uppercase">Target: {item.targetGroup}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus notifikasi "${item.title}"? Notifikasi ini akan dihapus dari seluruh dashboard jemaat.`)) {
                                  MockDatabase.deleteNotification(item.id, currentUser);
                                  loadAllData();
                                }
                              }}
                              title="Hapus Notifikasi Ini"
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-xs leading-snug">{item.title}</h4>
                        <p className="text-[11px] text-gray-500">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Backup & Restore Database */}
          {activeTab === 'admin_backup' && currentUser.role === 'SUPER_ADMIN' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Panel */}
              <div className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-600" />
                    <h3 className="font-display font-bold text-gray-800 text-sm">Backup Firestore Database (JSON)</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Unduh file kompresi JSON cadangan database Firestore yang mencakup seluruh koleksi: data jemaat, pengumuman, renungan, komentar, presensi, warta, serta pengaturan sistem gereja secara lengkap. Simpan cadangan ini di lokasi fisik yang aman.
                  </p>
                </div>
                <button onClick={handleDownloadFullBackup} className="w-max px-4 py-2.5 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm">
                  <Download className="w-3.5 h-3.5" /> Ambil Backup Database
                </button>
              </div>

              {/* Restore Panel */}
              <div className="p-5 border border-gray-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-display font-bold text-gray-800 text-sm">Restore & Overwrite Database</h3>
                </div>
                <p className="text-xs text-gray-500">Tindakan ini sangat sensitif. Menempelkan data JSON cadangan lama akan meng-overwrite dan mengganti seluruh isi database CMS Anda secara instan.</p>
                <form onSubmit={handleRestoreDatabase} className="space-y-3">
                  <textarea
                    required
                    placeholder="Tempel teks JSON cadangan di sini untuk merestorasi..."
                    value={restoreJson}
                    onChange={(e) => setRestoreJson(e.target.value)}
                    className="w-full h-24 p-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-mono resize-none focus:border-red-500"
                  />
                  <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Jalankan Restorasi Database
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Pengaturan Sistem */}
          {activeTab === 'admin_settings' && (
            <div className="space-y-8">
              {/* EXPLANATION & SYNC CARD FOR DESKTOP VS MOBILE */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-5 rounded-3xl border border-indigo-500/30 space-y-3 shadow-md max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-200">
                    Petunjuk Sinkronisasi Data Komputer vs HP Android
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Aplikasi ini berjalan sebagai <strong>Web App / PWA</strong> di hosting GitHub Pages.
                </p>
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-[11px] text-slate-300 space-y-2">
                  <p className="font-bold text-amber-400">💡 Kenapa data di Komputer & HP berbeda saat pertama dibuka?</p>
                  <p className="text-slate-300 leading-snug">
                    Secara default, browser Komputer dan HP Android menyimpan data secara lokal di perangkat masing-masing (<i>localStorage</i>).
                  </p>
                  <p className="font-bold text-emerald-400 mt-2">🚀 Cara Menyamakan Data Komputer & HP Android (2 Cara Mudah):</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li>
                      <strong>Cara 1 (Instan via Backup/Restore JSON):</strong>
                      <br />
                      Di Komputer: Masuk ke panel <i>Backup & Restore</i>, klik <strong>"Ambil Backup Database"</strong>.
                      <br />
                      Di HP Android: Buka web ini, masuk ke panel <i>Backup & Restore</i>, lalu jalankan <strong>"Restorasi Database"</strong>. Seluruh data jemaat, berita, & akun langsung sama 100%!
                    </li>
                    <li>
                      <strong>Cara 2 (Live Cloud Sync via Google Sheet):</strong>
                      <br />
                      Gunakan panel <i>Sinkronisasi Google Sheet</i> di bawah ini untuk menghubungkan spreadsheet online.
                    </li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Nama Organisasi / Gereja Resmi</label>
                  <input type="text" value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="Contoh: SYSTEM MANAGEMENT CHURCH (CMS)" className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand font-bold text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Konfigurasi Warna Tema (Hex)</label>
                  <div className="flex gap-2">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 border border-gray-200 rounded-xl cursor-pointer" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand font-mono" />
                  </div>
                </div>
              </div>

              {/* Welcome Banner Customization */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <Megaphone className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Kustomisasi Banner Selamat Datang (Admin)</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Judul Sapaan (Welcome Heading)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Selamat Datang, Pnt. Budi Santoso!"
                      value={adminWelcomeText}
                      onChange={(e) => setAdminWelcomeText(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5">Jika dikosongkan, sapaan dinamis default sesuai nama akun login Anda akan digunakan.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Subteks Deskripsi Banner</label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan subteks pengantar untuk sistem pelayanan..."
                      value={adminSubText}
                      onChange={(e) => setAdminSubText(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Logo Gereja</label>
                  
                  {/* Preview Area */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-800 truncate">Logo Aktif</p>
                      <span className="text-[8px] font-mono text-indigo-600 block mt-0.5 truncate">
                        {logoUrl && logoUrl.startsWith('data:') ? 'Offline/File Lokal (Base64)' : (logoUrl || 'Belum diunggah')}
                      </span>
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="offline-logo-file-input"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImageFile(file, 250, 250, 0.85);
                          if (compressed) {
                            setLogoUrl(compressed);
                          }
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <label
                        htmlFor="offline-logo-file-input"
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white font-bold text-center text-[10px] rounded-xl cursor-pointer hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10"
                      >
                        <Upload className="w-3.5 h-3.5" /> Unggah Offline (Pilih File)
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-bold rounded-xl transition-all"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* URL Input Fallback */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Atau masukkan Link/URL logo</label>
                    <input
                      type="text"
                      placeholder="https://domain.com/logo.png"
                      value={logoUrl || ''}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-xl text-[10px] bg-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Banner Website Utama</label>
                  
                  {/* Banner Preview Area */}
                  <div className="relative w-full h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="text-[9px] text-slate-400">Belum ada banner diset</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="offline-banner-file-input"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImageFile(file, 800, 400, 0.85);
                          if (compressed) {
                            setBannerUrl(compressed);
                          }
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <label
                        htmlFor="offline-banner-file-input"
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white font-bold text-center text-[10px] rounded-xl cursor-pointer hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10"
                      >
                        <Upload className="w-3.5 h-3.5" /> Unggah Banner (File Gambar)
                      </label>
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerUrl('')}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-bold rounded-xl transition-all"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Atau masukkan Link/URL Banner</label>
                    <input type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full p-2 border border-gray-200 rounded-xl text-[10px] bg-white font-mono" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Alamat Kantor Sekretariat</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Masukkan alamat lengkap..." className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Telepon Kantor</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 031-8681234" className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email Resmi</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@gereja.org" className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Website Resmi (URL)</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.gereja.org" className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Link Google Maps Embed (Iframe Src)</label>
                  <input type="text" value={mapsEmbedUrl} onChange={(e) => setMapsEmbedUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Teks Hak Cipta / Footer</label>
                  <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="© 2026 Hak Cipta Dilindungi." className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white" />
                </div>
              </div>

              {/* SEO & Informational Meta Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">SEO & Informasi Portal</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Judul SEO Website (Title)</label>
                    <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Sistem Informasi Management Gereja (CMS)" className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Deskripsi Ringkas Portal (SEO)</label>
                    <input type="text" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Deskripsi portal informasi pelayanan jemaat..." className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white" />
                  </div>
                </div>
              </div>

              {/* Media Sosial Section */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                <span className="text-xs font-bold uppercase text-blue-900 tracking-wider">Tautan Media Sosial Resmi</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Instagram</label>
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">YouTube</label>
                    <input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Facebook</label>
                    <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">TikTok</label>
                    <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono" />
                  </div>
                </div>
              </div>

              {/* Rekening & Donasi Settings Section */}
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-4">
                <div className="flex items-center gap-2 text-indigo-900">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-display font-bold text-xs uppercase tracking-wide">Pengaturan Kas / Rekening Donasi</h4>
                </div>
                <p className="text-[10px] text-slate-500">Konfigurasikan detail bank transfer dan QRIS donasi yang akan ditampilkan di halaman Kas/Donasi Jemaat secara dinamis.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nama Bank Resmi</label>
                    <input type="text" placeholder="Contoh: BCA (Bank Central Asia)" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nomor Rekening Kas</label>
                    <input type="text" placeholder="Contoh: 8290123456" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Atas Nama Rekening</label>
                    <input type="text" placeholder="Contoh: KAS GEREJA" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:border-brand" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Gambar / Link QRIS Donasi</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="offline-qris-file-input"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImageFile(file, 400, 400, 0.85);
                          if (compressed) setQrisUrl(compressed);
                        }
                      }}
                    />
                    <label
                      htmlFor="offline-qris-file-input"
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Unggah File QRIS
                    </label>
                    <input type="text" placeholder="Atau paste URL QRIS: https://..." value={qrisUrl} onChange={(e) => setQrisUrl(e.target.value)} className="flex-1 w-full p-2 border border-gray-200 rounded-xl text-xs bg-white focus:border-indigo-500 font-mono" />
                    {qrisUrl && (
                      <button
                        type="button"
                        onClick={() => setQrisUrl('')}
                        className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-xl"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Kustomisasi Menu Sidebar Admin */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide">Kustomisasi Menu Sidebar Admin & Navigasi</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetMenus}
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-bold bg-amber-100/70 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/60 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    ↺ Reset Susunan Menu
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Atur visibilitas, ubah nama tampilan, atau tambah/hapus menu kustom pada navigasi aplikasi.</p>

                {/* Form Tambah Menu Baru */}
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Sebutkan Nama Menu Baru..."
                    value={newMenuLabel}
                    onChange={(e) => setNewMenuLabel(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMenuLabel.trim()) return;
                      const newId = 'custom_' + Date.now();
                      setCustomMenus(prev => [...prev, { id: newId, label: newMenuLabel.trim(), visible: true }]);
                      setNewMenuLabel('');
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    + Tambah Menu
                  </button>
                </div>
                
                <div className="space-y-3">
                  {customMenus.map((menu, idx) => {
                    const isRequired = menu.id === 'admin_settings' || menu.id === 'admin_dashboard';
                    return (
                      <div key={menu.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-150 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isRequired ? true : (menu.visible !== false)}
                            disabled={isRequired}
                            onChange={(e) => {
                              if (isRequired) return;
                              const updated = [...customMenus];
                              updated[idx] = { ...menu, visible: e.target.checked };
                              setCustomMenus(updated);
                            }}
                            className={`w-4 h-4 text-brand focus:ring-brand border-slate-300 rounded cursor-pointer ${isRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <span className="text-xs font-bold text-slate-700 font-mono text-[10px] uppercase">
                            {menu.id.replace('admin_', '').replace('jemaat_', '').replace('_', ' ')}
                          </span>
                          {isRequired && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                              Wajib Aktif
                            </span>
                          )}
                        </div>
                      
                      <div className="flex-1 max-w-xs flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Nama Tampilan:</span>
                        <input
                          type="text"
                          value={menu.label || ''}
                          onChange={(e) => {
                            const updated = [...customMenus];
                            updated[idx] = { ...menu, label: e.target.value };
                            setCustomMenus(updated);
                          }}
                          className="w-full p-1.5 px-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 font-semibold text-slate-700"
                        />
                        {!isRequired && (
                          <button
                            type="button"
                            title="Hapus Menu Ini"
                            onClick={() => {
                              setCustomMenus(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Simpan Konfigurasi Pengaturan
                </button>
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Ke Default
                </button>
              </div>
            </form>

            {/* Google Drive Database Sync */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/40 p-6 rounded-3xl border border-indigo-150 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-indigo-900">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-display font-bold text-sm uppercase tracking-wide">SINKRONISASI DATABASE GOOGLE DRIVE</h4>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Durable Cloud Storage
                </span>
              </div>

              <div className="text-[11px] text-indigo-800 leading-relaxed space-y-2 bg-white/70 p-4 rounded-2xl border border-indigo-100/50">
                <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-900 mb-1">
                  Integrasi Google Drive CMS:
                </p>
                <p>
                  Dengan fitur sinkronisasi ini, seluruh database gereja disimpan langsung ke dalam folder Google Drive pribadi Anda. Data akan tetap singkron secara real-time dan dapat diakses dari mana saja tanpa takut kehilangan perubahan.
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-2 mt-2">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Folder Google Drive Tujuan</span>
                    <a 
                      href="https://drive.google.com/drive/folders/1tfovDIcwAopsjXPn8Kxb1wWF9u0VXzrU?usp=sharing" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-semibold text-indigo-600 hover:underline truncate block"
                    >
                      https://drive.google.com/drive/folders/1tfovDIcwAopsjXPn8Kxb1wWF9u0VXzrU?usp=sharing
                    </a>
                  </div>
                  <span className="text-[9px] bg-slate-200 text-slate-700 p-1 px-2 rounded-lg font-mono">
                    ID: 1tfovDIcw...
                  </span>
                </div>
              </div>

              {/* Status and Action Panel */}
              <div className="p-4 rounded-2xl border bg-white shadow-sm">
                {!gdriveUser ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-slate-500 font-medium">Anda belum menghubungkan akun Google Drive untuk menyimpan database gereja.</p>
                    <button
                      type="button"
                      onClick={handleConnectGDrive}
                      disabled={isSyncingGDrive}
                      className="mx-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all active:scale-[0.98] shadow-md shadow-indigo-200 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Hubungkan Google Drive Saya
                    </button>

                    {domainError && (
                      <div className="mt-4 p-4 text-left border border-amber-200 bg-amber-50/50 rounded-2xl text-xs text-amber-900 space-y-3">
                        <div className="flex items-start gap-2 text-amber-800">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <p className="font-bold uppercase tracking-wider text-[10px] text-amber-950">
                              Error: Domain Belum Diotorisasi di Firebase
                            </p>
                            <p className="mt-1 leading-relaxed text-[11px] text-amber-800 font-sans">
                              Agar sinkronisasi Google Drive dapat berjalan lancar di server container (Cloud Run), domain aplikasi ini harus ditambahkan ke daftar <strong>Authorized Domains</strong> di konsol Firebase proyek Anda.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-2">
                          <p className="font-bold text-[10px] text-amber-950 uppercase tracking-wider">
                            Langkah Penyelesaian:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 font-sans">
                            <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold hover:text-indigo-700">Firebase Console</a> Anda.</li>
                            <li>Pilih proyek <strong>{firebaseConfig.projectId}</strong>.</li>
                            <li>Buka menu <strong>Build</strong> &gt; <strong>Authentication</strong> &gt; tab <strong>Settings</strong> &gt; bagian <strong>Authorized domains</strong>.</li>
                            <li>Klik tombol <strong>Add domain</strong>, lalu masukkan domain di bawah ini:</li>
                          </ol>

                          <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded-lg flex items-center justify-between gap-2 border border-slate-800">
                            <code className="font-mono text-[11px] select-all text-amber-300 truncate flex-1 block pl-1">
                              {domainError}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(domainError);
                                alert("Domain berhasil disalin!");
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded text-white transition-colors cursor-pointer shrink-0"
                            >
                              Salin
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-amber-700 mt-1 font-sans">
                            Setelah menambahkan domain di atas di Firebase Console, silakan muat ulang halaman ini dan klik tombol <strong>Hubungkan Google Drive Saya</strong> kembali.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Google Cloud Console Test User / OAuth Consent Screen Guide */}
                    <div className="mt-4 p-4 text-left border border-indigo-100 bg-indigo-50/30 rounded-2xl space-y-3">
                      <div className="flex items-start gap-2 text-indigo-950">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-indigo-600" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-950">
                            PENTING: Solusi "Access Blocked / Error 403: access_denied"
                          </p>
                          <p className="mt-1 leading-relaxed text-[11px] text-indigo-800 font-sans">
                            Karena proyek Google Cloud/Firebase ini baru dan berstatus <strong>Testing (Uji Coba)</strong>, Anda harus mendaftarkan alamat email Anda ke daftar <strong>Test Users (Pengguna Penguji)</strong> agar diizinkan masuk oleh Google.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-indigo-100/50 space-y-2">
                        <p className="font-bold text-[10px] text-indigo-950 uppercase tracking-wider">
                          Langkah Mudah Mendaftarkan Email Anda:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-indigo-800 font-sans leading-relaxed">
                          <li>Buka halaman <a href={`https://console.cloud.google.com/apis/credentials/consent?project=${firebaseConfig.projectId}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold hover:text-indigo-700">Google Cloud Console - OAuth Consent Screen</a>.</li>
                          <li>Pastikan Anda login menggunakan akun Google pemilik proyek ini.</li>
                          <li>Gulir ke bawah ke bagian <strong>Test users</strong> (Pengguna penguji), lalu klik tombol <strong>+ ADD USERS</strong>.</li>
                          <li>Masukkan email Anda: <strong className="text-indigo-700 select-all font-mono">perdinan.moses34@guru.smp.belajar.id</strong> (atau email lain yang ingin Anda gunakan).</li>
                          <li>Klik tombol <strong>SAVE</strong> untuk menyimpan.</li>
                        </ol>
                      </div>
                      
                      <p className="text-[10px] text-indigo-700 mt-1 font-sans">
                        Setelah email berhasil ditambahkan di Cloud Console, silakan coba klik kembali tombol <strong>Hubungkan Google Drive Saya</strong> di atas untuk sinkronisasi database gereja secara langsung.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">Terhubung ke Google Drive</p>
                          <p className="text-[10px] text-slate-400 truncate">{gdriveUser.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectGDrive}
                        className="text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 px-3 rounded-lg font-bold border border-red-100 transition-all cursor-pointer"
                      >
                        Putuskan Hubungan
                      </button>
                    </div>

                    {/* Auto-Sync Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Sinkronisasi Otomatis (Auto-Sync)</p>
                        <p className="text-[9px] text-slate-400">Setiap perubahan data di aplikasi CMS langsung tersimpan ke Google Drive Anda.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gdriveAutoSync}
                          onChange={(e) => handleToggleAutoSync(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Manual Sync Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleGDriveSync('pull')}
                        disabled={isSyncingGDrive}
                        className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
                      >
                        <Download className="w-4 h-4 text-slate-500" /> Tarik Data Dari Drive (PULL)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGDriveSync('push')}
                        disabled={isSyncingGDrive}
                        className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Upload className="w-4 h-4" /> Dorong Data Ke Drive (PUSH)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GDrive Sync Logs */}
              {gdriveSyncLogs.length > 0 && (
                <div className="bg-slate-950 text-indigo-400 p-4 rounded-2xl font-mono text-[9px] border border-indigo-900/30 space-y-1 max-h-48 overflow-y-auto shadow-inner leading-normal">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px] border-b border-indigo-900/30 pb-1 mb-1.5 flex justify-between items-center">
                    <span>LOG SINKRONISASI GOOGLE DRIVE</span>
                    <button onClick={() => setGdriveSyncLogs([])} className="hover:text-white text-[8px] font-mono cursor-pointer uppercase">Clear</button>
                  </p>
                  {gdriveSyncLogs.map((log, index) => {
                    const isError = log.includes("Gagal") || log.includes("Error") || log.includes("✖");
                    const hasPrefix = log.startsWith("✔") || log.startsWith("✖") || log.startsWith(">") || log.startsWith("⚠️");
                    return (
                      <p key={index} className={isError ? "text-red-400 font-semibold" : log.startsWith("⚠️") ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                        {hasPrefix ? "" : "> "}
                        {log}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-8"></div>

            {/* Google Sheets Sync Form / Control Panel */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <Database className="w-5 h-5 text-emerald-600" />
                <h4 className="font-display font-bold text-sm uppercase tracking-wide">SINKRONISASI DATABASE GOOGLE SHEETS</h4>
              </div>

              <div className="text-[11px] text-emerald-800 leading-relaxed space-y-2 bg-white/70 p-4 rounded-2xl border border-emerald-100/50">
                <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-900 mb-1">Panduan Persiapan Google Sheet:</p>
                <ol className="list-decimal pl-4 space-y-2.5">
                  <li>Buat Google Sheet baru dan pastikan hak akses dibagikan sebagai <strong className="text-emerald-700">"Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view)</strong>.</li>
                  <li>
                    <p className="mb-1">Buat beberapa tab berikut dengan nama persis sesuai tabel database dan isi baris pertama (kolom/header) dengan nama field di bawah ini:</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 mt-1.5 scrollbar-thin scrollbar-thumb-emerald-200">
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">settings</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          churchName, logoUrl, faviconUrl, bannerUrl, primaryColor, address, phone, email, website, mapsEmbedUrl, mapsLinkUrl, footerText, seoTitle, seoDescription, bankName, bankAccountNo, bankAccountName, qrisUrl, adminWelcomeText, adminSubText
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">users</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, email, name, role, photoUrl, statusBaptis, statusPernikahan, phone, address, komisi, keluarga, pelayanan, joinDate, password
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">announcements</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, title, content, priority, category, publishDate, expiryDate, isPinned, attachmentUrl, attachmentName
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">devotions</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, title, content, scripture, category, coverUrl, publishDate
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">events</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, title, content, bannerUrl, location, googleMapsUrl, dateTime, countdownDate, quota, registeredCount, status, isRegistrationOpen
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">prayer_requests</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, userId, userName, content, phone, isPrivate, status, date
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                        <span className="font-bold text-emerald-900 font-mono text-[10px]">gallery</span>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5 break-all">
                          id, title, description, imageUrl, category, date, author
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>Salin URL penuh Google Sheet dari browser Anda, tempelkan di kolom input di bawah ini, lalu klik <strong className="text-emerald-700">Sinkronkan Sekarang</strong>.</li>
                </ol>
              </div>

              <form onSubmit={handleSyncGoogleSheet} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1.5">Link / URL Google Sheet Anda</label>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/1ejgcYFq4JZCyyLeSu3RgBWlj6kcw2h1dRmV17yt43Ck/edit"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full p-3 border border-emerald-200 focus:border-emerald-500 rounded-xl text-xs bg-white focus:ring-4 focus:ring-emerald-100/50 font-mono outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-2">Tabel yang Akan Disinkronkan:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "settings", label: "Konfigurasi (settings)" },
                      { id: "users", label: "Pengguna (users)" },
                      { id: "announcements", label: "Warta (announcements)" },
                      { id: "devotions", label: "Renungan (devotions)" },
                      { id: "events", label: "Kegiatan (events)" },
                      { id: "service_schedules", label: "Jadwal Ibadah (service_schedules)" },
                      { id: "prayer_requests", label: "Doa (prayer_requests)" },
                      { id: "gallery", label: "Galeri (gallery)" },
                    ].map((tbl) => (
                      <label key={tbl.id} className="flex items-center gap-2 p-2 bg-white/60 border border-emerald-100 rounded-xl cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTablesToSync.includes(tbl.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTablesToSync([...selectedTablesToSync, tbl.id]);
                            } else {
                              setSelectedTablesToSync(selectedTablesToSync.filter(id => id !== tbl.id));
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-emerald-300 rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-medium text-emerald-950">{tbl.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSyncingSheet}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSyncingSheet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      MENYINKRONKAN...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      SINKRONKAN SEKARANG DARI GOOGLE SHEET
                    </>
                  )}
                </button>
              </form>

              {/* Log Window */}
              {sheetSyncLogs.length > 0 && (
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[9px] border border-emerald-900/30 space-y-1 max-h-48 overflow-y-auto shadow-inner leading-normal">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px] border-b border-emerald-900/30 pb-1 mb-1.5 flex justify-between items-center">
                    <span>CONSOLE LOG SINKRONISASI</span>
                    <button onClick={() => setSheetSyncLogs([])} className="hover:text-white text-[8px] font-mono cursor-pointer uppercase">Clear</button>
                  </p>
                  {sheetSyncLogs.map((log, index) => (
                    <p key={index} className={log.includes("Gagal") || log.includes("Error") ? "text-red-400 font-semibold" : ""}>
                      {log.startsWith("Berhasil") ? "✔ " : log.includes("Gagal") || log.includes("Error") ? "✖ " : "> "}
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kelola Pelayanan */}
          {activeTab === 'admin_ministries' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-gray-800 text-sm">Kelola Pelayanan Jemaat</h3>
                  <p className="text-xs text-gray-400">Atur komisi dan divisi pelayanan gereja yang terintegrasi di portal jemaat.</p>
                </div>
                {!editingItem && !isCreatingNew && (
                  <button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setEditingItem({
                        id: `min_${Date.now()}`,
                        name: '',
                        leader: '',
                        schedule: '',
                        description: '',
                        contact: '',
                        category: 'Umum'
                      });
                    }}
                    className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pelayanan
                  </button>
                )}
              </div>

              {(isCreatingNew || editingItem) ? (
                <form onSubmit={handleSaveMinistry} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 max-w-xl">
                  <h4 className="font-bold text-xs uppercase text-gray-700">{isCreatingNew ? 'Tambah Pelayanan Baru' : 'Edit Pelayanan'}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Nama Bidang Pelayanan</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Worship & Praise"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Ketua / Koordinator</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.leader || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, leader: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Pnt. Jonathan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Jadwal Latihan / Pertemuan</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.schedule || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, schedule: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Sabtu, 17.00 WIB"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Kontak Hubung</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.contact || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: 0812-3456-7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Kategori Komisi</label>
                    <select
                      value={editingItem?.category || 'Umum'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                    >
                      <option value="Umum">Umum</option>
                      <option value="Musik & Liturgi">Musik & Liturgi</option>
                      <option value="Media & Multimedia">Media & Multimedia</option>
                      <option value="Anak & Remaja">Anak & Remaja</option>
                      <option value="Diakonia & Sosial">Diakonia & Sosial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Deskripsi Divisi</label>
                    <textarea
                      required
                      value={editingItem?.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full h-24 p-2 border border-gray-200 rounded-xl text-xs bg-white resize-none"
                      placeholder="Tuliskan misi dan detail kegiatan divisi ini..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">Simpan</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ministries.map((min) => (
                    <div key={min.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-indigo-100 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">{min.category}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingItem(min)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMinistry(min.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 text-sm leading-tight">{min.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Koordinator: {min.leader}</p>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-3">{min.description}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 mt-4 text-[10px] text-gray-400 space-y-1">
                        <p><strong>Jadwal:</strong> {min.schedule}</p>
                        <p><strong>Kontak:</strong> {min.contact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Struktur Organisasi / Pengurus */}
          {activeTab === 'admin_organizations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-gray-800 text-sm">Kelola Struktur Pengurus & Pelayan Firman</h3>
                  <p className="text-xs text-gray-400">Atur jajaran majelis, penatua, diaken, dan pendeta pelayan jemaat CMS.</p>
                </div>
                {!editingItem && !isCreatingNew && (
                  <button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setEditingItem({
                        id: `org_${Date.now()}`,
                        name: '',
                        roleName: '',
                        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        period: '2024 - 2029',
                        contact: '',
                        description: '',
                        order: orgs.length + 1
                      });
                    }}
                    className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pengurus
                  </button>
                )}
              </div>

              {(isCreatingNew || editingItem) ? (
                <form onSubmit={handleSaveOrganization} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 max-w-xl">
                  <h4 className="font-bold text-xs uppercase text-gray-700">{isCreatingNew ? 'Tambah Pengurus Baru' : 'Edit Pengurus'}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Nama Lengkap & Gelar</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Pdt. Dr. Samuel"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Jabatan / Peran</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.roleName || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, roleName: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Gembala Sidang"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Periode Pelayanan</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.period || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, period: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: 2024 - 2029"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Kontak Hubung</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.contact || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, contact: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: 0812-xxx-xxx"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Urutan Tampilan</label>
                      <input
                        type="number"
                        required
                        value={editingItem?.order || 1}
                        onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 1 })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Link Foto Profil (URL)</label>
                    <input
                      type="text"
                      required
                      value={editingItem?.photoUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, photoUrl: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Keterangan / Profil Singkat</label>
                    <textarea
                      required
                      value={editingItem?.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full h-24 p-2 border border-gray-200 rounded-xl text-xs bg-white resize-none"
                      placeholder="Misi pelayanan, kutipan ayat, atau peran utama..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">Simpan</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {orgs.map((org) => (
                    <div key={org.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-amber-100 transition-all">
                      <div className="p-5 flex flex-col items-center text-center space-y-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                          <img src={org.photoUrl} alt={org.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm leading-tight">{org.name}</h4>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase mt-1 inline-block">{org.roleName}</span>
                        </div>

                        <p className="text-[11px] text-gray-500 italic">"{org.description}"</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100">
                        <span>Masa Bakti: {org.period}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingItem(org)}
                            className="p-1 bg-white hover:bg-slate-100 text-gray-500 rounded border border-gray-200 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrganization(org.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kelola Galeri */}
          {activeTab === 'admin_gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-gray-800 text-sm">Kelola Galeri Media Dokumentasi</h3>
                  <p className="text-xs text-gray-400">Unggah foto dokumentasi kegiatan ibadah, KKR, bakti sosial, dan ibadah padang.</p>
                </div>
                {!editingItem && !isCreatingNew && (
                  <button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setEditingItem({
                        id: `gal_${Date.now()}`,
                        title: '',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&auto=format&fit=crop&q=80',
                        category: 'Ibadah Raya',
                        uploadDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Foto/Video Galeri
                  </button>
                )}
              </div>

              {(isCreatingNew || editingItem) ? (
                <form onSubmit={handleSaveGallery} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 max-w-xl">
                  <h4 className="font-bold text-xs uppercase text-gray-700">{isCreatingNew ? 'Tambah Foto Baru' : 'Edit Galeri'}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Judul Kegiatan / Media</label>
                      <input
                        type="text"
                        required
                        value={editingItem?.title || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                        placeholder="Contoh: Retreat Pemuda CMS 2026"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Kategori Kegiatan</label>
                      <select
                        value={editingItem?.category || 'Ibadah Raya'}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                      >
                        <option value="Ibadah Raya">Ibadah Raya</option>
                        <option value="Persekutuan Doa">Persekutuan Doa</option>
                        <option value="Aksi Sosial">Aksi Sosial</option>
                        <option value="Retreat & Camp">Retreat & Camp</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Jenis Media</label>
                      <select
                        value={editingItem?.type || 'image'}
                        onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                      >
                        <option value="image">Gambar / Foto</option>
                        <option value="video">Link Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase">Tanggal Dokumentasi</label>
                      <input
                        type="date"
                        required
                        value={editingItem?.uploadDate || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, uploadDate: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase">Link URL Media Gambar / Cover (URL)</label>
                    <input
                      type="text"
                      required
                      value={editingItem?.url || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">Simpan</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {gallery.map((gal) => (
                    <div key={gal.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                      <div className="h-40 overflow-hidden relative bg-slate-900">
                        <img src={gal.url} alt={gal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{gal.category}</span>
                      </div>
                      
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-gray-800 text-xs truncate">{gal.title}</h4>
                        <div className="flex items-center justify-between text-[9px] text-gray-400">
                          <span>{gal.uploadDate}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingItem(gal)}
                              className="text-gray-500 hover:text-slate-800 font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gal.id)}
                              className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
