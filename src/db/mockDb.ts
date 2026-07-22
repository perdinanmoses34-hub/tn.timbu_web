/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Role,
  User,
  Announcement,
  News,
  Devotion,
  Event as ChurchEvent,
  EventRegistration,
  Gallery,
  Organization,
  Ministry,
  Congregation,
  Comment,
  Notification as ChurchNotification,
  ActivityLog,
  PrayerRequest,
  ChurchSettings,
  ServiceSchedule,
} from '../types';
import { findDatabaseFile, downloadDatabaseFile, uploadDatabaseFile } from '../lib/googleDriveSync';
import { saveToFirestoreClient, loadFromFirestoreClient, subscribeFirestoreRealtime } from '../lib/firebaseClient';

// Default Church Settings
const DEFAULT_SETTINGS: ChurchSettings = {
  churchName: 'SYSTEM MANAGEMENT CHURCH (CMS)',
  logoUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=120&auto=format&fit=crop&q=80',
  faviconUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb10a?w=32&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1200&auto=format&fit=crop&q=80',
  primaryColor: '#1e3a8a', // Deep Blue
  address: 'Jl. Raya Utama No. 1, Jakarta / Indonesia',
  phone: '021-500800 / +62 811-2222-3333',
  email: 'info@churchcms.org',
  website: 'https://www.churchcms.org',
  socialMedia: {
    facebook: 'https://facebook.com/churchcms',
    instagram: 'https://instagram.com/churchcms',
    youtube: 'https://youtube.com/churchcms',
    tiktok: 'https://tiktok.com/@churchcms',
  },
  mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.82200832049!2d112.780123!3d-7.378123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMjInNDEuMiJTIDExMsKwNDYnNDguNCJF!5e0!3m2!1sid!2sid!4v1710920000000!5m2!1sid!2sid',
  mapsLinkUrl: 'https://maps.google.com',
  footerText: '© 2026 SYSTEM MANAGEMENT CHURCH (CMS). Hak Cipta Dilindungi.',
  seoTitle: 'SYSTEM MANAGEMENT CHURCH (CMS) - Portal Jemaat & Pelayanan',
  seoDescription: 'Sistem Informasi Manajemen dan Pelayanan Gereja (CMS). Membangun jemaat yang bertumbuh, melayani dengan kasih.',
  maxUploadSizeMb: 10,
  bankName: 'BCA (Bank Central Asia)',
  bankAccountNo: '8290123456',
  bankAccountName: 'SYSTEM MANAGEMENT CHURCH (CMS)',
  qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SYSTEM_MANAGEMENT_CHURCH_OFFERING',
  adminWelcomeText: 'Selamat Datang, Admin Pelayanan!',
  adminSubText: 'Sistem Informasi Manajemen dan Pelayanan CMS. Kelola berita, kustomisasi donasi, moderasi komentar, dan kelola jajaran organisasi secara instan.',
  googleSheetUrl: '',
};

// Default Users for testing Role-Based Access Control
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_superadmin',
    email: 'superadmin@church.com',
    name: 'Pnt. Budi Santoso',
    role: 'SUPER_ADMIN',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    statusBaptis: 'Sudah',
    statusPernikahan: 'Menikah',
    phone: '081234567801',
    address: 'Sektor 9, Bintaro Jaya, Tangerang Selatan',
    komisi: 'Dewasa',
    keluarga: 'Kepala Keluarga (Istri: Maria, Anak: Samuel)',
    pelayanan: 'Majelis Jemaat',
    joinDate: '2015-04-12',
    password: 'church123',
  },
  {
    id: 'usr_admin',
    email: 'admin@church.com',
    name: 'Siti Rahmawati',
    role: 'ADMIN',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    statusBaptis: 'Sudah',
    statusPernikahan: 'Menikah',
    phone: '081234567802',
    address: 'Kembangan, Jakarta Barat',
    komisi: 'Wanita',
    keluarga: 'Istri (Suami: Yusuf)',
    pelayanan: 'Multimedia & Secretariat',
    joinDate: '2018-08-19',
    password: 'church123',
  },
  {
    id: 'usr_jemaat',
    email: 'jemaat@church.com',
    name: 'Andi Wijaya',
    role: 'JEMAAT',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    statusBaptis: 'Sudah',
    statusPernikahan: 'Belum Menikah',
    phone: '081234567803',
    address: 'Taman Ratu, Jakarta Barat',
    komisi: 'Pemuda',
    keluarga: 'Anak (Orang tua: Setiawan Wijaya)',
    pelayanan: 'Pemain Musik (Keyboard)',
    joinDate: '2020-01-05',
    password: 'church123',
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Ibadah Raya Khusus Paskah 2026',
    content: 'Diberitahukan kepada seluruh jemaat bahwa Ibadah Raya Paskah akan dilaksanakan pada hari Minggu, 5 April 2026. Ibadah akan dibagi menjadi 3 sesi: Sesi 1 (Subuh) jam 05.00 WIB, Sesi 2 jam 08.00 WIB, dan Sesi 3 jam 11.00 WIB. Mohon jemaat hadir 15 menit sebelum ibadah dimulai untuk ketertiban bersama.',
    priority: 'high',
    category: 'Ibadah Raya',
    publishDate: '2026-07-15',
    expiryDate: '2026-08-15',
    isPinned: true,
    attachmentUrl: '#',
    attachmentName: 'Tata_Ibadah_Paskah_2026.pdf',
  },
  {
    id: 'ann_2',
    title: 'Aksi Sosial Donor Darah & Pengobatan Gratis',
    content: 'Komisi Pelayanan Sosial CMS bekerja sama dengan Palang Merah Indonesia (PMI) akan mengadakan aksi sosial Donor Darah dan Pengobatan Gratis untuk warga sekitar gereja. Acara diadakan pada Sabtu, 25 Juli 2026 mulai pukul 08.00 - 13.00 WIB di Aula Serbaguna CMS. Mari berpartisipasi!',
    priority: 'medium',
    category: 'Kegiatan Sosial',
    publishDate: '2026-07-18',
    expiryDate: '2026-07-26',
    isPinned: false,
  },
  {
    id: 'ann_3',
    title: 'Kelas Katekisasi Sidasi / Baptis Dewasa Baru',
    content: 'Pendaftaran kelas Katekisasi persiapan baptis dewasa dan sidasi sidi tahun ajaran 2026/2027 telah dibuka. Kelas perdana akan dimulai pada Sabtu, 1 Agustus 2026 pukul 16.00 WIB di Ruang Konseling. Formulir pendaftaran dapat diambil di sekretariat gereja atau melalui pengisian formulir digital di dashboard jemaat.',
    priority: 'medium',
    category: 'Pendidikan',
    publishDate: '2026-07-10',
    expiryDate: '2026-08-02',
    isPinned: false,
    attachmentName: 'Formulir_Katekisasi.docx',
    attachmentUrl: '#',
  },
];

