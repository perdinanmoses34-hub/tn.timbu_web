/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  photoUrl?: string;
  statusBaptis?: 'Sudah' | 'Belum';
  statusPernikahan?: 'Menikah' | 'Belum Menikah' | 'Janda/Duda';
  phone?: string;
  address?: string;
  komisi?: string; // e.g., Anak, Remaja, Pemuda, Dewasa, Lansia
  keluarga?: string; // Nama Kepala Keluarga / Relasi
  pelayanan?: string; // Bidang pelayanan jika ada
  joinDate?: string;
  password?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  publishDate: string;
  expiryDate: string;
  isPinned: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  coverUrl: string;
  author: string;
  publishDate: string;
  status: 'draft' | 'published' | 'archived';
  likes: number;
  views: number;
  commentsCount: number;
}

export interface Devotion {
  id: string;
  title: string;
  content: string;
  scripture: string; // Ayat Alkitab
  category: string;
  coverUrl: string;
  audioUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  publishDate: string;
}

export interface Event {
  id: string;
  title: string;
  content: string;
  bannerUrl: string;
  location: string;
  googleMapsUrl?: string;
  dateTime: string;
  countdownDate: string;
  quota: number;
  registeredCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  isRegistrationOpen: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  registerDate: string;
  status: 'approved' | 'pending' | 'rejected';
  qrCodeUrl: string;
  attended: boolean;
}

export interface Gallery {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  category: string;
  uploadDate: string;
}

export interface Organization {
  id: string;
  name: string;
  roleName: string; // Jabatan, e.g., Pendeta, Penatua, Diaken, Ketua Komisi
  photoUrl: string;
  period: string; // Masa Bakti, e.g., 2024 - 2029
  contact: string;
  description: string;
  order: number;
}

export interface Ministry {
  id: string;
  name: string;
  leader: string;
  schedule: string;
  description: string;
  contact: string;
  category: string;
}

export interface Congregation {
  id: string;
  name: string;
  photoUrl: string;
  address: string;
  phone: string;
  email: string;
  isBaptized: boolean;
  isMarried: boolean;
  familyMembers: string; // Komposisi keluarga
  commission: string; // Komisi: Anak, Remaja, Pemuda, Wanita, Pria, Lansia
  ministry: string; // Bidang Pelayanan
  joinDate: string;
}

export interface Comment {
  id: string;
  targetId: string;
  targetType: 'news' | 'devotion';
  targetTitle: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  content: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported' | 'spam';
  likes: number;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  targetGroup: 'all' | 'admin' | 'jemaat' | 'specific';
  targetUserIds?: string[];
  sentDate: string;
  sentBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  ip: string;
  browser: string;
  device: string;
  date: string;
  beforeData?: string;
  afterData?: string;
  status: 'success' | 'failed';
}

export interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  content: string;
  date: string;
  isPrivate: boolean;
  status: 'pending' | 'prayed' | 'answered';
}

export interface ChurchSettings {
  churchName: string;
  logoUrl: string;
  faviconUrl: string;
  bannerUrl: string;
  primaryColor: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  mapsEmbedUrl: string;
  mapsLinkUrl: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  maxUploadSizeMb: number;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  qrisUrl?: string;
  adminWelcomeText?: string;
  adminSubText?: string;
  googleSheetUrl?: string;
  customMenus?: Array<{ id: string; label: string; visible: boolean }>;
}

export interface ServiceSchedule {
  id: string;
  sessionName: string;
  title: string;
  time: string;
  speaker: string;
  worshipLeader: string;
  location: string;
  category?: string;
  dateDay?: string;
  notes?: string;
  isOnline?: boolean;
}
