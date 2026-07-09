import React, { useState, useMemo } from "react";
import HiraganaChart from "./components/HiraganaChart";
import SurvivalTestMode from "./components/SurvivalTestMode";
import FlashcardMode from "./components/FlashcardMode";
import MatchingGame from "./components/MatchingGame";
import BasicJapaneseCourse from "./components/BasicJapaneseCourse";
import { HIRAGANA_GROUPS, ALL_HIRAGANA } from "./data/hiragana";
import { KATAKANA_GROUPS, ALL_KATAKANA } from "./data/katakana";
import { sounds } from "./utils/audio";
import { getLessonsFromCloud, getCasualVocabFromCloud } from "./utils/firebase";
import { VocabularyWord } from "./data/vocabulary";
import {
  Flame,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Gamepad2,
  BookMarked,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  CheckSquare,
  RefreshCw,
  Database,
  TrendingUp,
  BookmarkCheck,
  Sliders,
  Settings,
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

  // Track the active working view tab (management portal items)
  // "alphabet-test" -> Kiểm tra bảng chữ cái
  // "minna-1" -> Minna no Nihongo 1
  const [activeTab, setActiveTab] = useState<"alphabet-test" | "minna-1">("minna-1");

  // Track the selected Minna no Nihongo level
  const [activeLevel, setActiveLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");

  // Sub-navigation inside alphabet-test to support survival and match mode
  const [alphabetSubTab, setAlphabetSubTab] = useState<"survival" | "match">("survival");

  // Track if mobile sidebar drawer is open
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Database word search state
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchActiveQuery, setSearchActiveQuery] = useState("");
  const [vocabSearchResults, setVocabSearchResults] = useState<Array<{
    word: VocabularyWord;
    lessonTitle?: string;
    lessonId?: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (!trimmed) {
      setSearchActiveQuery("");
      setVocabSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchActiveQuery(trimmed);
    try {
      const q = trimmed.toLowerCase();
      // Fetch all lessons from Firestore
      const lessons = await getLessonsFromCloud();
      // Fetch all casual vocabulary from Firestore
      const casualVocab = await getCasualVocabFromCloud();

      const results: Array<{
        word: VocabularyWord;
        lessonTitle?: string;
        lessonId?: number;
      }> = [];

      // 1. Search lessons
      lessons.forEach((lesson) => {
        if (lesson.words && Array.isArray(lesson.words)) {
          lesson.words.forEach((w) => {
            if (
              w.japanese.toLowerCase().includes(q) ||
              (w.romaji && w.romaji.toLowerCase().includes(q)) ||
              w.vietnameseMeaning.toLowerCase().includes(q)
            ) {
              const exists = results.some(r => r.word.japanese.trim() === w.japanese.trim());
              if (!exists) {
                results.push({
                  word: w,
                  lessonTitle: lesson.title,
                  lessonId: lesson.id
                });
              }
            }
          });
        }
      });

      // 2. Search casual vocabulary
      casualVocab.forEach((w) => {
        if (
          w.japanese.toLowerCase().includes(q) ||
          (w.romaji && w.romaji.toLowerCase().includes(q)) ||
          w.vietnameseMeaning.toLowerCase().includes(q)
        ) {
          const exists = results.some(r => r.word.japanese.trim() === w.japanese.trim());
          if (!exists) {
            results.push({
              word: w
            });
          }
        }
      });

      setVocabSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

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

  const totalChars = characterSet === "hiragana" ? ALL_HIRAGANA.length : ALL_KATAKANA.length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-rose-100 selection:text-rose-900 flex font-sans">
      
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-stone-900 text-stone-100 border-r border-stone-800 z-30 justify-between">
        <div className="flex flex-col flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
          
          {/* Dashboard Branding Header */}
          <div className="flex items-center gap-3 border-b border-stone-800 pb-5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-transparent to-black/25"></div>
              <span className="font-serif-jp text-lg font-black tracking-tight relative z-10">日</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white">Nihongo Manager</h1>
                <span className="text-[9px] bg-rose-950 text-rose-400 font-bold px-1.5 py-0.5 rounded-full border border-rose-900 uppercase">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono tracking-wider">HỆ THỐNG QUẢN LÝ BÀI HỌC</p>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest pl-3 mb-2 font-mono">GIÁO TRÌNH MINNA</p>
            
            {(["N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => {
              const isActive = activeTab === "minna-1" && activeLevel === lvl;
              return (
                <button
                  key={lvl}
                  id={`sidebar-menu-minna-${lvl}`}
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("minna-1");
                    setActiveLevel(lvl);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Trình độ {lvl}</span>
                  </div>
                  {lvl !== "N5" && (
                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded-sm font-bold uppercase ${
                      isActive ? "bg-rose-850 text-rose-200" : "bg-stone-850 text-rose-450 border border-rose-950/40"
                    }`}>
                      pro
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 mt-2 border-t border-stone-850">
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest pl-3 mb-2 font-mono">PHẢN XẠ & BẢNG CHỮ CÁI</p>
              <button
                id="sidebar-menu-alphabet-test"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab("alphabet-test");
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "alphabet-test"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>Kiểm tra bảng chữ cái</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === "alphabet-test" ? "rotate-90" : ""}`} />
              </button>
            </div>
          </div>

          {/* Sidebar Footer Spacer */}
          <div className="flex-1"></div>

        </div>

        {/* Database & Account Status Footer */}
        <div className="p-6 border-t border-stone-800 bg-stone-950/40 text-[10px] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Đồng bộ đám mây: Hoạt động</span>
          </div>
          <p className="text-stone-500 leading-relaxed font-mono">
            Firestore: Verified Blueprints
          </p>
        </div>
      </aside>

      {/* ----------------- MOBILE SIDEBAR DRAWER ----------------- */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>

          {/* Drawer Body */}
          <div className="relative flex flex-col w-64 max-w-xs bg-stone-900 text-stone-100 p-6 space-y-6 z-10 shadow-xl border-r border-stone-800">
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md">
                <span className="font-serif-jp text-sm font-bold">日</span>
              </div>
              <div>
                <h1 className="text-xs font-bold text-white">Nihongo Manager</h1>
                <p className="text-[9px] text-stone-400">Học & Quản lý</p>
              </div>
            </div>

            {/* Menu Links */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest pl-2 mb-2">GIÁO TRÌNH MINNA</p>
              
              {(["N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => {
                const isActive = activeTab === "minna-1" && activeLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab("minna-1");
                      setActiveLevel(lvl);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Trình độ {lvl}</span>
                    </div>
                    {lvl !== "N5" && (
                      <span className={`text-[8px] font-mono px-1 py-0.5 rounded-sm font-bold uppercase ${
                        isActive ? "bg-rose-800 text-rose-200" : "bg-stone-800 text-stone-400"
                      }`}>
                        pro
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-4 mt-2 border-t border-stone-800">
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest pl-2 mb-2">PHẢN XẠ & BẢNG CHỮ CÁI</p>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("alphabet-test");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "alphabet-test"
                      ? "bg-rose-600 text-white"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Kiểm tra bảng chữ cái</span>
                </button>
              </div>
            </div>



            {/* Cloud Status */}
            <div className="mt-auto pt-4 border-t border-stone-800 text-[10px] text-stone-500">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Cloud: Synced</span>
              </div>
              <p className="font-mono">Secure Fallback ID Active</p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MAIN PANEL WORKSPACE ----------------- */}
      <main className="flex-1 min-h-screen bg-stone-50 flex flex-col lg:pl-72 transition-all">
        
        {/* Top bar Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Dynamic Page Header Title */}
            <div>
              <span className="hidden sm:inline text-[9px] font-bold text-rose-600 uppercase tracking-widest font-mono">
                {activeTab === "minna-1" ? `GIÁO TRÌNH MINNA ${activeLevel}` : activeTab === "alphabet-test" ? "LUYỆN TẬP PHẢN XẠ" : "THẺ FLASHCARD"}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-800 flex items-center gap-1.5 select-none">
                {activeTab === "minna-1" && `📖 Minna no Nihongo (Bài học ${activeLevel})`}
                {activeTab === "alphabet-test" && "🎯 Kiểm tra & Phản xạ bảng chữ cái"}
                {activeTab === "flashcard" && "🎴 Flashcard & Hướng dẫn vẽ nét"}
              </h2>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="w-40 sm:w-64 relative">
            <input
              id="input-quick-search-dashboard"
              type="text"
              placeholder="Nhấn Enter để tìm từ vựng..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(searchInputValue);
                }
              }}
              className="w-full bg-stone-100 text-stone-850 placeholder:text-stone-400 rounded-xl py-1.5 pl-8 pr-3 text-xs font-semibold focus:ring-2 focus:ring-rose-200 focus:bg-white focus:outline-none transition-all shadow-3xs border border-transparent focus:border-stone-250"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>
        </header>

        {/* Content Workspace Area */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto flex-1 min-w-0 overflow-hidden">
          
          {/* Database Word Search Results */}
          {searchActiveQuery && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Kết quả tìm kiếm từ vựng từ cơ sở dữ liệu ({vocabSearchResults.length} từ tìm thấy)
                </h3>
                <button 
                  onClick={() => {
                    setSearchInputValue("");
                    setSearchActiveQuery("");
                    setVocabSearchResults([]);
                  }}
                  className="text-xs font-bold text-stone-400 hover:text-stone-600 font-mono"
                >
                  XÓA BỎ
                </button>
              </div>

              {isSearching ? (
                <div className="flex items-center gap-2 text-xs text-stone-500 py-4 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang truy vấn từ cơ sở dữ liệu đám mây...
                </div>
              ) : vocabSearchResults.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">Không tìm thấy từ vựng nào trong cơ sở dữ liệu khớp với "{searchActiveQuery}".</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vocabSearchResults.map((res, idx) => (
                    <div
                      id={`search-res-db-${encodeURIComponent(res.word.japanese)}`}
                      key={`${res.word.japanese}-${idx}`}
                      className="p-4 border border-stone-150 rounded-xl bg-stone-50 flex flex-col justify-between shadow-3xs hover:border-stone-250 transition-all animate-fadeIn"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="font-serif-jp text-2xl font-black text-rose-600 break-all">{res.word.japanese}</span>
                          <span className="block font-mono text-xs font-bold text-stone-500 lowercase">/{res.word.romaji}/</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-stone-850 block">{res.word.vietnameseMeaning}</span>
                          {res.word.englishMeaning && (
                            <span className="text-[11px] text-stone-400 block mt-0.5 italic">({res.word.englishMeaning})</span>
                          )}
                        </div>
                      </div>

                      {res.lessonTitle && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                          <span>Thuộc bài học: <strong className="text-stone-700 font-bold">"{res.lessonTitle}"</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------- TAB WORKSPACE ROUTING ----------------- */}
          <div className="transition-all duration-200 w-full max-w-full min-w-0 overflow-hidden">
            
            {/* TAB: MINNA NO NIHONGO 1 */}
            {activeTab === "minna-1" && (
              <div className="space-y-6 w-full max-w-full min-w-0 overflow-hidden">
                <BasicJapaneseCourse activeLevel={activeLevel} onLevelChange={setActiveLevel} />
              </div>
            )}

            {/* TAB: KIỂM TRA BẢNG CHỮ CÁI */}
            {activeTab === "alphabet-test" && (
              <div className="space-y-6 sm:space-y-8">
                
                {/* 1. Alphabet System Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hiragana Card Selector */}
                  <button
                    id="select-alphabet-hiragana"
                    onClick={() => {
                      sounds.playClick();
                      setCharacterSet("hiragana");
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group relative overflow-hidden ${
                      characterSet === "hiragana"
                        ? "bg-white border-rose-500 ring-2 ring-rose-200/30 shadow-md"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 shadow-3xs"
                    }`}
                  >
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${characterSet === "hiragana" ? "bg-rose-600 animate-pulse" : "bg-stone-300"}`}></span>
                        <span className="text-[10px] uppercase font-bold text-stone-400 font-mono tracking-wider">Bảng chữ mềm</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-stone-800">Hiragana (ひらがな)</h4>
                      <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
                        Học bảng chữ cơ bản biểu diễn từ thuần Nhật, trợ từ và phụ tố động từ.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <span className={`font-serif-jp text-4xl sm:text-5xl font-black transition-transform duration-300 group-hover:scale-110 ${
                        characterSet === "hiragana" ? "text-rose-600" : "text-stone-300"
                      }`}>あ</span>
                    </div>
                  </button>

                  {/* Katakana Card Selector */}
                  <button
                    id="select-alphabet-katakana"
                    onClick={() => {
                      sounds.playClick();
                      setCharacterSet("katakana");
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group relative overflow-hidden ${
                      characterSet === "katakana"
                        ? "bg-white border-rose-500 ring-2 ring-rose-200/30 shadow-md"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 shadow-3xs"
                    }`}
                  >
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${characterSet === "katakana" ? "bg-rose-600 animate-pulse" : "bg-stone-300"}`}></span>
                        <span className="text-[10px] uppercase font-bold text-stone-400 font-mono tracking-wider">Bảng chữ cứng</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-stone-800">Katakana (カタカナ)</h4>
                      <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
                        Chuyên dùng để biểu diễn các từ ngoại lai, phiên âm nước ngoài và từ mượn.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <span className={`font-serif-jp text-4xl sm:text-5xl font-black transition-transform duration-300 group-hover:scale-110 ${
                        characterSet === "katakana" ? "text-rose-600" : "text-stone-300"
                      }`}>ア</span>
                    </div>
                  </button>
                </div>

                {/* Intro & Quiz Switcher */}
                <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-3xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-850 uppercase tracking-wider">Hệ thống bài kiểm tra phản xạ thông minh</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Kiểm tra phản xạ sâu mặt chữ Hiragana/Katakana bằng phương pháp trò chơi hóa tương tác.
                      </p>
                    </div>

                    {/* Mode Toggle inside the quiz board */}
                    <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-center">
                      <button
                        id="btn-subtab-survival"
                        onClick={() => {
                          sounds.playClick();
                          setAlphabetSubTab("survival");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          alphabetSubTab === "survival"
                            ? "bg-white text-rose-600 shadow-3xs"
                            : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>Sống sót (Đúng liền 5 lần)</span>
                      </button>
                      <button
                        id="btn-subtab-match"
                        onClick={() => {
                          sounds.playClick();
                          setAlphabetSubTab("match");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          alphabetSubTab === "match"
                            ? "bg-white text-rose-600 shadow-3xs"
                            : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kéo ghép phản xạ</span>
                      </button>
                    </div>
                  </div>

                  {/* Character set filter warning */}
                  <div className="flex items-center gap-2 bg-rose-50/40 border border-rose-100 p-3 rounded-xl text-xs text-stone-600">
                    <Sliders className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>
                      Đang kiểm tra: <strong className="text-rose-600 uppercase font-bold">{characterSet === "hiragana" ? "Hiragana (Chữ mềm)" : "Katakana (Chữ cứng)"}</strong> với <strong className="font-bold text-stone-800">{activeCharPool.length} ký tự</strong> được bật. Bạn có thể chọn bảng chữ cái khác ở nút phía trên, hoặc cuộn xuống để lọc chi tiết hàng chữ cái mong muốn!
                    </span>
                  </div>
                </div>

                {/* Sub Tab render */}
                <div className="min-h-[400px]">
                  {alphabetSubTab === "survival" ? (
                    <SurvivalTestMode
                      selectedGroups={selectedGroups}
                      activeCharPool={activeCharPool}
                      characterSet={characterSet}
                    />
                  ) : (
                    <MatchingGame
                      activeCharPool={activeCharPool}
                      characterSet={characterSet}
                    />
                  )}
                </div>

                {/* The Picker Chart Section (Contained directly inside the Alphabet Test tab, which is extremely intuitive!) */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-850 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-rose-500" /> Cấu hình Bộ lọc Ký tự Kiểm tra
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Kích hoạt hoặc tắt bỏ các hàng chữ để điều chỉnh danh sách ký tự sẽ được kiểm tra ở trò chơi bên trên.
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

              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-stone-200 px-4 sm:px-8 py-6 text-center text-xs text-stone-400 mt-auto select-none">
          <p>© 2026 Nihongo Manager. Thiết kế trang quản lý học tập tối ưu phản xạ thông minh.</p>
        </footer>

      </main>

    </div>
  );
}
