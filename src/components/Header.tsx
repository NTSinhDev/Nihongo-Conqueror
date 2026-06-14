import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Cherry, Milestone } from "lucide-react";

interface Properties {
  activeCount: number;
  totalCount: number;
  characterSet: "hiragana" | "katakana";
}

export default function Header({ activeCount, totalCount, characterSet }: Properties) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Threshold at the top to keep physical header visible initially
      if (currentScrollY < 60) {
        setIsVisible(true);
      } else {
        // Scroll down exceeds old scroll value -> Hide
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else {
          // Scroll up -> Show
          setIsVisible(true);
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    // Use passive scroll event for better frame rates on mobile
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header 
      className={`border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ease-in-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Banner */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-2xs animate-pulse">
            <Cherry className="w-5 h-5 fill-rose-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-stone-850">
                {characterSet === "hiragana" ? "Hiragana Ryusei" : "Katakana Ryusei"}
              </h1>
              <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded-full border border-rose-100 uppercase">
                v2.1
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Trang web học phản xạ chữ cái {characterSet === "hiragana" ? "Hiragana" : "Katakana"} tiếng Nhật thông minh
            </p>
          </div>
        </div>

        {/* Current Active Counters */}
        <div className="flex items-center gap-4">
          <div className="bg-stone-50 border border-stone-150 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">Bộ lọc chữ đang dùng</span>
              <span className="text-xs font-bold text-stone-750 font-mono">
                {activeCount} / {totalCount} ký tự
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 text-stone-400 text-xs">
            <Milestone className="w-3.5 h-3.5" />
            <span>Chuyên tâm học tốt</span>
          </div>
        </div>
      </div>
    </header>
  );
}
