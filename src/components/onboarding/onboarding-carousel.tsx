"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

const slides = [
  {
    id: 1,
    title: "Dari 10 Ribu Jadi Cerdas",
    desc: "Bantu Foxy kelola uang lewat cerita seru,\ndan hal unik di dunia keuangan.",
    image: "/assets/onboarding/ob1.png",
  },
  {
    id: 2,
    title: "Pilihanmu, Masa Depanmu",
    desc: "Ambil keputusan belanja bijak, hindari jebakan utang,\ndan bangun payung dana darurat bersama Foxy.",
    image: "/assets/onboarding/ob2.png",
  },
  {
    id: 3,
    title: "100% Aman & Tanpa Nama",
    desc: "Privasi terjaga penuh tanpa email atau nomor HP.\nSatu klik untuk mulai petualangan finansialmu!",
    image: "/assets/onboarding/ob3.png",
    scale: 1.3,
  },
];

export default function OnboardingCarousel() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const paginate = (newDirection: number) => {
    const nextIdx = page + newDirection;
    if (nextIdx >= 0 && nextIdx < slides.length) {
      setPage([nextIdx, newDirection]);
    }
  };

  const goToSlide = (targetIdx: number) => {
    if (targetIdx === page) return;
    setPage([targetIdx, targetIdx > page ? 1 : -1]);
  };

  const handleNext = () => {
    if (page < slides.length - 1) {
      paginate(1);
    } else {
      router.push("/auth/register");
    }
  };

  const handleSkip = () => {
    router.push("/auth/register");
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center overflow-x-hidden overflow-y-auto select-none">
      {/* 420px mobile-width container - no overflow-hidden so mascot can freely slide across desktop screen */}
      <div className="relative w-full max-w-[420px] h-[100dvh] bg-white flex flex-col justify-between">
        
        {/* Top Bar / Lewati Button */}
        <div className="w-full flex justify-end items-center px-6 pt-4 pb-1 z-20 shrink-0">
          <button
            onClick={handleSkip}
            className="cursor-pointer text-[#006C49] font-nunitoSans text-sm sm:text-base font-bold py-1.5 px-3.5 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Lewati
          </button>
        </div>

        {/* Content Area (Mascot + Text) */}
        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-2">
          
          {/* Mascot Section: Fixed height container, NO overflow-hidden, smooth horizontal spring slide */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-auto shrink-0 flex items-center justify-center">
            <AnimatePresence custom={direction} initial={false}>
              <motion.div
                key={page}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: isDesktop ? (dir > 0 ? "70vw" : "-70vw") : (dir > 0 ? 320 : -320),
                    opacity: 0,
                    scale: 0.92,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    transition: {
                      x: { type: "spring" as const, stiffness: 260, damping: 28 },
                      opacity: { duration: 0.28 },
                      scale: { duration: 0.28 },
                    },
                  },
                  exit: (dir: number) => ({
                    x: isDesktop ? (dir > 0 ? "-70vw" : "70vw") : (dir > 0 ? -320 : 320),
                    opacity: 0,
                    scale: 0.92,
                    transition: {
                      x: { type: "spring" as const, stiffness: 260, damping: 28 },
                      opacity: { duration: 0.22 },
                      scale: { duration: 0.22 },
                    },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Image
                  src={slides[page].image}
                  alt={slides[page].title}
                  width={280}
                  height={280}
                  priority
                  style={{ transform: `scale(${slides[page].scale ?? 1})`, transition: "transform 0.3s ease" }}
                  className="w-auto h-full max-h-56 sm:max-h-64 object-contain pointer-events-none drop-shadow-sm"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text Section: Contained in its own overflow-hidden slider so text is neatly clipped to 420px */}
          <div className="w-full overflow-hidden shrink-0 mb-4 text-center">
            <div
              className="flex w-[300%] transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${(page * 100) / 3}%)` }}
            >
              {slides.map((slide) => (
                <div key={slide.id} className="w-1/3 px-4">
                  <h1 className="text-[#121E18] font-nunitoSans text-2xl sm:text-[28px] font-extrabold leading-tight tracking-tight mb-2">
                    {slide.title}
                  </h1>
                  <p className="text-[#3C4A42] font-nunitoSans text-sm sm:text-base font-medium leading-relaxed max-w-[320px] whitespace-pre-line mx-auto">
                    {slide.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Control Bar */}
        <div className="bg-white w-full pt-2 pb-8 px-6 flex flex-col items-center z-20 shrink-0">
          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mb-5">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => goToSlide(dotIdx)}
                aria-label={`Pindah ke slide ${dotIdx + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  page === dotIdx
                    ? "bg-[#FEA619] w-8 h-2"
                    : "bg-[#D8E6DC] w-2 h-2 hover:bg-[#b9d2c1]"
                }`}
              />
            ))}
          </div>

          {/* Action Button ("Lanjut" / "Mulai Sekarang") */}
          <button
            onClick={handleNext}
            className="cursor-pointer active:scale-[0.98] transition-transform text-nowrap flex py-3.5 sm:py-4 px-0 justify-center items-center rounded-[28px] border-b-4 border-b-[#059669] bg-[#10B981] w-full max-w-[350px] hover:brightness-105"
          >
            <span className="text-[#00422B] font-nunitoSans text-base sm:text-lg font-extrabold leading-5 tracking-[0.02em]">
              {page === slides.length - 1 ? "Mulai Sekarang" : "Lanjut"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