const DEFAULT_NEWS: News[] = [
  {
    id: 'news_1',
    title: 'Sukses Terlaksana: KKR Pemuda-Remaja CMS 2026 Menarik Ratusan Peserta',
    content: 'Kebaktian Kebangunan Rohani (KKR) Tahunan Pemuda dan Remaja CMS sukses diselenggarakan pada hari Sabtu kemarin. Bertempat di Auditorium CMS, KKR bertema "Shine Your Light" ini dihadiri oleh lebih dari 350 anak muda dari berbagai wilayah. Pembicara Pdt. Michael Yosef menyampaikan pesan yang membakar semangat pemuda untuk tetap berpegang teguh pada firman Tuhan di era digital yang penuh tantangan ini. Acara juga dimeriahkan oleh penampilan Youth Choir dan drama musikal spektakuler.',
    category: 'Pemuda',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    author: 'Siti Rahmawati',
    publishDate: '2026-07-19',
    status: 'published',
    likes: 124,
    views: 489,
    commentsCount: 3,
  },
  {
    id: 'news_2',
    title: 'CMS Menyalurkan Bantuan Sosial untuk Korban Kebakaran Tambora',
    content: 'CMS (SYSTEM MANAGEMENT CHURCH) melalui Komisi Diakonia dan Pelayanan Masyarakat bergerak cepat menyalurkan bantuan logistik darurat kepada korban bencana kebakaran di pemukiman padat penduduk Tambora, Jakarta Barat. Bantuan berupa bahan makanan pokok, pakaian layak pakai, selimut, air mineral, serta obat-obatan diserahkan langsung oleh perwakilan Majelis Jemaat kepada posko darurat setempat. Kami mengucapkan terima kasih yang sebesar-besarnya atas donasi materiil dan doa dari jemaat sekalian.',
    category: 'Pelayanan Sosial',
    coverUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
    author: 'Pnt. Budi Santoso',
    publishDate: '2026-07-14',
    status: 'published',
    likes: 89,
    views: 290,
    commentsCount: 1,
  },
  {
    id: 'news_3',
    title: 'Persiapan Pelayanan Natal dan Tata Tertib Panitia Baru',
    content: 'Draf rencana kepanitiaan Perayaan Natal 2026 dan Tahun Baru 2027 telah disusun. Dokumen ini membahas struktur panitia, tema perayaan, serta estimasi anggaran per divisi. Pertemuan perdana seluruh calon panitia dijadwalkan pada pertengahan Agustus untuk mematangkan konsep acara.',
    category: 'Internal',
    coverUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=800&auto=format&fit=crop&q=80',
    author: 'Siti Rahmawati',
    publishDate: '2026-07-20',
    status: 'draft',
    likes: 0,
    views: 5,
    commentsCount: 0,
  },
];

const DEFAULT_DEVOTIONS: Devotion[] = [
  {
    id: 'dev_1',
    title: 'Berjalan dalam Terang',
    content: 'Dalam kehidupan sehari-hari, kita seringkali dihadapkan pada pilihan-pilihan sulit. Firman Tuhan hari ini mengingatkan kita untuk selalu mengarahkan langkah kita pada kebenaran Allah. "Tetapi jika kita hidup di dalam terang sama seperti Dia ada di dalam terang, maka kita beroleh persekutuan seorang dengan yang lain..." Berjalan dalam terang berarti hidup dengan kejujuran, integritas, dan tanpa ada hal tersembunyi yang mendatangkan dosa. Ketika kita melakukan kebenaran, damai sejahtera surgawi akan senantiasa memenuhi hati kita.',
    scripture: '1 Yohanes 1:7',
    category: 'Iman & Integritas',
    coverUrl: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800&auto=format&fit=crop&q=80',
    audioUrl: '#',
    pdfUrl: '#',
    publishDate: '2026-07-20',
  },
  {
    id: 'dev_2',
    title: 'Kekuatan di Tengah Kelemahan',
    content: 'Manusia cenderung ingin terlihat kuat, sukses, dan mandiri. Namun, di hadapan Tuhan, pengakuan akan keterbatasan kita justru membuka jalan bagi kuasa-Nya yang luar biasa bekerja. Paulus mengalaminya sendiri saat dia memohon agar duri dalam dagingnya diangkat. Jawaban Tuhan sangat indah: "Cukuplah kasih karunia-Ku bagimu, sebab di dalam kelemahanlah kuasa-Ku menjadi sempurna." Ketika kita merasa lemah, lelah, dan tak berdaya, serahkanlah segalanya dalam doa. Kuasa Roh Kudus akan memampukan kita melakukan hal-hal besar melampaui logika kita.',
    scripture: '2 Korintus 12:9',
    category: 'Penghiburan',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    publishDate: '2026-07-19',
  },
];

const DEFAULT_EVENTS: ChurchEvent[] = [
  {
    id: 'cool_youth_fellowship_id',
    title: 'COOL YOUTH FELLOWSHIP',
    content: 'Persekutuan ibadah pemuda dan remaja gereja. Wadah kumpul anak muda untuk bertumbuh, saling menguatkan, dan membangun persahabatan sejati di dalam Kristus.',
    bannerUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    location: 'Chapel / Gedung Utama CMS',
    googleMapsUrl: 'https://maps.google.com',
    dateTime: '2026-07-22T19:00',
    countdownDate: '2026-07-22T19:00:00',
    quota: 40,
    registeredCount: 25,
    status: 'upcoming',
    isRegistrationOpen: true,
  },
  {
    id: 'evt_1',
    title: 'Seminar Hubungan Keluarga & Pasangan Bahagia 2026',
    content: 'Membangun keluarga Kristen yang harmonis, tangguh, dan berlandaskan kasih Kristus di tengah gempuran tren modern. Seminar ini menghadirkan pembicara pakar konseling keluarga kristen, Dr. Irwan Handoko & Dra. Maria Handoko. Sesi interaktif meliputi komunikasi suami-istri, mendidik anak di era digital, dan penyelesaian konflik keluarga dengan bijaksana.',
    bannerUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    location: 'Aula Lt. 3 Gedung CMS Jakarta',
    googleMapsUrl: 'https://maps.google.com',
    dateTime: '2026-08-15T09:00',
    countdownDate: '2026-08-15T09:00:00',
    quota: 150,
    registeredCount: 42,
    status: 'upcoming',
    isRegistrationOpen: true,
  },
  {
    id: 'evt_2',
    title: 'Kebaktian KKR Pujian & Penyembahan (Worship Night)',
    content: 'Malam penyerahan diri dan penyembahan bersama seluruh jemaat. Bersiap mengalami hadirat Tuhan yang memulihkan melalui nyanyian pujian, doa syafaat bersama, serta firman yang meneguhkan. Acara ini terbuka untuk umum.',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    location: 'Main Sanctuary CMS Jakarta',
    googleMapsUrl: 'https://maps.google.com',
    dateTime: '2026-07-28T19:00',
    countdownDate: '2026-07-28T19:00:00',
    quota: 500,
    registeredCount: 182,
    status: 'upcoming',
    isRegistrationOpen: true,
  },
];

