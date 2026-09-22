'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Check,
  Play,
  Lock,
  ChevronDown,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// Exact SVG Icon for Book from Dashboard Navigation
export function BookNavIcon({
  className = 'w-6 h-5',
  color = 'currentColor'
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11 19.5C10.2 18.8667 9.33333 18.375 8.4 18.025C7.46667 17.675 6.5 17.5 5.5 17.5C4.8 17.5 4.1125 17.5917 3.4375 17.775C2.7625 17.9583 2.11667 18.2167 1.5 18.55C1.15 18.7333 0.8125 18.725 0.4875 18.525C0.1625 18.325 0 18.0333 0 17.65V5.6C0 5.41667 0.0458333 5.24167 0.1375 5.075C0.229167 4.90833 0.366667 4.78333 0.55 4.7C1.31667 4.3 2.11667 4 2.95 3.8C3.78333 3.6 4.63333 3.5 5.5 3.5C6.46667 3.5 7.4125 3.625 8.3375 3.875C9.2625 4.125 10.15 4.5 11 5V17.1C11.85 16.5667 12.7417 16.1667 13.675 15.9C14.6083 15.6333 15.55 15.5 16.5 15.5C17.1 15.5 17.6875 15.55 18.2625 15.65C18.8375 15.75 19.4167 15.9 20 16.1V4.1C20.25 4.18333 20.4958 4.27083 20.7375 4.3625C20.9792 4.45417 21.2167 4.56667 21.45 4.7C21.6333 4.78333 21.7708 4.90833 21.8625 5.075C21.9542 5.24167 22 5.41667 22 5.6V17.65C22 18.0333 21.8375 18.325 21.5125 18.525C21.1875 18.725 20.85 18.7333 20.5 18.55C19.8833 18.2167 19.2375 17.9583 18.5625 17.775C17.8875 17.5917 17.2 17.5 16.5 17.5C15.5 17.5 14.5333 17.675 13.6 18.025C12.6667 18.375 11.8 18.8667 11 19.5ZM13 14.5V5L18 0V10L13 14.5Z"
        fill={color}
      />
    </svg>
  );
}

// Home Icon SVG
function HomeNavIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16H5V10H11V16H14V7L8 2.5L2 7V16ZM0 18V6L8 0L16 6V18H9V12H7V18H0Z"
        fill={color}
      />
    </svg>
  );
}

// Gamepad Icon SVG
function GamepadNavIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="22" height="16" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.535 14C1.685 14 1.02667 13.7042 0.56 13.1125C0.0933333 12.5208 -0.0816667 11.8 0.035 10.95L1.085 3.45C1.235 2.45 1.68083 1.625 2.4225 0.975C3.16417 0.325 4.035 0 5.035 0H14.935C15.935 0 16.8058 0.325 17.5475 0.975C18.2892 1.625 18.735 2.45 18.885 3.45L19.935 10.95C20.0517 11.8 19.8767 12.5208 19.41 13.1125C18.9433 13.7042 18.285 14 17.435 14C17.085 14 16.76 13.9375 16.46 13.8125C16.16 13.6875 15.885 13.5 15.635 13.25L13.385 11H6.585L4.335 13.25C4.085 13.5 3.81 13.6875 3.51 13.8125C3.21 13.9375 2.885 14 2.535 14ZM2.935 11.85L5.785 9H14.185L17.035 11.85C17.0683 11.8833 17.2017 11.9333 17.435 12C17.6183 12 17.7642 11.9458 17.8725 11.8375C17.9808 11.7292 18.0183 11.5833 17.985 11.4L16.885 3.7C16.8183 3.21667 16.6017 2.8125 16.235 2.4875C15.8683 2.1625 15.435 2 14.935 2H5.035C4.535 2 4.10167 2.1625 3.735 2.4875C3.36833 2.8125 3.15167 3.21667 3.085 3.7L1.985 11.4C1.95167 11.5833 1.98917 11.7292 2.0975 11.8375C2.20583 11.9458 2.35167 12 2.535 12C2.56833 12 2.70167 11.95 2.935 11.85ZM14.985 8C15.2683 8 15.5058 7.90417 15.6975 7.7125C15.8892 7.52083 15.985 7.28333 15.985 7C15.985 6.71667 15.8892 6.47917 15.6975 6.2875C15.5058 6.09583 15.2683 6 14.985 6C14.7017 6 14.4642 6.09583 14.2725 6.2875C14.0808 6.47917 13.985 6.71667 13.985 7C13.985 7.28333 14.0808 7.52083 14.2725 7.7125C14.4642 7.90417 14.7017 8 14.985 8ZM12.985 5C13.2683 5 13.5058 4.90417 13.6975 4.7125C13.8892 4.52083 13.985 4.28333 13.985 4C13.985 3.71667 13.8892 3.47917 13.6975 3.2875C13.5058 3.09583 13.2683 3 12.985 3C12.7017 3 12.4642 3.09583 12.2725 3.2875C12.0808 3.47917 11.985 3.71667 11.985 4C11.985 4.28333 12.0808 4.52083 12.2725 4.7125C12.4642 4.90417 12.7017 5 12.985 5ZM5.735 8H7.235V6.25H8.985V4.75H7.235V3H5.735V4.75H3.985V6.25H5.735V8Z"
        fill={color}
      />
    </svg>
  );
}

