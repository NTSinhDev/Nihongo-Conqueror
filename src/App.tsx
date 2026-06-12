import React, { useState, useMemo } from "react";
import Header from "./components/Header";
import HiraganaChart from "./components/HiraganaChart";
import SurvivalTestMode from "./components/SurvivalTestMode";
import FlashcardMode from "./components/FlashcardMode";
import MatchingGame from "./components/MatchingGame";
import { HIRAGANA_GROUPS, ALL_HIRAGANA } from "./data/hiragana";
import { KATAKANA_GROUPS, ALL_KATAKANA } from "./data/katakana";
import { sounds } from "./utils/audio";
import {
  Flame,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Gamepad2,
  BookMarked,
  Volume2,
} from "lucide-react";

export default function App() {
  // Toggle between Hiragana and Katakana character systems
  const [characterSet, setCharacterSet] = useState<"hiragana" | "katakana">("hiragana");

  // Select Gojuon rows by default to give a highly-engaging starting state
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    "a",
    "ka",
    "sa",
    "ta",
  ]);

  // Track the active working view tab
  const [activeTab, setActiveTab] = useState<"survival" | "flashcard" | "match">("survival");

  // Filter text to quickly search character definitions
  const [searchQuery, setSearchQuery] = useState("");

  const activeCharPool = useMemo(() => {
    const pool = [];
    const grps = characterSet === "hiragana" ? HIRAGANA_GROUPS : KATAKANA_GROUPS;
    for (const key of selectedGroups) {
      const gp = grps[key];
      if (gp) {
        pool.push(...gp.chars);
      }
    }
    return pool;
  }, [selectedGroups, characterSet]);

  const handleToggleGroup = (groupKey: string) => {
    sounds.playClick();
    setSelectedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((g) => g !== groupKey)
        : [...prev, groupKey]
    );
  };

  const handleSelectAll = () => {
    const grps = characterSet === "hiragana" ? HIRAGANA_GROUPS : KATAKANA_GROUPS;
    setSelectedGroups(Object.keys(grps));
  };

  const handleSelectNone = () => {
    setSelectedGroups([]);
  };

  // Search filtered results helper
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const sourcePool = characterSet === "hiragana" ? ALL_HIRAGANA : ALL_KATAKANA;
    return sourcePool.filter(
      (c) =>
        c.hiragana.includes(query) ||
        c.romaji.includes(query) ||
        c.vietnamesePronunciation.includes(query)
    );
  }, [searchQuery, characterSet]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 selection:bg-rose-100 selection:text-rose-900">
      {/* Brand Navigation Header */}
      <Header
        activeCount={activeCharPool.length}
        totalCount={characterSet === "hiragana" ? ALL_HIRAGANA.length : ALL_KATAKANA.length}
        characterSet={characterSet}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Quick Search Tool & Banner overlay */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 translate-y-12 w-32 h-32 bg-rose-400/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Banner details */}
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-200 fill-rose-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-rose-100 font-mono">Phương pháp học sâu</span>
              </div>
              <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight">
                Luyện Tập {characterSet === "hiragana" ? "Hiragana" : "Katakana"} Tiếng Nhật Phản Xạ
              </h2>
              <p className="text-rose-100 text-xs md:text-sm max-w-xl font-normal leading-relaxed">
                Thiết chế kiểm tra thông minh giúp bạn thuộc vĩnh viễn mặt chữ cái: Mỗi ký tự cần được nhận thức chính xác 
                <strong className="text-white font-bold underline decoration-wavy decoration-rose-350 ml-1 font-medium">5 lần đúng liên tiếp</strong> để được ghi nhận đã thuộc bài!
              </p>
            </div>

            {/* Quick search bar inside the header */}
            <div className="md:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <label className="block text-xs font-bold text-rose-100 uppercase tracking-wider mb-2">
                Tra nhanh từ vựng / Kanji
              </label>
              <div className="relative">
                <input
                  id="input-quick-search-hiragana"
                  type="text"
                  placeholder="Nhập chữ, romaji hoặc vần..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-stone-850 placeholder:text-stone-400 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-rose-300 focus:outline-none transition-all shadow-xs border-none"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Alphabet Switch Bar */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
          <div>
            <h3 className="text-xs font-bold text-stone-850 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <BookOpen className="w-4 h-4 text-rose-500" /> Hệ thống bảng chữ cái đang học
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Thay đổi hệ thống chữ cái chính để luyện tập trong tất cả các chế độ chơi và flashcard bên dưới.
            </p>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-center">
            <button
              id="switch-to-hiragana"
              onClick={() => {
                sounds.playClick();
                setCharacterSet("hiragana");
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                characterSet === "hiragana"
                  ? "bg-white text-rose-600 shadow-3xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Hiragana (ひらがな)
            </button>
            <button
              id="switch-to-katakana"
              onClick={() => {
                sounds.playClick();
                setCharacterSet("katakana");
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                characterSet === "katakana"
                  ? "bg-white text-rose-600 shadow-3xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Katakana (カタカナ)
            </button>
          </div>
        </div>

        {/* Real-time Search overlay result box */}
        {searchQuery && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> Kết quả tra cứu ({searchResults.length} tự)
            </h3>
            {searchQuery && searchResults.length === 0 ? (
              <p className="text-xs text-stone-400">Không tìm thấy âm vị nào khớp với truy vấn của bạn.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {searchResults.map((char) => (
                  <div
                    id={`search-res-${char.hiragana}`}
                    key={char.hiragana}
                    className="p-3 border border-stone-150 rounded-xl bg-stone-50 flex items-center gap-3"
                  >
                    <span className="font-serif-jp text-2xl font-black text-rose-600">{char.hiragana}</span>
                    <div>
                      <span className="block font-mono text-xs font-bold text-stone-800 lowercase">{char.romaji}</span>
                      <span className="text-[10px] text-stone-400">/{char.vietnamesePronunciation}/</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Core Mode Selection Navigation Tabs */}
        <div className="flex border-b border-stone-200/60 pb-1 gap-2 md:gap-4 overflow-x-auto flex-nowrap shrink-0 scrollbar-none">
          <button
            id="tab-mode-survival-test-trigger"
            onClick={() => {
              sounds.playClick();
              setActiveTab("survival");
            }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold tracking-tight rounded-xl transition-all relative shrink-0 ${
              activeTab === "survival"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
            <span>🎯 Chế độ Sống sót (Đúng liền 5 lần)</span>
          </button>

          <button
            id="tab-mode-flashcard-trigger"
            onClick={() => {
              sounds.playClick();
              setActiveTab("flashcard");
            }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold tracking-tight rounded-xl transition-all relative shrink-0 ${
              activeTab === "flashcard"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            <BookMarked className="w-4 h-4 text-emerald-500" />
            <span>🎴 Thẻ Flashcard & Vẽ nét</span>
          </button>

          <button
            id="tab-mode-match-trigger"
            onClick={() => {
              sounds.playClick();
              setActiveTab("match");
            }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold tracking-tight rounded-xl transition-all relative shrink-0 ${
              activeTab === "match"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-rose-500" />
            <span>🧩 Trò chơi Kéo ghép phản xạ</span>
          </button>
        </div>

        {/* Main Work Area Views container */}
        <div className="min-h-[400px]">
          {activeTab === "survival" && (
            <SurvivalTestMode
              selectedGroups={selectedGroups}
              activeCharPool={activeCharPool}
              characterSet={characterSet}
            />
          )}

          {activeTab === "flashcard" && (
            <FlashcardMode
              activeCharPool={activeCharPool}
              characterSet={characterSet}
            />
          )}

          {activeTab === "match" && (
            <MatchingGame
              activeCharPool={activeCharPool}
              characterSet={characterSet}
            />
          )}
        </div>

        {/* The Picker Chart Section (At the bottom of the page) */}
        <div className="border-t border-stone-200/50 pt-8">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-stone-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-500" /> CÀI ĐẶT BỘ KÝ TỰ KIỂM TRA
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Bật/Tắt các hàng chữ để tùy chỉnh danh sách chữ cái sẽ xuất hiện trong các bài test ở trên.
            </p>
          </div>

          <HiraganaChart
            selectedGroups={selectedGroups}
            onToggleGroup={handleToggleGroup}
            onSelectAll={handleSelectAll}
            onSelectNone={handleSelectNone}
            characterSet={characterSet}
          />
        </div>

      </main>
    </div>
  );
}