const DEFAULT_SCHEDULES: ServiceSchedule[] = [
  {
    id: 'sch_1',
    sessionName: 'Sesi I (Pagi)',
    title: 'Ibadah Raya 1',
    time: '07.00 WIB',
    speaker: 'Pdt. Dr. Samuel Wijaya',
    worshipLeader: 'Sdr. David Haryono',
    location: 'Main Sanctuary (Lt. 1)',
    category: 'Ibadah Raya',
    dateDay: 'Setiap Hari Minggu',
    isOnline: false,
  },
  {
    id: 'sch_2',
    sessionName: 'Sesi II (Siang)',
    title: 'Ibadah Raya 2',
    time: '09.30 WIB',
    speaker: 'Pdt. Dr. Samuel Wijaya',
    worshipLeader: 'Sdr. Michael Yosef',
    location: 'Main Sanctuary (Lt. 1) & Live Streaming',
    category: 'Ibadah Raya',
    dateDay: 'Setiap Hari Minggu',
    isOnline: true,
  },
  {
    id: 'sch_3',
    sessionName: 'Sesi III (Sore)',
    title: 'Ibadah Pemuda (Youth)',
    time: '16.30 WIB',
    speaker: 'Pst. Michael Yosef',
    worshipLeader: 'Sdr. Andi Wijaya',
    location: 'Auditorium Lt. 3',
    category: 'Pemuda',
    dateDay: 'Setiap Hari Minggu',
    isOnline: false,
  },
  {
    id: 'sch_4',
    sessionName: 'Doa Malam',
    title: 'Persekutuan Doa Syafaat',
    time: '19.00 WIB',
    speaker: 'Pnt. Budi Santoso',
    worshipLeader: 'Sdri. Clara Shinta',
    location: 'Ruang Doa Lt. 2 & Zoom',
    category: 'Persekutuan',
    dateDay: 'Setiap Hari Rabu',
    isOnline: true,
  },
];

const DEFAULT_EVENT_REGISTRATIONS: EventRegistration[] = [
  {
    id: 'reg_1',
    eventId: 'evt_1',
    eventTitle: 'Seminar Hubungan Keluarga & Pasangan Bahagia 2026',
    userId: 'usr_jemaat',
    userName: 'Andi Wijaya',
    userEmail: 'jemaat@church.com',
    phone: '081234567803',
    registerDate: '2026-07-19T10:14:22',
    status: 'approved',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-EVT1-ANDIWIJAYA',
    attended: false,
  },
];

const DEFAULT_GALLERY: Gallery[] = [
  {
    id: 'gal_1',
    title: 'Keceriaan Kebaktian Sekolah Minggu (SM) CMS',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
    category: 'Sekolah Minggu',
    uploadDate: '2026-07-10',
  },
  {
    id: 'gal_2',
    title: 'Pelayanan Paduan Suara Dewasa CMS di Ibadah Raya',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    category: 'Ibadah Raya',
    uploadDate: '2026-07-12',
  },
  {
    id: 'gal_3',
    title: 'Video Dokumentasi Retreat Pemuda CMS 2026',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80', // placeholder thumbnail
    category: 'Pemuda',
    uploadDate: '2026-07-15',
  },
  {
    id: 'gal_4',
    title: 'Aksi Bersih-bersih Lingkungan Sekitar Gereja',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    category: 'Sosial',
    uploadDate: '2026-07-16',
  },
];

const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_1',
    name: 'Pdt. Dr. Samuel Wijaya',
    roleName: 'Pendeta Utama',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    period: 'Masa Bakti: 2020 - 2028',
    contact: 'samuel.wijaya@gkhk.or.id',
    description: 'Bertanggung jawab penuh atas pelayanan kerohanian, penggembalaan, dan arah visi strategis pengajaran firman di CMS Jakarta.',
    order: 1,
  },
  {
    id: 'org_2',
    name: 'Pnt. Budi Santoso',
    roleName: 'Sekretaris Majelis & Penatua Jemaat',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // photo from users
    period: 'Masa Bakti: 2024 - 2029',
    contact: 'budi.santoso@gkhk.or.id',
    description: 'Mengoordinasikan administrasi umum, sekretariat gereja, tata kelola rapat majelis, dan pelayanan jemaat dewasa.',
    order: 2,
  },
  {
    id: 'org_3',
    name: 'Dk. Elizabeth Tan',
    roleName: 'Bendahara Majelis Jemaat',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    period: 'Masa Bakti: 2024 - 2029',
    contact: 'elizabeth.tan@gkhk.or.id',
    description: 'Mengelola keuangan operasional gereja, pelaporan anggaran tahunan, diakonia kasih, dan verifikasi keuangan komisi-komisi.',
    order: 3,
  },
];

const DEFAULT_MINISTRIES: Ministry[] = [
  {
    id: 'min_1',
    name: 'Komisi Musik & Praise Worship',
    leader: 'Sdr. David Haryono',
    schedule: 'Latihan: Setiap Hari Sabtu, pukul 16.00 WIB di Main Sanctuary',
    description: 'Melayani musik, penyanyi latar (backing vocal), song leader, serta pemimpin pujian (Worship Leader) untuk Ibadah Raya 1, 2, dan 3.',
    contact: '0812-7777-6661',
    category: 'Musik & Pujian',
  },
  {
    id: 'min_2',
    name: 'Pelayanan Guru Sekolah Minggu (SM)',
    leader: 'Ibu Listiawati',
    schedule: 'Rapat Kurikulum: Minggu pertama tiap bulan, pukul 13.00 WIB',
    description: 'Mendidik anak-anak jemaat usia batita hingga kelas 6 SD dalam kebenaran firman Tuhan dengan metode interaktif, cerita Alkitab, dan kerajinan tangan.',
    contact: '0812-7777-6662',
    category: 'Pendidikan Anak',
  },
  {
    id: 'min_3',
    name: 'Komisi MultiMedia, Live & Sound',
    leader: 'Sdr. Yusuf Setiawan',
    schedule: 'Persiapan Teknis: Hari Minggu mulai pukul 06.30 WIB',
    description: 'Bertanggung jawab atas jalannya tata suara (sound system), kamera live streaming YouTube, pengoperasian slide proyektor, serta publikasi digital sosial media gereja.',
    contact: '0812-7777-6663',
    category: 'Media & Teknologi',
  },
];