// Progress / Leaderboard Icon SVG
function ProgressNavIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="22" height="20" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16H6V8H2V16ZM8 16H12V2H8V16ZM14 16H18V10H14V16ZM0 18V6H6V0H14V8H20V18H0Z"
        fill={color}
      />
    </svg>
  );
}

// Profile Icon SVG
function ProfileNavIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
        fill={color}
      />
    </svg>
  );
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'active' | 'locked';
}

interface Chapter {
  id: number;
  numberText: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  status: 'completed' | 'active' | 'locked';
  lessons: Lesson[];
}

const initialChapters: Chapter[] = [
  {
    id: 1,
    numberText: 'Chapter 1',
    title: 'Tabung Dulu, Impian Nanti',
    category: 'Cerita Finansial',
    description: 'Pelajari konsep menabung harian, membedakan kebutuhan vs keinginan, dan capai target celengan pertama.',
    duration: '20 min',
    status: 'active',
    lessons: [
      {
        id: 1,
        title: 'Pengenalan Uang & Celengan',
        description: 'Mengenal fungsi uang dan cara menyisihkan koin pertama ke celengan',
        duration: '2 min',
        status: 'completed'
      },
      {
        id: 2,
        title: 'Butuh vs Ingin',
        description: 'Latihan seru membedakan mana barang yang benar-benar dibutuhkan',
        duration: '3 min',
        status: 'active'
      },
      {
        id: 3,
        title: 'Menahan Godaan Jajan',
        description: 'Tips cerdas menahan lapar mata saat melihat jajanan di sekolah',
        duration: '5 min',
        status: 'locked'
      },
      {
        id: 4,
        title: 'Misi Target Impian',
        description: 'Hitung berapa hari kamu perlu menabung untuk mainan impian',
        duration: '10 min',
        status: 'locked'
      }
    ]
  },
  {
    id: 2,
    numberText: 'Chapter 2',
    title: 'Pondasi Dana Darurat',
    category: 'Keamanan Finansial',
    description: 'Mengapa kita butuh simpanan darurat saat ban sepedamu bocor atau buku hilang.',
    duration: '25 min',
    status: 'locked',
    lessons: [
      {
        id: 5,
        title: 'Apa itu Keadaan Darurat?',
        description: 'Mengenal situasi tak terduga yang membutuhkan biaya mendesak',
        duration: '3 min',
        status: 'locked'
      },
      {
        id: 6,
        title: 'Pos Tabungan Khusus',
        description: 'Cara memisahkan uang jajan harian dan simpanan jaga-jaga',
        duration: '4 min',
        status: 'locked'
      },
      {
        id: 7,
        title: 'Menyelamatkan Keuangan Teman',
        description: 'Studi kasus membantu teman yang kehabisan ongkos pulang',
        duration: '5 min',
        status: 'locked'
      },
      {
        id: 8,
        title: 'Evaluasi Tabungan Darurat',
        description: 'Quiz cerdas menguji kesiapan dana cadanganmu',
        duration: '5 min',
        status: 'locked'
      }
    ]
  },
  {
    id: 3,
    numberText: 'Chapter 3',
    title: 'Cerdas Mengatur Anggaran',
    category: 'Budgeting Master',
    description: 'Membagi uang saku ke dalam metode 50-30-20 versi anak muda yang simpel.',
    duration: '30 min',
    status: 'locked',
    lessons: [
      {
        id: 9,
        title: 'Rumus Tiga Toples Ajaib',
        description: 'Toples jajan, toples tabung, dan toples berbagi ke sesama',
        duration: '5 min',
        status: 'locked'
      },
      {
        id: 10,
        title: 'Mencatat Pengeluaran Harian',
        description: 'Catat kemana saja uang 10 ribu pertamamu pergi dalam seminggu',
        duration: '5 min',
        status: 'locked'
      },
      {
        id: 11,
        title: 'Belanja Pintar di Pasar & Toko',
        description: 'Bandingkan harga dan kualitas sebelum memutuskan membeli',
        duration: '6 min',
        status: 'locked'
      }
    ]
  },
  {
    id: 4,
    numberText: 'Chapter 4',
    title: 'Investasi & Masa Depan',
    category: 'Pertumbuhan Nilai',
    description: 'Bagaimana uang bisa tumbuh dan bekerja untuk impian jangka panjangmu.',
    duration: '35 min',
    status: 'locked',
    lessons: [
      {
        id: 12,
        title: 'Pohon Uang & Bunga Bergulung',
        description: 'Analog pohon yang disiram dan menghasilkan buah berlipat',
        duration: '10 min',
        status: 'locked'
      },
      {
        id: 13,
        title: 'Misi Kelulusan Finspire',
        description: 'Tantangan akhir menjadi Master Finansial Mandiri',
        duration: '12 min',
        status: 'locked'
      }
    ]
  }
];

