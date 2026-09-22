import React from 'react';
import { EventCard as EventCardType } from '@/types/event';

interface EventCardProps {
  card: EventCardType;
  isActive: boolean;
}

const contestTypeColors: Record<string, { bg: string; text: string }> = {
  GOLD: { bg: '#F8D174', text: 'text-black' },
  SILVER: { bg: '#D1D5DB', text: 'text-black' },
  BRONZE: { bg: '#CD7F32', text: 'text-white' },
};

const EventCard: React.FC<EventCardProps> = ({ card, isActive }) => {
  const colors = contestTypeColors[card.contestType] || { bg: '#F8D174', text: 'text-black' };

  return (
    <div className="carousel-card w-[280px] shrink-0 h-[460px] snap-center relative rounded-[28px] overflow-hidden shadow-xl transition-transform duration-100 origin-center select-none">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <img
          src={card.imageUrl}
          alt={card.title.replace(/<br\s*\/?>/gi, ' ')}
          className="w-full h-full object-cover opacity-80"
          loading="lazy"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

      {/* Top Countdown Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[#F59345] text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
          Ends in {card.countdownTime}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-10">
        {/* Contest Tag */}
        <div className="mb-2">
          <span
            className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md ${colors.text}`}
            style={{ backgroundColor: colors.bg }}
          >
            {card.contestType} CONTEST
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-white text-xl font-bold leading-tight mb-5"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          dangerouslySetInnerHTML={{ __html: card.title.replace(/\n/g, '<br />') }}
        />

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/20 mb-4"></div>

        {/* Footer Info Row */}
        <div className="flex items-center justify-between">
          {/* Game Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden">
              <img
                src={card.gameImageUrl}
                alt={card.gameName}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-white/60 text-[9px] font-semibold uppercase tracking-wider mb-0.5">
                GAME
              </p>
              <p className="text-white text-xs font-bold">{card.gameName}</p>
            </div>
          </div>

          {/* Currency Badge */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
            <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">$</span>
            </div>
            <span className="text-white text-xs font-bold">{card.coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
