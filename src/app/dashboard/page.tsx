"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Sparkles, Coins, Gamepad2, Wallet, Users } from "lucide-react";

export default function HomeDashboard() {
  const [batteryLevel, setBatteryLevel] = React.useState(100);
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "Semua", count: 4 },
    { id: "cerita", label: "Cerita", icon: "📖", count: 2 },
    { id: "materi", label: "Materi", icon: "💰", count: 1 },
    { id: "game", label: "Game", icon: "🎮", count: 1 },
  ];

  const lessons = [
    {
      id: 1,
      type: "cerita",
      category: "Cerita Finansial",
      title: "Tabung Dulu,\nImpian Nanti",
      description: "Lanjutkan chapter 1 untuk menyelesaikan cerita dan naik level.",
      lessonsCount: "12 materi",
      time: "10 min",
      xp: "+25 XP",
      icon: "coins",
      cardBg: "bg-[#E3EFE7]",
      emoji: "📚",
      actionText: "Mulai cerita",
    },
    {
      id: 2,
      type: "materi",
      category: "Pelajaran Baru",
      title: "Apa itu\nDana Darurat?",
      description: "Pahami pondasi keamanan keuangan dan tabungan pertamamu.",
      lessonsCount: "6 materi",
      time: "5 min",
      xp: "+15 XP",
      icon: "wallet",
      cardBg: "bg-[#E8F0FE]",
      emoji: "💰",
      actionText: "Mulai belajar",
    },
    {
      id: 3,
      type: "game",
      category: "Mini-Game",
      title: "Sortir Cepat\nKebutuhan",
      description: "Tantang refleks memilah butuh vs ingin dan raih bonus XP!",
      lessonsCount: "Level 1",
      time: "3 min",
      xp: "+25 XP",
      icon: "game",
      cardBg: "bg-[#FEF3E2]",
      emoji: "🎮",
      actionText: "Mainkan",
    },
    {
      id: 4,
      type: "cerita",
      category: "Misi Komunitas",
      title: "Invite Teman,\nBonus 10 XP",
      description: "Ajak 1 teman bergabung dan dapatkan tambahan 10 XP langsung.",
      lessonsCount: "Misi",
      time: "2 min",
      xp: "+10 XP",
      icon: "users",
      cardBg: "bg-[#F3E8FF]",
      emoji: "🎁",
      actionText: "Ajak teman",
    },
  ];

  const filteredLessons =
    activeTab === "all"
      ? lessons
      : lessons.filter((lesson) => lesson.type === activeTab);

  // 0-30: merah (#EF4444), 30-60: orange (rgb(255, 176, 85)), 60-100: putih (#FFFFFF)
  const getBatteryColor = (level: number) => {
    if (level <= 30) return "#EF4444";
    if (level <= 60) return "rgb(255, 176, 85)";
    return "#FFFFFF";
  };

  const cycleBatteryLevel = () => {
    setBatteryLevel((prev) => {
      if (prev > 60) return 50;
      if (prev > 30) return 20;
      return 100;
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#EBF8EF] flex items-center justify-center font-nunitoSans selection:bg-emerald-200">
      {/* 
        Responsive device container:
        - Mobile: Full width, exactly 100dvh, flex-col with pinned top/bottom bars and smooth scrolling body
        - Desktop: Centered frame max-w-[420px] with sleek shadow & rounded corners
      */}
      <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[880px] sm:max-h-[95vh] bg-[#F4FBF7] flex flex-col justify-between overflow-hidden shadow-2xl sm:rounded-3xl">
        
        {/* Top Status Bar: XP Streak (Left), Money Balance (Center), Battery (Right) */}
        <header className="w-full px-4 pt-3 sm:pt-4 pb-2 flex items-center justify-between shrink-0 z-20 bg-[#F4FBF7]/90 backdrop-blur-sm">
          {/* Left: Streak XP */}
          <div className="flex items-center gap-1.5">
            <div className="flex justify-center items-center rounded-[10px] bg-[#10B981] w-5 h-5 shadow-xs">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 w-3.5 h-3.5"
              >
                <g clipPath="url(#clip0_streak_nav)">
                  <path
                    d="M8.00023 4.75014C7.00012 3.91677 6.33337 2.83339 6 1.5C5.16657 2.16669 4.74986 2.83339 4.74986 3.50008C4.74986 4.50013 5.49995 5.00015 5.49995 6.00019C5.49995 6.33172 5.36824 6.64968 5.13379 6.88411C4.89934 7.11854 4.58136 7.25024 4.2498 7.25024C3.91824 7.25024 3.60027 7.11854 3.36582 6.88411C3.13137 6.64968 2.99966 6.33172 2.99966 6.00019C2.67507 6.43295 2.4996 6.9593 2.4996 7.50025C2.4996 8.42855 2.86839 9.31883 3.52485 9.97523C4.1813 10.6316 5.07164 11.0004 6 11.0004C6.92837 11.0004 7.81871 10.6316 8.47516 9.97523C9.13161 9.31883 9.5004 8.42855 9.5004 7.50025C9.5004 6.50021 9.00035 5.58351 8.00023 4.75014Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_streak_nav">
                    <rect width="12" height="12" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <p className="text-[#121E18] font-nunitoSans text-[12px] font-bold">12</p>
          </div>

          {/* Center: Money Balance */}
          <div className="flex items-center gap-1.5">
            <img
              src="/assets/dashboard/money.svg"
              alt="Uang"
              className="w-5 h-5 shrink-0 object-contain"
            />
            <p className="text-[#121E18] font-nunitoSans text-[12px] font-bold tracking-tight">Rp10.000</p>
          </div>

          {/* Right: Battery */}
          <div
            className="flex items-center gap-1.5 cursor-pointer select-none"
            onClick={cycleBatteryLevel}
            title="Klik untuk simulasi level baterai"
          >
            <p className="text-[#121E18] font-nunitoSans text-[12px] font-bold">{batteryLevel}%</p>
            <div className="battery-switch" aria-label="Status Baterai">
              <div className="battery">
                <span
                  className="battery-bar"
                  style={{ backgroundColor: getBatteryColor(batteryLevel) }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Body Content (Never overflows screen or clips bottom bar) */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative z-10 pb-6 select-none scroll-smooth">
          <div className="px-5 pt-3 flex flex-col gap-5">
            
            {/* AI Buddy Banner */}
            <div className="w-full bg-[#EEEEEE] rounded-[32px] p-1 relative overflow-hidden shadow-xs">
              <div className="px-5 pt-4 pb-2 relative z-10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="text-gray-500 w-3.5 h-3.5" />
                  <span className="text-[12px] font-medium text-gray-500">Teman AI Fiki</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#111111] max-w-[210px] leading-tight font-nunitoSans">
                  Hai! Siap jadi jagoan kelola uang bareng Fiki? 🦊✨
                </h3>
              </div>

              {/* Background decorative mascot element */}
              <div className="absolute right-2 -top-1 w-20 h-20 opacity-80 pointer-events-none">
                <img
                  src="/Chatgpt_image_6_agu_2026__110456removebgpreview2.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/onboarding/ob1.png";
                  }}
                  alt="Fiki Mascot"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Today's Pick Card */}
              <div className="mt-2 bg-white rounded-[28px] p-4 flex justify-between items-center shadow-xs">
                <div className="flex flex-col">
                  <h4 className="text-[14px] sm:text-[15px] font-bold text-[#111111] mb-1 font-nunitoSans">
                    Cerita Hari Ini: Tabungan
                  </h4>
                  <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      <span>Chapter 1</span>
                    </div>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>10 min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[12px] font-bold text-[#111111]">
                    20% <span className="text-gray-400 font-medium">selesai</span>
                  </span>
                  <button
                    aria-label="Lanjutkan Cerita"
                    className="w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="text-[#111111] text-[13px] ml-0.5">▶</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Let's Learn Section */}
            <div className="flex flex-col">
              <h2 className="text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-nunitoSans">
                Ayo belajar
              </h2>

              {/* Tabs */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 scroll-smooth no-scrollbar">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-1.5 transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#111111] text-white shadow-xs"
                          : "border border-[#E5E5E5] bg-white text-[#111111] hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-[13px] font-bold ${isActive ? "text-white" : "text-[#111111]"}`}>
                        {tab.icon || tab.label}
                      </span>
                      {tab.icon && (
                        <span className={`text-[13px] font-bold ${isActive ? "text-white" : "text-[#111111]"}`}>
                          {tab.label}
                        </span>
                      )}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ml-1 ${
                          isActive ? "bg-white text-[#111111]" : "bg-[#F4F4F4] text-gray-500"
                        }`}
                      >
                        <span className="text-[11px] font-extrabold">
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Lesson Cards */}
              <div className="flex gap-4 overflow-x-auto pt-3 pb-2 -mx-5 px-5 scroll-smooth no-scrollbar">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`shrink-0 w-[260px] h-[330px] ${lesson.cardBg} rounded-[32px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xs`}
                  >
                    {/* Background decoration */}
                    <div className="absolute -right-3 bottom-16 opacity-25 select-none pointer-events-none">
                      <div className="text-[72px]">{lesson.emoji}</div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xs">
                          {lesson.icon === "coins" && <Coins className="text-[#111111] w-5 h-5" />}
                          {lesson.icon === "wallet" && <Wallet className="text-[#111111] w-5 h-5" />}
                          {lesson.icon === "game" && <Gamepad2 className="text-[#111111] w-5 h-5" />}
                          {lesson.icon === "users" && <Users className="text-[#111111] w-5 h-5" />}
                        </div>
                        <div className="flex gap-1.5">
                          <div className="bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#111111]" />
                            <span className="text-[11px] font-bold text-[#111111]">
                              {lesson.lessonsCount}
                            </span>
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#111111]" />
                            <span className="text-[11px] font-bold text-[#111111]">
                              {lesson.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            {lesson.category}
                          </span>
                          <span className="text-[10px] font-extrabold bg-[#FEA619] text-[#684000] px-2 py-0.5 rounded-full">
                            {lesson.xp}
                          </span>
                        </div>
                        <h3 className="text-[22px] font-extrabold text-[#111111] leading-tight whitespace-pre-line font-nunitoSans mb-2">
                          {lesson.title}
                        </h3>
                        <p className="text-[12px] text-gray-600 font-medium leading-snug line-clamp-2">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-white rounded-full py-3.5 px-5 flex justify-between items-center relative z-10 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-xs cursor-pointer">
                      <span className="text-[14px] font-bold text-[#111111] font-nunitoSans">
                        {lesson.actionText}
                      </span>
                      <span className="text-[#111111] text-[13px] ml-1">▶</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="w-full bg-white rounded-t-[28px] shadow-[0_-6px_24px_rgba(0,0,0,0.07)] flex items-start justify-around pt-4 shrink-0 z-20" style={{ minHeight: "84px", paddingBottom: "max(18px, env(safe-area-inset-bottom))" }}>
          {/* 1. Home (Active: Green rounded pill) */}
          <button
            aria-label="Home"
            className="flex items-center justify-center rounded-2xl bg-[#00B074] w-12 h-11 cursor-pointer transition-transform active:scale-95 shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 16H5V10H11V16H14V7L8 2.5L2 7V16ZM0 18V6L8 0L16 6V18H9V12H7V18H0Z"
                fill="#00422B"
              />
            </svg>
          </button>

          {/* 2. Book / Cerita */}
          <Link
            href="/chapter"
            aria-label="Cerita"
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

          {/* 5. Profile */}
          <Link
            href="/profile"
            aria-label="Profil"
            className="flex items-center justify-center w-11 h-11 cursor-pointer transition-transform active:scale-95 text-[#3C4A42] hover:opacity-80"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                fill="#3C4A42"
              />
            </svg>
          </Link>
        </nav>

      </div>
    </div>
  );
}
