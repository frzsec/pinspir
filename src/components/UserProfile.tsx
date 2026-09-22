'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Coins,
  Pencil,
  Star,
  Flame,
  Moon,
  Shield,
  BarChart2,
  Monitor,
  Store,
  Lock,
  Settings,
  Shirt,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  cost?: number;
  isDanger?: boolean;
}

const badges: Badge[] = [
  {
    id: 1,
    name: 'Survivor',
    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
    unlocked: true
  },
  {
    id: 2,
    name: 'Perencana\nHandal',
    icon: <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    unlocked: false
  },
  {
    id: 3,
    name: 'Cerdik\nDigital',
    icon: <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />,
    unlocked: false
  },
  {
    id: 4,
    name: 'Pengusaha\nPemula',
    icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
    unlocked: false
  }
];

const menuItems: MenuItem[] = [
  { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  { id: 'wardrobe', label: "Foxy's Wardrobe", icon: <Shirt className="w-5 h-5" />, cost: 150 },
  { id: 'help', label: 'Bantuan', icon: <HelpCircle className="w-5 h-5" /> },
  { id: 'logout', label: 'Keluar', icon: <LogOut className="w-5 h-5" />, isDanger: true }
];

interface UserProfileProps {
  onBack?: () => void;
  hideBottomNav?: boolean;
  standalone?: boolean;
}

export default function UserProfile({
  onBack,
  hideBottomNav = false,
  standalone = true
}: UserProfileProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard');
    }
  };

  const handleMenuClick = (menuId: string) => {
    if (menuId === 'logout') {
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        router.push('/auth/login');
      }
    }
  };

  const content = (
    <>
      {/* 
        Top Pinned Header (Snug top padding matching dashboard pt-3 sm:pt-4)
      */}
      <header className="w-full px-4 sm:px-5 pt-3 sm:pt-4 pb-2 flex items-center justify-between shrink-0 z-20 bg-[#F3F9F4]/95 backdrop-blur-xs">
        <button
          onClick={handleBack}
          aria-label="Kembali"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#08A05E] shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[#08A05E] font-bold text-base sm:text-lg">Profil</h1>
        <div className="flex items-center gap-1.5 bg-[#FFF2D7] px-3 py-1.5 rounded-full shadow-2xs">
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F5A623]" />
          <span className="text-[#F5A623] text-xs font-bold">1,250 XP</span>
        </div>
      </header>

      {/* 
        Scrollable Main Content Area (Pinned between header and bottom nav with min-h-0)
      */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative z-10 pb-6 select-none scroll-smooth no-scrollbar">
        {/* Profile Avatar & Info */}
        <div className="flex flex-col items-center mt-1 px-4 sm:px-6">
          <div className="relative mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-xs flex items-center justify-center p-1.5">
              <div className="w-full h-full rounded-full bg-[#FFF5E5] flex items-center justify-center overflow-hidden">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 text-[#F5A623]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
            </div>
            <button
              aria-label="Edit Foto Profil"
              className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#08A05E] rounded-full flex items-center justify-center text-white border-2 border-[#F3F9F4] shadow-xs hover:bg-[#0a8f52] transition-colors cursor-pointer active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="text-[#1A1A1A] font-bold text-lg sm:text-xl mb-1">Ahmad</h2>
          <div className="flex items-center gap-1.5 bg-[#E6F5EC] px-3 py-1 rounded-full border border-emerald-200/50">
            <Star className="w-3.5 h-3.5 text-[#08A05E] fill-current" />
            <span className="text-[#08A05E] text-[11px] sm:text-xs font-bold">Level 3 · Pencatat Rajin</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 px-4 sm:px-5 mt-5">
          <div className="bg-white rounded-[20px] sm:rounded-[22px] p-3 sm:p-3.5 flex flex-col items-center justify-center shadow-xs border border-gray-100">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5A623] mb-1 fill-current" />
            <p className="text-[#4A5568] text-[10px] sm:text-[11px] font-semibold mb-0.5">Streak</p>
            <p className="text-[#1A1A1A] font-extrabold text-base sm:text-lg">5 hari</p>
          </div>
          <div className="bg-white rounded-[20px] sm:rounded-[22px] p-3 sm:p-3.5 flex flex-col items-center justify-center shadow-xs border border-gray-100">
            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-[#718096] mb-1 fill-current" />
            <p className="text-[#4A5568] text-[10px] sm:text-[11px] font-semibold mb-0.5">Koin</p>
            <p className="text-[#F5A623] font-extrabold text-base sm:text-lg">1.2rb</p>
          </div>
          <div className="bg-white rounded-[20px] sm:rounded-[22px] p-3 sm:p-3.5 flex flex-col items-center justify-center shadow-xs border border-gray-100">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#08A05E] mb-1 fill-emerald-100" />
            <p className="text-[#4A5568] text-[10px] sm:text-[11px] font-semibold mb-0.5">XP</p>
            <p className="text-[#08A05E] font-extrabold text-base sm:text-lg">480</p>
          </div>
        </div>

        {/* Badge Collection */}
        <div className="px-4 sm:px-5 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[#1A1A1A] font-bold text-sm sm:text-base">Koleksi Badge</h3>
            <button className="text-[#08A05E] text-xs font-bold hover:underline cursor-pointer">
              Lihat Semua
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {badges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1 relative transition-transform active:scale-95 ${
                    badge.unlocked
                      ? 'bg-[#CCECE0]'
                      : 'bg-transparent border-2 border-[#E2E8F0]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-2xs ${
                      badge.unlocked
                        ? 'bg-[#08A05E] text-white'
                        : 'bg-[#F7FAFC] text-[#A0AEC0]'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  {!badge.unlocked && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#E2E8F0]">
                      <Lock className="w-2.5 h-2.5 text-[#A0AEC0]" />
                    </div>
                  )}
                </div>
                <p
                  className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight whitespace-pre-line ${
                    badge.unlocked ? 'text-[#1A1A1A]' : 'text-[#A0AEC0] opacity-70'
                  }`}
                >
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 sm:px-5 mt-6 mb-2">
          <div className="bg-white rounded-[22px] sm:rounded-[24px] overflow-hidden shadow-xs border border-gray-100">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center justify-between p-3.5 sm:p-4 cursor-pointer ${
                  index !== menuItems.length - 1 ? 'border-b border-[#F7FAFC]' : ''
                } hover:bg-gray-50 active:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={item.isDanger ? 'text-[#E53E3E]' : 'text-[#4A5568]'}>
                    {item.icon}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      item.isDanger ? 'text-[#E53E3E]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.cost && (
                    <div className="flex items-center gap-1 bg-[#FFF2D7] px-2 py-0.5 rounded-full">
                      <Coins className="w-3 h-3 text-[#F5A623]" />
                      <span className="text-[#1A1A1A] text-[10px] font-bold">{item.cost}</span>
                    </div>
                  )}
                  <ChevronRight className={`w-4 h-4 ${item.isDanger ? 'text-[#E53E3E]' : 'text-[#A0AEC0]'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 
        Bottom Navigation Bar (Pinned with exact safe-area insets & styling)
      */}
      {!hideBottomNav && (
        <nav
          className="w-full bg-white rounded-t-[28px] shadow-[0_-6px_24px_rgba(0,0,0,0.07)] flex items-start justify-around pt-4 shrink-0 z-20"
          style={{
            minHeight: '84px',
            paddingBottom: 'max(18px, env(safe-area-inset-bottom))'
          }}
        >
          {/* 1. Home */}
          <Link
            href="/dashboard"
            aria-label="Home"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <svg width="20" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 16H5V10H11V16H14V7L8 2.5L2 7V16ZM0 18V6L8 0L16 6V18H9V12H7V18H0Z"
                fill="#3C4A42"
              />
            </svg>
          </Link>

          {/* 2. Book / Cerita */}
          <Link
            href="/chapter"
            aria-label="Cerita & Chapter"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <svg width="24" height="22" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11 19.5C10.2 18.8667 9.33333 18.375 8.4 18.025C7.46667 17.675 6.5 17.5 5.5 17.5C4.8 17.5 4.1125 17.5917 3.4375 17.775C2.7625 17.9583 2.11667 18.2167 1.5 18.55C1.15 18.7333 0.8125 18.725 0.4875 18.525C0.1625 18.325 0 18.0333 0 17.65V5.6C0 5.41667 0.0458333 5.24167 0.1375 5.075C0.229167 4.90833 0.366667 4.78333 0.55 4.7C1.31667 4.3 2.11667 4 2.95 3.8C3.78333 3.6 4.63333 3.5 5.5 3.5C6.46667 3.5 7.4125 3.625 8.3375 3.875C9.2625 4.125 10.15 4.5 11 5V17.1C11.85 16.5667 12.7417 16.1667 13.675 15.9C14.6083 15.6333 15.55 15.5 16.5 15.5C17.1 15.5 17.6875 15.55 18.2625 15.65C18.8375 15.75 19.4167 15.9 20 16.1V4.1C20.25 4.18333 20.4958 4.27083 20.7375 4.3625C20.9792 4.45417 21.2167 4.56667 21.45 4.7C21.6333 4.78333 21.7708 4.90833 21.8625 5.075C21.9542 5.24167 22 5.41667 22 5.6V17.65C22 18.0333 21.8375 18.325 21.5125 18.525C21.1875 18.725 20.85 18.7333 20.5 18.55C19.8833 18.2167 19.2375 17.9583 18.5625 17.775C17.8875 17.5917 17.2 17.5 16.5 17.5C15.5 17.5 14.5333 17.675 13.6 18.025C12.6667 18.375 11.8 18.8667 11 19.5ZM13 14.5V5L18 0V10L13 14.5Z"
                fill="#3C4A42"
              />
            </svg>
          </Link>

          {/* 3. Gamepad */}
          <Link
            href="/game"
            aria-label="Mini-game"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <svg width="22" height="16" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.535 14C1.685 14 1.02667 13.7042 0.56 13.1125C0.0933333 12.5208 -0.0816667 11.8 0.035 10.95L1.085 3.45C1.235 2.45 1.68083 1.625 2.4225 0.975C3.16417 0.325 4.035 0 5.035 0H14.935C15.935 0 16.8058 0.325 17.5475 0.975C18.2892 1.625 18.735 2.45 18.885 3.45L19.935 10.95C20.0517 11.8 19.8767 12.5208 19.41 13.1125C18.9433 13.7042 18.285 14 17.435 14C17.085 14 16.76 13.9375 16.46 13.8125C16.16 13.6875 15.885 13.5 15.635 13.25L13.385 11H6.585L4.335 13.25C4.085 13.5 3.81 13.6875 3.51 13.8125C3.21 13.9375 2.885 14 2.535 14ZM2.935 11.85L5.785 9H14.185L17.035 11.85C17.0683 11.8833 17.2017 11.9333 17.435 12C17.6183 12 17.7642 11.9458 17.8725 11.8375C17.9808 11.7292 18.0183 11.5833 17.985 11.4L16.885 3.7C16.8183 3.21667 16.6017 2.8125 16.235 2.4875C15.8683 2.1625 15.435 2 14.935 2H5.035C4.535 2 4.10167 2.1625 3.735 2.4875C3.36833 2.8125 3.15167 3.21667 3.085 3.7L1.985 11.4C1.95167 11.5833 1.98917 11.7292 2.0975 11.8375C2.20583 11.9458 2.35167 12 2.535 12C2.56833 12 2.70167 11.95 2.935 11.85ZM14.985 8C15.2683 8 15.5058 7.90417 15.6975 7.7125C15.8892 7.52083 15.985 7.28333 15.985 7C15.985 6.71667 15.8892 6.47917 15.6975 6.2875C15.5058 6.09583 15.2683 6 14.985 6C14.7017 6 14.4642 6.09583 14.2725 6.2875C14.0808 6.47917 13.985 6.71667 13.985 7C13.985 7.28333 14.0808 7.52083 14.2725 7.7125C14.4642 7.90417 14.7017 8 14.985 8ZM12.985 5C13.2683 5 13.5058 4.90417 13.6975 4.7125C13.8892 4.52083 13.985 4.28333 13.985 4C13.985 3.71667 13.8892 3.47917 13.6975 3.2875C13.5058 3.09583 13.2683 3 12.985 3C12.7017 3 12.4642 3.09583 12.2725 3.2875C12.0808 3.47917 11.985 3.71667 11.985 4C11.985 4.28333 12.0808 4.52083 12.2725 4.7125C12.4642 4.90417 12.7017 5 12.985 5ZM5.735 8H7.235V6.25H8.985V4.75H7.235V3H5.735V4.75H3.985V6.25H5.735V8Z"
                fill="#3C4A42"
              />
            </svg>
          </Link>

          {/* 4. Stats / Leaderboard */}
          <Link
            href="/progress"
            aria-label="Peringkat"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <svg width="22" height="20" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 16H6V8H2V16ZM8 16H12V2H8V16ZM14 16H18V10H14V16ZM0 18V6H6V0H14V8H20V18H0Z"
                fill="#3C4A42"
              />
            </svg>
          </Link>

          {/* 5. Profile (Active Green Pill) */}
          <button
            aria-label="Profil"
            className="flex items-center justify-center rounded-2xl bg-[#00B074] w-12 h-11 cursor-pointer transition-transform active:scale-95 shadow-sm text-[#00422B]"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                fill="#00422B"
              />
            </svg>
          </button>
        </nav>
      )}
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#EBF8EF] flex items-center justify-center font-nunitoSans selection:bg-emerald-200">
        {/* 
          Responsive device container:
          - Mobile: Full width, exactly 100dvh, flex-col with pinned top/bottom bars and smooth scrolling body
          - Desktop: Centered frame max-w-[420px] with sleek shadow & rounded corners
        */}
        <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[880px] sm:max-h-[95vh] bg-[#F3F9F4] flex flex-col justify-between overflow-hidden shadow-2xl sm:rounded-3xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden bg-[#F3F9F4] select-none font-nunitoSans">
      {content}
    </div>
  );
}
