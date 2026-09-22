'use client';

import React, { useState } from 'react';
import EventCarousel from './EventCarousel';
import { EventCard } from '@/types/event';
import { Sparkles, Trophy, Flame } from 'lucide-react';

const INITIAL_CARDS: EventCard[] = [
  {
    id: 1,
    title: 'Party With Gronk at<br>the 2024 NFL Draft',
    contestType: 'GOLD',
    gameName: 'Quarterback Catch',
    countdownTime: '00:28:16',
    coins: 2,
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop',
    gameImageUrl: 'https://images.unsplash.com/photo-1614030616186-b484d852a498?q=80&w=100&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'NBA Finals VIP<br>Watch Party Access',
    contestType: 'SILVER',
    gameName: 'Hoops Challenge',
    countdownTime: '04:15:30',
    coins: 3,
    imageUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop',
    gameImageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=100&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Global eSports<br>Grand Finals',
    contestType: 'BRONZE',
    gameName: 'Arena Battle',
    countdownTime: '12:45:00',
    coins: 1,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    gameImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=100&auto=format&fit=crop',
  },
];

export default function EventCarouselScreen() {
  const [cards] = useState<EventCard[]>(INITIAL_CARDS);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCard = cards[activeCardIndex] || cards[0];

  const handlePlayClick = () => {
    setToastMessage(`🎮 Memulai ${activeCard.gameName}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCardChange = (index: number) => {
    setActiveCardIndex(index);
  };

  return (
    <div className="w-full h-full bg-[#311054] flex flex-col font-sans overflow-hidden relative select-none">
      {/* Background decorative side bars */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#421d68] z-0 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#421d68] z-0 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="shrink-0 pt-4 px-6 pb-2 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#9B72F4]/20 border border-[#9B72F4]/40 flex items-center justify-center text-[#9B72F4]">
            <Trophy size={16} />
          </div>
          <div>
            <h1 className="text-white text-base font-extrabold tracking-wide">Arena Game</h1>
            <p className="text-[#9B72F4] text-[11px] font-semibold flex items-center gap-1">
              <Sparkles size={11} /> 3D Event Cover Flow
            </p>
          </div>
        </div>

        {/* User Coin Balance */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-orange-700 text-[10px] font-black">$</span>
          </div>
          <span className="text-yellow-400 text-xs font-bold">1,250</span>
        </div>
      </header>

      {/* Main Carousel Area */}
      <main className="flex-1 w-full flex flex-col justify-between pt-1 pb-4 relative z-10 overflow-hidden">
        {/* Carousel */}
        <EventCarousel
          cards={cards}
          onCardChange={handleCardChange}
          onPlayClick={handlePlayClick}
        />

        {/* Action Button Area */}
        <div className="px-6 mt-1 shrink-0 flex flex-col items-center w-full z-20 gap-2">
          <button
            type="button"
            onClick={handlePlayClick}
            className="w-full max-w-[280px] bg-gradient-to-r from-[#8B5CF6] via-[#9B72F4] to-[#A78BFA] text-white text-base font-extrabold py-3.5 rounded-[22px] shadow-[0_10px_25px_-5px_rgba(155,114,244,0.5)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer"
          >
            <Flame size={18} className="text-yellow-300 fill-yellow-300" />
            <span>Tap to Play</span>
          </button>
        </div>
      </main>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#00B074] text-[#00422B] px-4 py-2 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles size={14} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