interface LearningAppProps {
  onBack?: () => void;
  onNavigateTab?: (tabId: string) => void;
  activeTab?: string;
  hideBottomNav?: boolean;
}

export default function LearningApp({
  onBack,
  onNavigateTab,
  activeTab = 'cerita',
  hideBottomNav = false
}: LearningAppProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [currentLessonId, setCurrentLessonId] = useState<number>(2);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentChapter =
    chapters.find((c) => c.id === currentChapterId) || chapters[0];

  const completedLessonsInChapter = currentChapter.lessons.filter(
    (l) => l.status === 'completed'
  ).length;
  const chapterProgressPercent = Math.round(
    (completedLessonsInChapter / currentChapter.lessons.length) * 100
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectChapter = (chapter: Chapter) => {
    if (chapter.status === 'locked') {
      triggerToast(`🔒 ${chapter.numberText} masih terkunci. Selesaikan chapter sebelumnya!`);
      return;
    }
    setCurrentChapterId(chapter.id);
    const activeOrFirst =
      chapter.lessons.find((l) => l.status === 'active') || chapter.lessons[0];
    if (activeOrFirst) {
      setCurrentLessonId(activeOrFirst.id);
    }
    setIsChapterModalOpen(false);
  };

  const handleStartLesson = (lesson: Lesson) => {
    if (lesson.status === 'locked') return;
    setCurrentLessonId(lesson.id);
  };

  const getStatusIcon = (status: string, lessonId: number) => {
    if (status === 'completed') {
      return <Check className="w-5 h-5 text-emerald-600" />;
    }
    return <span className="text-lg font-bold text-gray-800">{lessonId}</span>;
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          badge:
            'w-12 h-12 rounded-full bg-white border-[3px] border-emerald-400 flex items-center justify-center shrink-0 mt-2 p-1 shadow-sm',
          innerBadge:
            'w-full h-full bg-emerald-50 rounded-full flex items-center justify-center',
          card: 'bg-[#F2F2F2] rounded-[24px] p-5 flex-1 shadow-sm transition-all hover:bg-[#eaeaea]',
          button:
            'flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer',
          buttonIcon:
            'w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white'
        };
      case 'active':
        return {
          badge:
            'w-12 h-12 rounded-full bg-white border-[3px] border-[#00B074] flex items-center justify-center shrink-0 mt-2 shadow-sm animate-pulse',
          innerBadge: '',
          card: 'bg-white border-2 border-[#00B074]/30 rounded-[24px] p-5 flex-1 shadow-md',
          button:
            'flex items-center gap-2 bg-[#00B074] text-[#00422B] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#009e67] transition-colors shadow-sm cursor-pointer active:scale-95',
          buttonIcon:
            'w-5 h-5 bg-[#00422B]/20 rounded-full flex items-center justify-center text-[#00422B]'
        };
      case 'locked':
        return {
          badge:
            'w-12 h-12 rounded-full bg-white border-[1px] border-gray-200 flex items-center justify-center shrink-0 mt-2 opacity-60',
          innerBadge: '',
          card: 'bg-[#F8F8F8] rounded-[24px] p-5 flex-1 opacity-75 border border-dashed border-gray-200',
          button:
            'flex items-center gap-1.5 bg-transparent text-gray-400 px-2 py-2 rounded-full text-xs font-semibold cursor-not-allowed',
          buttonIcon:
            'w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-400'
        };
      default:
        return {};
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F7FAF8] text-gray-900 pb-28 relative select-none font-nunitoSans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#111111]/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2 animate-bounce">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-[#E3EFE7] rounded-b-[36px] pt-4 sm:pt-5 px-5 pb-5 relative overflow-hidden shadow-xs">
        {/* Soft Background Glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-300/30 rounded-full blur-2xl pointer-events-none"></div>

        {/* Decorative Badge with the Exact Book Icon */}
        <div className="absolute right-4 top-4 pointer-events-none opacity-25 text-emerald-900">
          <BookNavIcon className="w-28 h-28" />
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-3.5 relative z-10">
          <button
            onClick={onBack}
            aria-label="Kembali"
            className="w-11 h-11 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#111111]" />
          </button>

          {/* Quick Chapter Selector on top right */}
          <button
            onClick={() => setIsChapterModalOpen(true)}
            className="flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-[#111111] shadow-xs transition-all active:scale-95 border border-emerald-100 group cursor-pointer"
          >
            <BookNavIcon className="w-4 h-4 text-[#00B074] group-hover:scale-110 transition-transform" />
            <span>{currentChapter.numberText}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-800 transition-transform" />
          </button>
        </div>

        {/* Course & Chapter Info */}
        <div className="mb-6 relative z-10 w-3/4">
          <p className="text-[#00875A] font-bold text-xs tracking-wider uppercase mb-1">
            {currentChapter.category}
          </p>
          <h1 className="text-[#111111] text-[26px] sm:text-[28px] leading-tight font-bold mb-3 tracking-tight">
            {currentChapter.title}
          </h1>
          <p className="text-gray-600 text-xs line-clamp-2 mb-4 leading-relaxed">
            {currentChapter.description}
          </p>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Tombol Chapter di Bagian Header dengan Logo Buku yang Sama */}
            <button
              onClick={() => setIsChapterModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-emerald-50/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-bold text-[#111111] shadow-xs border border-emerald-200/60 transition-all cursor-pointer active:scale-95 group"
            >
              <BookNavIcon className="w-4 h-4 text-[#00B074]" />
              <span>{currentChapter.lessons.length} Materi</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B074]"></span>
              <span className="text-[#00875A] text-[11px]">Pilih Chapter</span>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              {currentChapter.duration}
            </div>
          </div>
        </div>

        {/* AI Buddy / Progress Card */}
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between relative z-10 shadow-xs border border-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-[#00B074] relative overflow-hidden">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold mb-0.5">
                Finspire Buddy • {currentChapter.numberText}
              </p>
              <p className="text-[#111111] text-sm font-bold">
                {chapterProgressPercent === 100
                  ? 'Selamat! Chapter berhasil diselesaikan 🎉'
                  : chapterProgressPercent > 0
                  ? `${completedLessonsInChapter} dari ${currentChapter.lessons.length} materi selesai!`
                  : 'Lanjutkan materi pertamamu hari ini!'}
              </p>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-[44px] h-[44px] shrink-0">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-[#00B074] transition-all duration-700 ease-out"
                strokeDasharray={`${chapterProgressPercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#111111]">
                {chapterProgressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Indicator Bar */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">
            Jalur Pembelajaran
          </span>
          <span className="text-xs bg-[#E3EFE7] text-[#006644] px-2.5 py-0.5 rounded-full font-bold">
            {currentChapter.numberText}
          </span>
        </div>
        <button
          onClick={() => setIsChapterModalOpen(true)}
          className="text-xs text-[#00875A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Daftar Chapter</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lessons List Timeline */}
      <div className="px-6 py-3 flex-1 overflow-y-auto">
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-6 -translate-x-1/2 top-8 bottom-8 w-1.5 bg-gradient-to-b from-[#00B074] via-gray-300 to-transparent rounded-full z-0"></div>

          {currentChapter.lessons.map((lesson) => {
            const styles = getStatusStyles(lesson.status);
            return (
              <div
                key={lesson.id}
                className="flex items-start gap-4 mb-5 relative z-10"
              >
                <div className={styles.badge}>
                  {lesson.status === 'completed' ? (
                    <div className={styles.innerBadge}>
                      {getStatusIcon(lesson.status, lesson.id)}
                    </div>
                  ) : (
                    getStatusIcon(lesson.status, lesson.id)
                  )}
                </div>
                <div className={styles.card}>
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-[#111111] font-bold text-base sm:text-lg">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0 ml-2">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                    {lesson.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {lesson.status === 'completed'
                        ? 'Selesai'
                        : lesson.status === 'active'
                        ? 'Sedang Berlangsung'
                        : 'Terkunci'}
                    </span>
                    <button
                      className={styles.button}
                      onClick={() => handleStartLesson(lesson)}
                      disabled={lesson.status === 'locked'}
                    >
                      <span>
                        {lesson.status === 'completed'
                          ? 'Ulangi'
                          : lesson.status === 'active'
                          ? 'Mulai Belajar'
                          : 'Terkunci'}
                      </span>
                      <div className={styles.buttonIcon}>
                        {lesson.status === 'locked' ? (
                          <Lock className="w-2.5 h-2.5" />
                        ) : (
                          <Play className="w-2.5 h-2.5 ml-0.5" fill="currentColor" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Bottom Sheet: Chapter Navigator */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 transition-all">
          <div
            className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E3EFE7] flex items-center justify-center text-[#006644]">
                  <BookNavIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111111] leading-tight">
                    Pilih Chapter
                  </h2>
                  <p className="text-xs text-gray-500">
                    Buka chapter untuk melanjutkan cerita finansial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chapters Overview Card */}
            <div className="px-5 pt-4 pb-2">
              <div className="bg-[#F2F8F4] rounded-2xl p-4 flex items-center justify-between border border-[#00B074]/15">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Progres Keseluruhan</p>
                  <p className="text-sm font-bold text-[#111111] mt-0.5">
                    1 dari {chapters.length} Chapter Terbuka
                  </p>
                </div>
                <span className="text-xs bg-[#00B074] text-[#00422B] font-bold px-3 py-1 rounded-full shadow-xs">
                  Chapter Aktif
                </span>
              </div>
            </div>

            {/* Chapter List */}
            <div className="p-5 overflow-y-auto space-y-3 max-h-[50vh]">
              {chapters.map((chapter, index) => {
                const isSelected = chapter.id === currentChapterId;
                const isLocked = chapter.status === 'locked';
                const chapterCompletedLessons = chapter.lessons.filter(
                  (l) => l.status === 'completed'
                ).length;
                const progressPct = Math.round(
                  (chapterCompletedLessons / chapter.lessons.length) * 100
                );

                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleSelectChapter(chapter)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50/50 border-[#00B074] shadow-xs ring-2 ring-[#00B074]/20'
                        : isLocked
                        ? 'bg-gray-50/80 border-gray-200/80 opacity-70 hover:opacity-90'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-[#00B074] text-[#00422B] shadow-xs'
                              : isLocked
                              ? 'bg-gray-200 text-gray-400'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : isSelected ? (
                            <BookNavIcon className="w-5 h-5" color="#00422B" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00875A]">
                              {chapter.numberText}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] bg-[#00B074] text-[#00422B] font-bold px-2 py-0.5 rounded-full">
                                Sedang Dipilih
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-[#111111]">
                            {chapter.title}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-semibold">
                          {chapter.duration}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {chapter.description}
                    </p>

                    {/* Footer / Meta */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">
                        {chapter.lessons.length} Materi
                      </span>

                      {!isLocked ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00B074] rounded-full"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-gray-700">
                            {progressPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1 font-semibold text-[11px]">
                          <Lock className="w-3 h-3" /> Terkunci
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="w-full py-3 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar (Matching Exactly the Screenshot & Dashboard Design) */}
      {!hideBottomNav && (
        <nav
          aria-label="Navigasi Utama"
          className="fixed bottom-4 left-4 right-4 max-w-[448px] mx-auto z-40 rounded-[32px] bg-white px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex items-center justify-between"
        >
          {/* 1. Home */}
          <button
            onClick={() => {
              if (onNavigateTab) onNavigateTab('home');
              else if (onBack) onBack();
            }}
            aria-label="Home"
            className={`flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 ${
              activeTab === 'home'
                ? 'rounded-2xl bg-[#00B074] w-12 h-11 text-[#00422B] shadow-sm'
                : 'text-[#3C4A42] hover:opacity-80'
            }`}
          >
            <HomeNavIcon color={activeTab === 'home' ? '#00422B' : '#3C4A42'} />
          </button>

          {/* 2. Book / Cerita (Fitur Chapter dengan Logo Buku yang Dipilih Pengguna) */}
          <button
            onClick={() => setIsChapterModalOpen(true)}
            aria-label="Cerita & Chapter"
            className="flex items-center justify-center rounded-2xl bg-[#00B074] w-12 h-11 cursor-pointer transition-transform active:scale-95 shadow-sm text-[#00422B]"
            title="Buka Pilihan Chapter"
          >
            <BookNavIcon className="w-6 h-5" color="#00422B" />
          </button>

          {/* 3. Gamepad */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('game')}
            aria-label="Mini-game"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <GamepadNavIcon color="#3C4A42" />
          </button>

          {/* 4. Stats / Leaderboard */}
          <Link
            href="/progress"
            aria-label="Peringkat"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <ProgressNavIcon color="#3C4A42" />
          </Link>

          {/* 5. Profile */}
          <Link
            href="/profile"
            aria-label="Profil"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <ProfileNavIcon color="#3C4A42" />
          </Link>
        </nav>
      )}
    </div>
  );
}