const DEFAULT_CONGREGATIONS: Congregation[] = [
  {
    id: 'cong_1',
    name: 'Andi Wijaya',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Taman Ratu Indah No. 5, Jakarta Barat',
    phone: '081234567803',
    email: 'jemaat@church.com',
    isBaptized: true,
    isMarried: false,
    familyMembers: 'Anak dari Bapak Setiawan & Ibu Martha',
    commission: 'Pemuda',
    ministry: 'Komisi Musik & Praise Worship',
    joinDate: '2020-01-05',
  },
  {
    id: 'cong_2',
    name: 'Christian Sugiono',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    address: 'Perumahan Puri Indah, Blok D-10, Jakarta Barat',
    phone: '085712345678',
    email: 'christian.s@gmail.com',
    isBaptized: true,
    isMarried: true,
    familyMembers: 'Kepala Keluarga (Istri: Titi Kamal, Anak: Juna, Kai)',
    commission: 'Pria',
    ministry: 'Majelis Jemaat',
    joinDate: '2017-06-22',
  },
  {
    id: 'cong_3',
    name: 'Clara Shinta',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: 'Apartemen Belmont Residence Unit 12A, Kebon Jeruk',
    phone: '081398765432',
    email: 'clara.shinta@yahoo.com',
    isBaptized: true,
    isMarried: false,
    familyMembers: 'Lajang',
    commission: 'Wanita',
    ministry: 'Paduan Suara / Choir',
    joinDate: '2021-11-03',
  },
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'cmt_1',
    targetId: 'news_1',
    targetType: 'news',
    targetTitle: 'Sukses Terlaksana: KKR Pemuda-Remaja CMS 2026 Menarik Ratusan Peserta',
    userName: 'Andi Wijaya',
    userEmail: 'jemaat@church.com',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Luar biasa sekali acaranya! Firman Tuhan yang disampaikan sangat membakar semangat kami para pemuda agar selalu setia melayani Tuhan di gereja lokal kita.',
    date: '2026-07-19T21:40:00',
    status: 'approved',
    likes: 12,
  },
  {
    id: 'cmt_2',
    targetId: 'news_1',
    targetType: 'news',
    targetTitle: 'Sukses Terlaksana: KKR Pemuda-Remaja CMS 2026 Menarik Ratusan Peserta',
    userName: 'Hendra Saputra',
    userEmail: 'hendra.saputra@gmail.com',
    content: 'Praise the Lord! Panitia sungguh bekerja luar biasa mempersiapkan sound, live, dan drama musikalnya. Ditunggu retreat gabungan berikutnya!',
    date: '2026-07-20T08:15:00',
    status: 'approved',
    likes: 8,
  },
  {
    id: 'cmt_3',
    targetId: 'dev_1',
    targetType: 'devotion',
    targetTitle: 'Berjalan dalam Terang',
    userName: 'Merry Angriani',
    userEmail: 'merry.ang@gmail.com',
    content: 'Renungan yang sangat menguatkan hati di hari Senin pagi yang sibuk ini. Terima kasih kepada tim penulis renungan gereja CMS, Tuhan Yesus memberkati!',
    date: '2026-07-20T06:10:00',
    status: 'approved',
    likes: 15,
  },
  {
    id: 'cmt_4',
    targetId: 'news_1',
    targetType: 'news',
    targetTitle: 'Sukses Terlaksana: KKR Pemuda-Remaja CMS 2026 Menarik Ratusan Peserta',
    userName: 'Spam Bot 2026',
    userEmail: 'spambot@malicious.com',
    content: 'DAPATKAN DISKON SEPATU OLAHRAGA TERBAIK HANYA HARI INI DI LINK KAMI!!! CHEAP SHOES HERE!',
    date: '2026-07-20T12:00:00',
    status: 'spam',
    likes: 0,
  },
];

const DEFAULT_NOTIFICATIONS: ChurchNotification[] = [
  {
    id: 'notif_1',
    title: 'Informasi Ibadah Paskah 2026',
    content: 'Jadwal lengkap ibadah paskah CMS telah dipublikasikan di menu Pengumuman. Segera cek detail jam pelayanan.',
    targetGroup: 'all',
    sentDate: '2026-07-15T08:00:00',
    sentBy: 'admin@church.com',
  },
  {
    id: 'notif_2',
    title: 'Pendaftaran Seminar Keluarga Dibuka',
    content: 'Khusus bagi Pasangan Jemaat, pendaftaran Seminar Hubungan Keluarga Bahagia telah dibuka di dashboard masing-masing.',
    targetGroup: 'jemaat',
    sentDate: '2026-07-19T09:30:00',
    sentBy: 'superadmin@church.com',
  },
];

const DEFAULT_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pry_1',
    userId: 'usr_jemaat',
    userName: 'Andi Wijaya',
    phone: '081234567803',
    content: 'Mohon dukungan doa bagi nenek saya, Ibu Maria Wijaya, yang saat ini sedang dirawat di RS Siloam karena penyakit stroke ringan agar lekas dipulihkan oleh kuasa Tuhan.',
    date: '2026-07-20T14:20:00',
    isPrivate: false,
    status: 'prayed',
  },
  {
    id: 'pry_2',
    userId: 'usr_jemaat',
    userName: 'Andi Wijaya',
    phone: '081234567803',
    content: 'Mohon doa khusus pribadi untuk kelancaran tes wawancara kerja saya pada hari Rabu esok agar dimampukan oleh Tuhan.',
    date: '2026-07-20T15:00:00',
    isPrivate: true,
    status: 'pending',
  },
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log_1',
    userId: 'usr_superadmin',
    userName: 'Pnt. Budi Santoso',
    role: 'SUPER_ADMIN',
    action: 'LOGIN',
    ip: '192.168.1.50',
    browser: 'Chrome 125.0',
    device: 'Desktop Windows 11',
    date: '2026-07-20T08:00:00',
    status: 'success',
  },
  {
    id: 'log_2',
    userId: 'usr_admin',
    userName: 'Siti Rahmawati',
    role: 'ADMIN',
    action: 'CREATE_NEWS',
    ip: '112.199.12.87',
    browser: 'Safari Mobile 17.4',
    device: 'iPhone 15 Pro',
    date: '2026-07-19T14:30:00',
    status: 'success',
    afterData: 'Judul: Sukses Terlaksana: KKR Pemuda-Remaja CMS 2026',
  },
];

// DB Helper class
export class MockDatabase {
  private static isSyncing = false;
  private static isSavePending = false;
  private static onSyncCallback: (() => void) | null = null;

  private static isRealtimeInitialized = false;

  static registerSyncCallback(callback: () => void) {
    this.onSyncCallback = callback;
    this.initRealtimeListener();
  }

  static initRealtimeListener() {
    if (this.isRealtimeInitialized) return;
    this.isRealtimeInitialized = true;
    subscribeFirestoreRealtime(() => {
      if (this.onSyncCallback) {
        this.onSyncCallback();
      }
    });
  }

