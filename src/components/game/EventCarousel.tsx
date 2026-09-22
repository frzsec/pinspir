import React, { useRef, useEffect, useState, useCallback } from 'react';
import EventCard from './EventCard';
import { EventCard as EventCardType } from '@/types/event';

interface EventCarouselProps {
  cards: EventCardType[];
  onCardChange?: (index: number) => void;
  onPlayClick?: () => void;
}

const EventCarousel: React.FC<EventCarouselProps> = ({
  cards,
  onCardChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateCarousel = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let minDistance = Infinity;
    let newActiveIndex = 0;

    const cardElements = track.querySelectorAll('.carousel-card');

    cardElements.forEach((cardElement, index) => {
      const element = cardElement as HTMLElement;
      const cardCenter = element.offsetLeft + element.clientWidth / 2;
      const distance = Math.abs(trackCenter - cardCenter);
      const maxDistance = element.clientWidth + 20;

      // Calculate scale based on distance from center
      let scale = 1 - (distance / maxDistance) * 0.15;
      scale = Math.max(0.85, Math.min(1, scale));

      element.style.transform = `scale(${scale})`;

      if (distance < minDistance) {
        minDistance = distance;
        newActiveIndex = index;
      }
    });

    if (newActiveIndex !== activeIndex) {
      setActiveIndex(newActiveIndex);
      onCardChange?.(newActiveIndex);
    }
  }, [activeIndex, onCardChange]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Initial update
    updateCarousel();

    const handleScroll = () => {
      window.requestAnimationFrame(updateCarousel);
    };

    const handleResize = () => {
      updateCarousel();
    };

    track.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCarousel]);

  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cardNodes = track.querySelectorAll('.carousel-card');
    const targetCard = cardNodes[index] as HTMLElement;
    if (targetCard) {
      const scrollPos = targetCard.offsetLeft - (track.clientWidth - targetCard.clientWidth) / 2;
      track.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 py-2">
      {/* Scrollable Track */}
      <div
        ref={trackRef}
        className="w-full flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 no-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingLeft: 'calc(50% - 140px)',
          paddingRight: 'calc(50% - 140px)',
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => scrollToCard(index)}
            className="cursor-pointer shrink-0"
          >
            <EventCard card={card} isActive={index === activeIndex} />
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-2 mt-3 z-20">
        {cards.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollToCard(index)}
            aria-label={`Pilih event card ${index + 1}`}
            className={`carousel-dot rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-6 h-2 bg-[#9B72F4]'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default EventCarousel;
