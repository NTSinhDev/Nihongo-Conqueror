import React, { useState } from "react";
import { BASIC_KANJI, KanjiWord } from "../data/kanji";
import { BookOpen, Volume2, Sparkles, RefreshCw, Eye, EyeOff, Layers, Grid } from "lucide-react";
import { sounds } from "../utils/audio";

// Speech Synthesis for Japanese
const speakText = (text: string) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Strip parentheses and hiragana if we only want to say clean phrase or vice versa
    const cleanText = text.replace(/\s*\(.*?\)\s*/g, "").replace(/[a-zA-Z]/g, ""); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8; 
    
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.includes("JP") || v.lang.includes("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech Synthesis failure", e);
  }
};

export default function KanjiLearning() {
  const [activeTab, setActiveTab] = useState<"all" | "numbers" | "time" | "currency">("all");
  const [mode, setMode] = useState<"grid" | "flashcard">("grid");
  
  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hideReadings, setHideReadings] = useState(false);

  // Filter Kanji list based on selected category
  const filteredKanji = BASIC_KANJI.filter(
    (item) => activeTab === "all" || item.category === activeTab
  );

  // Handle flashcard navigation
  const handleNextCard = () => {
    sounds.playClick();
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % filteredKanji.length);
    }, 150);
  };

  const handlePrevCard = () => {
    sounds.playClick();
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + filteredKanji.length) % filteredKanji.length);
    }, 150);
  };

  const handleFlipCard = () => {
    sounds.playClick();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 py-2 sm:px-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden select-none">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center -mr-10">
          <BookOpen className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
            Hán Tự Cơ Bản
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Học Kanji Tiếng Nhật</h2>
          <p className="text-xs sm:text-sm text-rose-50 font-medium leading-relaxed">
            Học các hán tự phổ biến về chữ số, thời gian và tiền tệ giúp bạn dễ dàng đọc hiểu các tài liệu, bảng biểu và hóa đơn hàng ngày.
          </p>
        </div>
      </div>

      {/* MODE TOGGLES AND CATEGORIES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full max-w-full min-w-0">
          {[
            { id: "all", label: "Tất cả" },
            { id: "numbers", label: "🔢 Chữ số" },
            { id: "time", label: "⏰ Thời gian" },
            { id: "currency", label: "💴 Tiền tệ" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                setActiveTab(cat.id as any);
                setFlashcardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === cat.id
                  ? "bg-rose-50 text-rose-600 shadow-3xs border border-rose-100"
                  : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode & Study settings */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {mode === "grid" && (
            <button
              onClick={() => {
                sounds.playClick();
                setHideReadings(!hideReadings);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all bg-white"
            >
              {hideReadings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{hideReadings ? "Hiện âm đọc" : "Ẩn âm đọc"}</span>
            </button>
          )}

          <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200/50">
            <button
              onClick={() => {
                sounds.playClick();
                setMode("grid");
              }}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === "grid"
                  ? "bg-white text-stone-800 shadow-3xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng danh sách</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setMode("flashcard");
                setFlashcardIndex(0);
                setIsFlipped(false);
              }}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === "flashcard"
                  ? "bg-white text-rose-600 shadow-3xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thẻ Flashcard</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VIEW GRID OR FLASHCARD */}
      {filteredKanji.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">Không tìm thấy Kanji nào</h3>
          <p className="text-xs text-stone-400">Vui lòng chọn bộ lọc khác.</p>
        </div>
      ) : mode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredKanji.map((item, idx) => (
            <div
              key={`${item.kanji}-${item.category}`}
              className="bg-white rounded-2xl border border-stone-200 hover:border-rose-300 hover:shadow-sm p-5 space-y-4 transition-all relative group"
            >
              {/* Category indicator */}
              <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 capitalize select-none">
                {item.category === "numbers" ? "Chữ số" : item.category === "time" ? "Thời gian" : "Tiền tệ"}
              </span>

              {/* Big Kanji representation with Speech Trigger */}
              <div className="flex items-end gap-3.5 pt-1.5">
                <button
                  onClick={() => {
                    sounds.playClick();
                    speakText(item.kanji);
                  }}
                  className="text-5xl font-serif-jp text-stone-850 hover:text-rose-600 transition-colors cursor-pointer select-none font-bold"
                  title="Nhấp để nghe đọc chữ Hán"
                >
                  {item.kanji}
                </button>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold text-stone-800">{item.meaning}</h4>
                  <p className="text-[10px] font-mono text-stone-400">ID: Kanji #{idx + 1}</p>
                </div>
              </div>

              {/* Readings Info */}
              {!hideReadings && (
                <div className="bg-stone-50/80 rounded-xl p-3 space-y-1.5 text-xs border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 font-bold text-[10px] uppercase tracking-wider">Onyomi:</span>
                    <span className="font-bold text-stone-700 font-serif-jp">{item.onYomi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 font-bold text-[10px] uppercase tracking-wider">Kunyomi:</span>
                    <span className="font-bold text-rose-600 font-serif-jp">{item.kunYomi}</span>
                  </div>
                </div>
              )}

              {/* Sentence Example block */}
              <div className="pt-3 border-t border-stone-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ví dụ ứng dụng:</span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      speakText(item.example);
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Nghe phát âm ví dụ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-stone-850 font-serif-jp">{item.example}</p>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed">{item.exampleMeaning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FLASHCARD MODE */
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center text-xs text-stone-500 font-bold">
            <span>Tiến độ: {flashcardIndex + 1} / {filteredKanji.length}</span>
            <span className="bg-stone-100 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">
              {filteredKanji[flashcardIndex].category === "numbers" ? "Chữ số" : filteredKanji[flashcardIndex].category === "time" ? "Thời gian" : "Tiền tệ"}
            </span>
          </div>

          {/* Flashcard container with flip animation */}
          <div
            onClick={handleFlipCard}
            className="w-full aspect-[4/3] bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer relative select-none hover:border-rose-400 transition-all duration-300 group"
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playClick();
                  speakText(isFlipped ? filteredKanji[flashcardIndex].example : filteredKanji[flashcardIndex].kanji);
                }}
                className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {!isFlipped ? (
              // Front side: Large Kanji
              <div className="space-y-4 animate-scaleUp">
                <span className="text-8xl font-serif-jp font-black text-stone-850 block group-hover:scale-105 transition-transform duration-300">
                  {filteredKanji[flashcardIndex].kanji}
                </span>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  Nhấp chuột để lật thẻ xem nghĩa
                </p>
              </div>
            ) : (
              // Back side: Meanings, readings and examples
              <div className="space-y-4 animate-scaleUp w-full max-w-sm">
                <div className="space-y-1">
                  <span className="text-3xl font-serif-jp font-extrabold text-rose-600">
                    {filteredKanji[flashcardIndex].kanji}
                  </span>
                  <h3 className="text-xl font-black text-stone-850">
                    {filteredKanji[flashcardIndex].meaning}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-2.5 rounded-xl text-left border border-stone-100 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">On:</span>
                    <span className="font-bold text-stone-700 font-serif-jp">{filteredKanji[flashcardIndex].onYomi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Kun:</span>
                    <span className="font-bold text-rose-600 font-serif-jp">{filteredKanji[flashcardIndex].kunYomi}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-stone-150 text-left">
                  <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider mb-0.5">Ví dụ ứng dụng:</span>
                  <p className="text-sm font-bold text-stone-850 font-serif-jp">{filteredKanji[flashcardIndex].example}</p>
                  <p className="text-xs text-stone-500 font-medium">{filteredKanji[flashcardIndex].exampleMeaning}</p>
                </div>
              </div>
            )}
          </div>

          {/* Flashcard navigation buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevCard}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-200 font-bold text-xs text-stone-600 hover:bg-stone-50 transition-all bg-white shadow-3xs"
            >
              Thẻ trước
            </button>
            <button
              onClick={handleNextCard}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-3xs transition-all"
            >
              Thẻ tiếp theo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