  static async loadFromServer() {
    this.initRealtimeListener();

    // 1. Try Express API backend if available
    try {
      const res = await fetch(`/api/db?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const dbData = json.data;
          Object.keys(dbData).forEach((key) => {
            if (dbData[key] !== undefined && dbData[key] !== null) {
              if (Array.isArray(dbData[key]) && dbData[key].length === 0) {
                const local = localStorage.getItem(`church_cms_${key}`);
                if (local) {
                  try {
                    const parsedLocal = JSON.parse(local);
                    if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                      return; // preserve local non-empty data if server returns empty
                    }
                  } catch (e) {}
                }
              }
              localStorage.setItem(`church_cms_${key}`, JSON.stringify(dbData[key]));
            }
          });
          if (this.onSyncCallback) {
            this.onSyncCallback();
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('church_db_updated'));
          }
          return true;
        }
      }
    } catch (e) {
      // Ignore Express fetch error, fallback to Firestore
    }

    // 2. Direct client-side Firestore load (Works on GitHub Pages & mobile devices directly!)
    try {
      const firestoreData = await loadFromFirestoreClient();
      if (firestoreData && Object.keys(firestoreData).length > 0) {
        if (this.onSyncCallback) {
          this.onSyncCallback();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('church_db_updated'));
        }
        return true;
      }
    } catch (e) {
      console.warn("Client Firestore sync failed:", e);
    }

    return false;
  }

  static async saveToServer() {
    this.isSavePending = true;
    if (this.isSyncing) return;

    while (this.isSavePending) {
      this.isSavePending = false;
      this.isSyncing = true;
      try {
        const fullBackup = {
          settings: this.getSettings(),
          users: this.getUsers(),
          announcements: this.getAnnouncements(),
          news: this.getNews(),
          devotions: this.getDevotions(),
          events: this.getEvents(),
          service_schedules: this.getSchedules(),
          event_registrations: this.getEventRegistrations(),
          gallery: this.getGallery(),
          organizations: this.getOrganizations(),
          ministries: this.getMinistries(),
          congregations: this.getCongregations(),
          comments: this.getComments(),
          notifications: this.getNotifications(),
          prayer_requests: this.getPrayerRequests(),
          activity_logs: this.getLogs(),
        };

        // 1. Try Express server API
        try {
          await fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullBackup),
          });
        } catch (e) {
          // Ignore Express error, fallback to client Firestore
        }

        // 2. Save directly to Firestore Cloud Database (Syncs to all devices globally!)
        await saveToFirestoreClient(fullBackup);
      } catch (e) {
        console.warn("Failed to save database to server/cloud", e);
      } finally {
        this.isSyncing = false;
      }
    }
  }

  static async syncFromGoogleSheet(sheetUrl: string, tables?: string[]): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = ["Memulai sinkronisasi Google Sheet...", "Mengekstrak ID dari URL..."];
    
    // Extract Google Sheet ID from URL
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return { success: false, logs: [...logs, "❌ URL Google Sheet tidak valid."] };
    }
    const sheetId = match[1];

    let response: Response;
    try {
      response = await fetch("/api/db/sync-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl, tables }),
      });
    } catch (e: any) {
      console.warn("Server connection failed, falling back to client-side sheet sync:", e);
      logs.push(`⚠ Gagal menghubungi server: ${e.message || e}`);
      logs.push("🔄 Mengaktifkan sinkronisasi langsung dari browser (Client-Side Fallback)...");
      return await this.syncFromGoogleSheetClientSide(sheetId, tables, logs);
    }

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      console.warn(`Server returned status ${response.status} with non-JSON or error, falling back to client-side sheet sync.`);
      logs.push(`⚠ Koneksi server mengembalikan status ${response.status}.`);
      logs.push("🔄 Mengaktifkan sinkronisasi langsung dari browser (Client-Side Fallback)...");
      return await this.syncFromGoogleSheetClientSide(sheetId, tables, logs);
    }

    try {
      const result = await response.json();
      if (result.success) {
        // Load the new synced database into localStorage
        const dbData = result.data;
        Object.keys(dbData).forEach((key) => {
          localStorage.setItem(`church_cms_${key}`, JSON.stringify(dbData[key]));
        });
        if (this.onSyncCallback) {
          this.onSyncCallback();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('church_db_updated'));
        }
        return { success: true, logs: result.logs || [] };
      } else {
        logs.push(`⚠ Server mengembalikan error: ${result.error || "Gagal melakukan sinkronisasi"}`);
        logs.push("🔄 Mengaktifkan sinkronisasi langsung dari browser (Client-Side Fallback)...");
        return await this.syncFromGoogleSheetClientSide(sheetId, tables, logs);
      }
    } catch (e: any) {
      logs.push(`⚠ Error parsing response: ${e.message}`);
      logs.push("🔄 Mengaktifkan sinkronisasi langsung dari browser (Client-Side Fallback)...");
      return await this.syncFromGoogleSheetClientSide(sheetId, tables, logs);
    }
  }

  static async syncFromGoogleSheetClientSide(sheetId: string, tables?: string[], initialLogs: string[] = []): Promise<{ success: boolean; logs: string[] }> {
    const logs = [...initialLogs];
    const targetTables = tables || [
      "settings",
      "users",
      "announcements",
      "devotions",
      "events",
      "service_schedules",
      "prayer_requests",
      "gallery",
      "congregations"
    ];

    const requiredColumns: Record<string, string[]> = {
      settings: ["churchName"],
      users: ["email", "role"],
      announcements: ["category"],
      devotions: ["scripture"],
      events: ["dateTime"],
      service_schedules: ["title", "time"],
      prayer_requests: ["isPrivate"],
      gallery: ["imageUrl"],
      congregations: ["name", "phone"]
    };

    // Simple client-side CSV parser
    const parseCSVClient = (csvText: string): string[][] => {
      const result: string[][] = [];
      let row: string[] = [];
      let inQuotes = false;
      let entry = "";

      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            entry += '"';
            i++; // skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          row.push(entry.trim());
          entry = "";
        } else if ((char === "\r" || char === "\n") && !inQuotes) {
          if (char === "\r" && nextChar === "\n") {
            i++;
          }
          row.push(entry.trim());
          result.push(row);
          row = [];
          entry = "";
        } else {
          entry += char;
        }
      }
      if (entry || row.length > 0) {
        row.push(entry.trim());
        result.push(row);
      }
      return result;
    };

    try {
      logs.push(`Mengunduh data dari Google Sheet ID: ${sheetId}...`);
      
      await Promise.all(
        targetTables.map(async (table) => {
          const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${table}`;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(csvUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              logs.push(`✖ Tab "${table}" tidak ditemukan atau tidak dapat diakses.`);
              return;
            }

            const csvText = await response.text();
            
            // Check if returned text looks like HTML (meaning sheet is private or login is requested)
            if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("Sign in")) {
              logs.push(`✖ Tab "${table}": Google Sheet harus dibagikan sebagai 'Siapa saja yang memiliki link dapat melihat' (Anyone with the link can view).`);
              return;
            }

            const parsedRows = parseCSVClient(csvText);
            if (parsedRows.length === 0) {
              logs.push(`✖ Tab "${table}" tidak mengembalikan data apa pun.`);
              return;
            }

            const headers = parsedRows[0].map(h => h.replace(/^"|"$/g, "").trim());
            const required = requiredColumns[table] || [];
            const missing = required.filter(col => !headers.includes(col));

            if (missing.length > 0) {
              const isDefaultSheetFallback = headers.includes("id") && headers.includes("title") && headers.includes("content") && !headers.includes("churchName") && !headers.includes("role") && !headers.includes("dateTime");
              if (isDefaultSheetFallback) {
                logs.push(`✖ Gagal: Tab bernama "${table}" tidak ditemukan di Google Sheet Anda. Google Sheet Anda mengembalikan tab default 'Sheet1'. Silakan buat tab baru bernama persis "${table}" (huruf kecil semua).`);
              } else {
                logs.push(`✖ Gagal: Tab "${table}" ditemukan, tetapi tidak memiliki kolom wajib: "${missing.join(", ")}". Kolom saat ini: [${headers.join(", ")}].`);
              }
              return;
            }

            if (parsedRows.length <= 1) {
              logs.push(`ℹ Tab "${table}" kosong (hanya berisi baris header).`);
              return;
            }

            const dataRows = parsedRows.slice(1);
            const records = dataRows.map((row, rowIndex) => {
              const record: Record<string, any> = {};
              headers.forEach((header, colIndex) => {
                if (!header) return;
                let value: any = row[colIndex] !== undefined ? row[colIndex].replace(/^"|"$/g, "").trim() : "";
                
                // Try to parse JSON or boolean or numbers
                if (value.toLowerCase() === "true") {
                  value = true;
                } else if (value.toLowerCase() === "false") {
                  value = false;
                } else if (!isNaN(Number(value)) && value !== "") {
                  value = Number(value);
                } else if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
                  try {
                    value = JSON.parse(value);
                  } catch (e) {
                    // Keep as string
                  }
                }
                record[header] = value;
              });
              
              if (!record.id) {
                record.id = `${table.slice(0, 3)}_${Date.now()}_${rowIndex}`;
              }
              return record;
            });

            if (table === "settings") {
              if (records.length > 0) {
                const currentSettings = this.getSettings();
                const updatedSettings = { ...currentSettings, ...records[0] };
                localStorage.setItem("church_cms_settings", JSON.stringify(updatedSettings));
                logs.push(`✔ Berhasil sinkronisasi settings (1 konfigurasi).`);
              }
            } else {
              localStorage.setItem(`church_cms_${table}`, JSON.stringify(records));
              logs.push(`✔ Berhasil sinkronisasi ${table} (${records.length} baris).`);
            }
          } catch (error: any) {
            logs.push(`✖ Gagal memproses tab "${table}": ${error.message}`);
          }
        })
      );

      // Trigger re-render and saving back to server
      if (this.onSyncCallback) {
        this.onSyncCallback();
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("church_db_updated"));
      }
      
      // Try backing up to Express server in background
      this.saveToServer().catch(e => console.warn("Background backup to server failed:", e));

      logs.push("✔ Sinkronisasi lokal via browser selesai!");
      return { success: true, logs };
    } catch (err: any) {
      return { success: false, logs: [...logs, `✖ Kesalahan kritis client-side: ${err.message || err}`] };
    }
  }

  private static getStored<T>(key: string, defaults: T): T {
    const data = localStorage.getItem(`church_cms_${key}`);
    if (!data) {
      localStorage.setItem(`church_cms_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  }

  private static setStored<T>(key: string, data: T) {
    localStorage.setItem(`church_cms_${key}`, JSON.stringify(data));
    this.saveToServer();
    
    // Background auto-sync to Google Drive if enabled and authenticated
    if (typeof window !== 'undefined') {
      const autoSync = localStorage.getItem('gdrive_sync_auto') === 'true';
      const token = sessionStorage.getItem('gdrive_access_token');
      if (autoSync && token) {
        this.syncWithGoogleDrive(token, 'push').catch((err) =>
          console.error('Failed auto-sync to Google Drive:', err)
        );
      }
      window.dispatchEvent(new Event('church_db_updated'));
    }
  }

  static async syncWithGoogleDrive(
    accessToken: string,
    direction: 'pull' | 'push'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const fileId = await findDatabaseFile(accessToken);

      if (direction === 'pull') {
        if (!fileId) {
          return {
            success: false,
            message: 'File church_cms_database.json tidak ditemukan di Google Drive.',
          };
        }

        const driveData = await downloadDatabaseFile(accessToken, fileId);
        if (!driveData) {
          return {
            success: false,
            message: 'Gagal membaca data dari Google Drive atau file kosong.',
          };
        }

        // Save imported data into localStorage
        Object.keys(driveData).forEach((key) => {
          localStorage.setItem(`church_cms_${key}`, JSON.stringify(driveData[key]));
        });

        // Update server
        await this.saveToServer();

        if (this.onSyncCallback) {
          this.onSyncCallback();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('church_db_updated'));
        }

        return {
          success: true,
          message: 'Berhasil mengunduh dan menyinkronkan seluruh database dari Google Drive!',
        };
      } else {
        // direction === 'push'
        const fullBackup = {
          settings: this.getSettings(),
          users: this.getUsers(),
          announcements: this.getAnnouncements(),
          news: this.getNews(),
          devotions: this.getDevotions(),
          events: this.getEvents(),
          service_schedules: this.getSchedules(),
          event_registrations: this.getEventRegistrations(),
          gallery: this.getGallery(),
          organizations: this.getOrganizations(),
          ministries: this.getMinistries(),
          congregations: this.getCongregations(),
          comments: this.getComments(),
          notifications: this.getNotifications(),
          prayer_requests: this.getPrayerRequests(),
        };

        const newFileId = await uploadDatabaseFile(accessToken, fullBackup, fileId);
        if (newFileId) {
          localStorage.setItem('church_gdrive_file_id', newFileId);
        }

        return {
          success: true,
          message: 'Berhasil mengunggah dan mencadangkan seluruh database ke Google Drive!',
        };
      }
    } catch (error: any) {
      console.error('Google Drive sync error:', error);
      return {
        success: false,
        message: `Kesalahan Sinkronisasi: ${error.message || error}`,
      };
    }
  }

  static getSettings(): ChurchSettings {
    const settings = this.getStored<ChurchSettings>('settings', DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
    };
  }

  static saveSettings(settings: ChurchSettings, actor: { id: string; name: string; role: Role }) {
    const before = this.getSettings();
    this.setStored('settings', settings);
    this.addLog(
      actor,
      'UPDATE_SETTINGS',
      JSON.stringify(before),
      JSON.stringify(settings)
    );
  }

  static resetSettings(actor: { id: string; name: string; role: Role }): ChurchSettings {
    const before = this.getSettings();
    this.setStored('settings', DEFAULT_SETTINGS);
    this.addLog(
      actor,
      'RESET_SETTINGS',
      JSON.stringify(before),
      JSON.stringify(DEFAULT_SETTINGS)
    );
    return DEFAULT_SETTINGS;
  }

  static getUsers(): User[] {
    const stored = this.getStored<User[]>('users', DEFAULT_USERS);
    let changed = false;
    const users = Array.isArray(stored) ? [...stored] : [...DEFAULT_USERS];

    DEFAULT_USERS.forEach((defUser) => {
      const idx = users.findIndex(
        (u) => u.email.toLowerCase() === defUser.email.toLowerCase() || u.id === defUser.id
      );
      if (idx === -1) {
        users.push(defUser);
        changed = true;
      } else {
        if (!users[idx].password) {
          users[idx].password = defUser.password || 'church123';
          changed = true;
        }
      }
    });

    if (changed) {
      this.setStored('users', users);
    }
    return users;
  }

  static saveUser(user: User, actor?: { id: string; name: string; role: Role }) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    const before = index >= 0 ? users[index] : null;

    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setStored('users', users);

    if (actor) {
      this.addLog(
        actor,
        index >= 0 ? 'UPDATE_USER' : 'CREATE_USER',
        before ? JSON.stringify(before) : undefined,
        JSON.stringify(user)
      );
    }
  }

  static deleteUser(userId: string, actor: { id: string; name: string; role: Role }) {
    const users = this.getUsers();
    const before = users.find((u) => u.id === userId);
    if (!before) return;

    const filtered = users.filter((u) => u.id !== userId);
    this.setStored('users', filtered);

    this.addLog(actor, 'DELETE_USER', JSON.stringify(before), undefined);
  }

  static getAnnouncements(): Announcement[] {
    return this.getStored('announcements', DEFAULT_ANNOUNCEMENTS);
  }

  static saveAnnouncement(ann: Announcement, actor: { id: string; name: string; role: Role }) {
    const items = this.getAnnouncements();
    const index = items.findIndex((i) => i.id === ann.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = ann;
    } else {
      items.push(ann);
    }
    this.setStored('announcements', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_ANNOUNCEMENT' : 'CREATE_ANNOUNCEMENT',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(ann)
    );
  }

  static deleteAnnouncement(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getAnnouncements();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('announcements', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_ANNOUNCEMENT', JSON.stringify(before), undefined);
  }

  static getNews(): News[] {
    return this.getStored('news', DEFAULT_NEWS);
  }

  static saveNews(news: News, actor: { id: string; name: string; role: Role }) {
    const items = this.getNews();
    const index = items.findIndex((i) => i.id === news.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = news;
    } else {
      items.push(news);
    }
    this.setStored('news', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_NEWS' : 'CREATE_NEWS',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(news)
    );
  }

  static deleteNews(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getNews();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('news', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_NEWS', JSON.stringify(before), undefined);
  }

  static getDevotions(): Devotion[] {
    return this.getStored('devotions', DEFAULT_DEVOTIONS);
  }

  static saveDevotion(dev: Devotion, actor: { id: string; name: string; role: Role }) {
    const items = this.getDevotions();
    const index = items.findIndex((i) => i.id === dev.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = dev;
    } else {
      items.push(dev);
    }
    this.setStored('devotions', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_DEVOTION' : 'CREATE_DEVOTION',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(dev)
    );
  }

  static deleteDevotion(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getDevotions();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('devotions', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_DEVOTION', JSON.stringify(before), undefined);
  }

  static getEvents(): ChurchEvent[] {
    const events = this.getStored('events', DEFAULT_EVENTS);
    if (!events.some((e) => e.id === 'cool_youth_fellowship_id')) {
      const coolYouth = DEFAULT_EVENTS.find((e) => e.id === 'cool_youth_fellowship_id');
      if (coolYouth) {
        events.unshift(coolYouth);
        this.setStored('events', events);
      }
    }
    return events;
  }

  static saveEvent(evt: ChurchEvent, actor: { id: string; name: string; role: Role }) {
    const items = this.getEvents();
    const index = items.findIndex((i) => i.id === evt.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = evt;
    } else {
      items.push(evt);
    }
    this.setStored('events', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_EVENT' : 'CREATE_EVENT',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(evt)
    );
  }

  static deleteEvent(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getEvents();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('events', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_EVENT', JSON.stringify(before), undefined);
  }

  static getSchedules(): ServiceSchedule[] {
    const raw = this.getStored('service_schedules', DEFAULT_SCHEDULES);
    if (!raw || !Array.isArray(raw)) {
      this.setStored('service_schedules', DEFAULT_SCHEDULES);
      return DEFAULT_SCHEDULES;
    }
    return raw;
  }

  static saveSchedule(sch: ServiceSchedule, actor: { id: string; name: string; role: Role }) {
    const items = this.getSchedules();
    const index = items.findIndex((i) => i.id === sch.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = sch;
    } else {
      items.push(sch);
    }
    this.setStored('service_schedules', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_SCHEDULE' : 'CREATE_SCHEDULE',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(sch)
    );
  }

  static deleteSchedule(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getSchedules();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('service_schedules', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_SCHEDULE', JSON.stringify(before), undefined);
  }

  static getEventRegistrations(): EventRegistration[] {
    return this.getStored('event_registrations', DEFAULT_EVENT_REGISTRATIONS);
  }

  static registerForEvent(reg: EventRegistration) {
    const items = this.getEventRegistrations();
    items.push(reg);
    this.setStored('event_registrations', items);

    // Increment registeredCount
    const events = this.getEvents();
    const event = events.find((e) => e.id === reg.eventId);
    if (event) {
      event.registeredCount += 1;
      this.setStored('events', events);
    }
  }

  static updateRegistrationStatus(id: string, status: 'approved' | 'pending' | 'rejected', actor: { id: string; name: string; role: Role }) {
    const items = this.getEventRegistrations();
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) {
      const before = items[index];
      items[index] = { ...before, status };
      this.setStored('event_registrations', items);
      this.addLog(actor, 'UPDATE_EVENT_REGISTRATION_STATUS', JSON.stringify(before), JSON.stringify(items[index]));
    }
  }

  static checkInAttendee(id: string, actor: { id: string; name: string; role: Role }): boolean {
    const items = this.getEventRegistrations();
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) {
      const before = items[index];
      items[index] = { ...before, attended: true };
      this.setStored('event_registrations', items);
      this.addLog(actor, 'EVENT_ATTENDEE_CHECKIN', JSON.stringify(before), JSON.stringify(items[index]));
      return true;
    }
    return false;
  }

  static getGallery(): Gallery[] {
    return this.getStored('gallery', DEFAULT_GALLERY);
  }

  static saveGallery(gal: Gallery, actor: { id: string; name: string; role: Role }) {
    const items = this.getGallery();
    const index = items.findIndex((i) => i.id === gal.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = gal;
    } else {
      items.push(gal);
    }
    this.setStored('gallery', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_GALLERY' : 'CREATE_GALLERY',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(gal)
    );
  }

  static deleteGallery(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getGallery();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('gallery', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_GALLERY', JSON.stringify(before), undefined);
  }

  static getOrganizations(): Organization[] {
    return this.getStored('organizations', DEFAULT_ORGANIZATIONS);
  }

  static saveOrganization(org: Organization, actor: { id: string; name: string; role: Role }) {
    const items = this.getOrganizations();
    const index = items.findIndex((i) => i.id === org.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = org;
    } else {
      items.push(org);
    }
    // Sort by order
    items.sort((a, b) => a.order - b.order);
    this.setStored('organizations', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_ORGANIZATION' : 'CREATE_ORGANIZATION',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(org)
    );
  }

  static deleteOrganization(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getOrganizations();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('organizations', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_ORGANIZATION', JSON.stringify(before), undefined);
  }

  static getMinistries(): Ministry[] {
    return this.getStored('ministries', DEFAULT_MINISTRIES);
  }

  static saveMinistry(min: Ministry, actor: { id: string; name: string; role: Role }) {
    const items = this.getMinistries();
    const index = items.findIndex((i) => i.id === min.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = min;
    } else {
      items.push(min);
    }
    this.setStored('ministries', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_MINISTRY' : 'CREATE_MINISTRY',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(min)
    );
  }

  static deleteMinistry(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getMinistries();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('ministries', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_MINISTRY', JSON.stringify(before), undefined);
  }

  static getCongregations(): Congregation[] {
    return this.getStored('congregations', DEFAULT_CONGREGATIONS);
  }

  static saveCongregation(cong: Congregation, actor: { id: string; name: string; role: Role }) {
    const items = this.getCongregations();
    const index = items.findIndex((i) => i.id === cong.id);
    const before = index >= 0 ? items[index] : null;

    if (index >= 0) {
      items[index] = cong;
    } else {
      items.push(cong);
    }
    this.setStored('congregations', items);

    this.addLog(
      actor,
      index >= 0 ? 'UPDATE_CONGREGATION' : 'CREATE_CONGREGATION',
      before ? JSON.stringify(before) : undefined,
      JSON.stringify(cong)
    );
  }

  static deleteCongregation(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getCongregations();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('congregations', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_CONGREGATION', JSON.stringify(before), undefined);
  }

  static getComments(): Comment[] {
    return this.getStored('comments', DEFAULT_COMMENTS);
  }

  static saveComment(comment: Comment) {
    const items = this.getComments();
    const index = items.findIndex((i) => i.id === comment.id);
    if (index >= 0) {
      items[index] = comment;
    } else {
      items.push(comment);
    }
    this.setStored('comments', items);

    // Update news or devotion count
    if (comment.targetType === 'news' && comment.status === 'approved') {
      const news = this.getNews();
      const n = news.find((ni) => ni.id === comment.targetId);
      if (n) {
        n.commentsCount = items.filter((c) => c.targetId === n.id && c.status === 'approved').length;
        this.setStored('news', news);
      }
    }
  }

  static moderateComment(id: string, status: 'approved' | 'rejected' | 'spam', actor: { id: string; name: string; role: Role }) {
    const items = this.getComments();
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) {
      const before = items[index];
      items[index] = { ...before, status };
      this.setStored('comments', items);
      this.addLog(actor, 'MODERATE_COMMENT', JSON.stringify(before), JSON.stringify(items[index]));

      // Update counters
      const targetId = before.targetId;
      if (before.targetType === 'news') {
        const news = this.getNews();
        const n = news.find((ni) => ni.id === targetId);
        if (n) {
          n.commentsCount = items.filter((c) => c.targetId === n.id && c.status === 'approved').length;
          this.setStored('news', news);
        }
      }
    }
  }

  static deleteComment(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getComments();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('comments', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_COMMENT', JSON.stringify(before), undefined);
  }

  static getNotifications(): ChurchNotification[] {
    return this.getStored('notifications', DEFAULT_NOTIFICATIONS);
  }

  static broadcastNotification(notif: ChurchNotification, actor: { id: string; name: string; role: Role }) {
    const items = this.getNotifications();
    items.unshift(notif); // Put latest on top
    this.setStored('notifications', items);

    this.addLog(actor, 'BROADCAST_NOTIFICATION', undefined, JSON.stringify(notif));

    // Support a reactive virtual service worker notification triggered in client-side
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notif.title, {
          body: notif.content,
          icon: '/favicon.ico',
        });
      }
    }
  }

  static deleteNotification(id: string, actor: { id: string; name: string; role: Role }) {
    const items = this.getNotifications();
    const before = items.find((i) => i.id === id);
    if (!before) return;

    this.setStored('notifications', items.filter((i) => i.id !== id));
    this.addLog(actor, 'DELETE_NOTIFICATION', JSON.stringify(before), undefined);
  }

  static clearAllNotifications(actor: { id: string; name: string; role: Role }) {
    this.setStored('notifications', []);
    this.addLog(actor, 'CLEAR_ALL_NOTIFICATIONS', undefined, 'All notifications deleted');
  }

  static getPrayerRequests(): PrayerRequest[] {
    return this.getStored('prayer_requests', DEFAULT_PRAYER_REQUESTS);
  }

  static addPrayerRequest(req: PrayerRequest) {
    const items = this.getPrayerRequests();
    items.unshift(req);
    this.setStored('prayer_requests', items);
  }

  static updatePrayerStatus(id: string, status: 'pending' | 'prayed' | 'answered', actor: { id: string; name: string; role: Role }) {
    const items = this.getPrayerRequests();
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) {
      const before = items[index];
      items[index] = { ...before, status };
      this.setStored('prayer_requests', items);
      this.addLog(actor, 'UPDATE_PRAYER_STATUS', JSON.stringify(before), JSON.stringify(items[index]));
    }
  }

  static getLogs(): ActivityLog[] {
    return this.getStored('activity_logs', DEFAULT_ACTIVITY_LOGS);
  }

  static addLog(
    actor: { id: string; name: string; role: Role },
    action: string,
    beforeData?: string,
    afterData?: string,
    status: 'success' | 'failed' = 'success'
  ) {
    const logs = this.getLogs();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser';
    let device = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = /iPhone/i.test(userAgent) ? 'iPhone' : 'Android Mobile';
    } else if (/iPad|Tablet/i.test(userAgent)) {
      device = 'Tablet';
    }

    const browser = /Chrome/i.test(userAgent)
      ? 'Chrome'
      : /Safari/i.test(userAgent)
      ? 'Safari'
      : /Firefox/i.test(userAgent)
      ? 'Firefox'
      : 'Web Browser';

    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: actor.id,
      userName: actor.name,
      role: actor.role,
      action,
      ip: '127.0.0.1 (Local Client)',
      browser,
      device,
      date: new Date().toISOString(),
      beforeData,
      afterData,
      status,
    };

    logs.unshift(newLog); // Newer logs at the top
    if (logs.length > 300) {
      logs.pop(); // Cap logs to prevent localStorage fill
    }
    this.setStored('activity_logs', logs);
  }

  static clearLogs(actor: { id: string; name: string; role: Role }) {
    this.setStored('activity_logs', []);
    this.addLog(actor, 'CLEAR_ACTIVITY_LOGS', 'Logs cleared', undefined);
  }

  static restoreDatabase(jsonString: string, actor: { id: string; name: string; role: Role }): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.settings) this.setStored('settings', parsed.settings);
      if (parsed.users) this.setStored('users', parsed.users);
      if (parsed.announcements) this.setStored('announcements', parsed.announcements);
      if (parsed.news) this.setStored('news', parsed.news);
      if (parsed.devotions) this.setStored('devotions', parsed.devotions);
      if (parsed.events) this.setStored('events', parsed.events);
      if (parsed.service_schedules) this.setStored('service_schedules', parsed.service_schedules);
      if (parsed.event_registrations) this.setStored('event_registrations', parsed.event_registrations);
      if (parsed.gallery) this.setStored('gallery', parsed.gallery);
      if (parsed.organizations) this.setStored('organizations', parsed.organizations);
      if (parsed.ministries) this.setStored('ministries', parsed.ministries);
      if (parsed.congregations) this.setStored('congregations', parsed.congregations);
      if (parsed.comments) this.setStored('comments', parsed.comments);
      if (parsed.notifications) this.setStored('notifications', parsed.notifications);
      if (parsed.prayer_requests) this.setStored('prayer_requests', parsed.prayer_requests);
      
      this.addLog(actor, 'DATABASE_RESTORE', undefined, 'Full database restore successfully performed');
      return true;
    } catch (e) {
      this.addLog(actor, 'DATABASE_RESTORE', undefined, 'Restore failed due to invalid JSON', 'failed');
      return false;
    }
  }

  static exportDatabase(): string {
    const fullBackup = {
      settings: this.getSettings(),
      users: this.getUsers(),
      announcements: this.getAnnouncements(),
      news: this.getNews(),
      devotions: this.getDevotions(),
      events: this.getEvents(),
      service_schedules: this.getSchedules(),
      event_registrations: this.getEventRegistrations(),
      gallery: this.getGallery(),
      organizations: this.getOrganizations(),
      ministries: this.getMinistries(),
      congregations: this.getCongregations(),
      comments: this.getComments(),
      notifications: this.getNotifications(),
      prayer_requests: this.getPrayerRequests(),
    };
    return JSON.stringify(fullBackup, null, 2);
  }
}
