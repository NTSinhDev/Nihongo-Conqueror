import React, { useState, useEffect, useRef } from "react";
import { HiraganaChar, ALL_HIRAGANA } from "../data/hiragana";
import { ALL_KATAKANA } from "../data/katakana";
import { JAPANESE_VOCABULARY, VocabularyWord } from "../data/vocabulary";
import { speakJapanese, sounds } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Flame,
  CheckCircle,
  XCircle,
  Play,
  Volume2,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Headphones,
  Eye,
  Heart,
} from "lucide-react";

interface Properties {
  selectedGroups: string[];
  activeCharPool: HiraganaChar[];
  characterSet: "hiragana" | "katakana";
}

// Uniform item structure so the streak-5 algorithm works identical across all modes
interface TestItem {
  id: string; // unique ID to track stats (hiragana or vocab word)
  display: string; // what is rendered as question (e.g. "あ" or "ねこ")
  correctRomaji: string; // correct answer base romaji
  vietnameseLabel: string; // Vietnamese guide / pronunciation
  speakText: string; // Text to synthesize
  mnemonic?: string; // Optional helper
  type: "char" | "vocab";
}

interface ItemProgress {
  consecutiveCorrect: number; // 0 to 5
  isPassed: boolean;
  totalCorrect: number;
  totalWrong: number;
}

interface ChoiceItem {
  id: string;      // e.g. "あ" or "ねこ"
  display: string; // e.g. "あ" or "ねこ"
  romaji: string;  // e.g. "a" or "neko"
  meaning: string; // e.g. "phát âm /a/" or "Con mèo"
}

type TestType = "reading" | "listening" | "vocabulary";

export default function SurvivalTestMode({ selectedGroups, activeCharPool, characterSet }: Properties) {
  const [testType, setTestType] = useState<TestType>("reading");
  const [gameState, setGameState] = useState<"setup" | "running" | "completed" | "failed">("setup");
  const [progressMap, setProgressMap] = useState<Record<string, ItemProgress>>({});
  
  // Hearts/Lives configuration
  const [enableHearts, setEnableHearts] = useState<boolean>(true);
  const [heartsLimit, setHeartsLimit] = useState<number>(3); // default 3 hearts
  const [heartsLeft, setHeartsLeft] = useState<number>(3);
  
  // The current active test pool derived from selections and test type
  const [activeTestPool, setActiveTestPool] = useState<TestItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<TestItem | null>(null);
  
  // MCQ state
  const [choices, setChoices] = useState<ChoiceItem[]>([]); // choice items matching choice structure
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Timer configuration
  const [enableTimer, setEnableTimer] = useState<boolean>(true);
  const [timerLimit, setTimerLimit] = useState<number>(5); // default 5s
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
  const [autoNext, setAutoNext] = useState(true);

  // Initialize test pool based on chosen testType
  const initializePool = (type: TestType): TestItem[] => {
    if (type === "vocabulary") {
      return JAPANESE_VOCABULARY.map((v) => ({
        id: v.japanese,
        display: v.japanese,
        correctRomaji: v.romaji,
        vietnameseLabel: v.vietnameseMeaning,
        speakText: v.japanese,
        mnemonic: v.mnemonic,
        type: "vocab",
      }));
    } else {
      // Use activeCharPool, fall back to ALL_HIRAGANA or ALL_KATAKANA if empty
      const fallbackPool = characterSet === "katakana" ? ALL_KATAKANA : ALL_HIRAGANA;
      const sourcePool = activeCharPool.length > 0 ? activeCharPool : fallbackPool;
      return sourcePool.map((c) => ({
        id: c.hiragana,
        display: c.hiragana,
        correctRomaji: c.romaji,
        vietnameseLabel: `phát âm /${c.vietnamesePronunciation}/`,
        speakText: c.hiragana,
        mnemonic: c.mnemonic,
        type: "char",
      }));
    }
  };

  // Start a new test session
  const startSurvivalTest = () => {
    const pool = initializePool(testType);
    if (pool.length === 0) return;

    sounds.playClick();
    setActiveTestPool(pool);

    const initialMap: Record<string, ItemProgress> = {};
    pool.forEach((item) => {
      initialMap[item.id] = {
        consecutiveCorrect: 0,
        isPassed: false,
        totalCorrect: 0,
        totalWrong: 0,
      };
    });

    setProgressMap(initialMap);
    setTotalQuestionsAsked(0);
    setGameState("running");
    setSelectedAnswerId(null);
    setHasAnswered(false);
    
    // Reset hearts limit for active session
    setHeartsLeft(heartsLimit);
    
    // Generate first question using the derived pool and map
    generateQuestion(pool, initialMap);
  };

  const getChoiceItem = (item: any): ChoiceItem => {
    const id = item.japanese || item.hiragana || item.katakana || item.id;
    const display = item.japanese || item.hiragana || item.katakana || item.display;
    const romaji = item.romaji || item.correctRomaji;
    const meaning = item.vietnameseMeaning || item.vietnameseLabel || (item.vietnamesePronunciation ? `phát âm /${item.vietnamesePronunciation}/` : "");
    return { id, display, romaji, meaning };
  };

  // Generate a random unpassed question
  const generateQuestion = (
    pool: TestItem[],
    currentProgress: Record<string, ItemProgress>
  ) => {
    const unpassed = pool.filter((item) => {
      const progress = currentProgress[item.id];
      return progress ? !progress.isPassed : true;
    });

    if (unpassed.length === 0) {
      setGameState("completed");
      sounds.playSuccess();
      return;
    }

    const chosen = unpassed[Math.floor(Math.random() * unpassed.length)];
    setCurrentQuestion(chosen);
    setSelectedAnswerId(null);
    setHasAnswered(false);

    // Build MCQ choices
    const choicesSet = new Set<string>();
    const choicesList: ChoiceItem[] = [];

    // Add correct answer
    const correctChoice = getChoiceItem(chosen);
    choicesList.push(correctChoice);
    choicesSet.add(correctChoice.id);

    // Get suitable distractors
    const fallbackCandidates = characterSet === "katakana" ? ALL_KATAKANA : ALL_HIRAGANA;
    const candidates = testType === "vocabulary" 
      ? JAPANESE_VOCABULARY 
      : (activeCharPool.length >= 4 ? activeCharPool : fallbackCandidates);

    // Limit to the available candidates size or max 4 options
    const maxChoices = Math.min(4, candidates.length);
    let attempts = 0;

    while (choicesSet.size < maxChoices && attempts < 150) {
      attempts++;
      const distractor = candidates[Math.floor(Math.random() * candidates.length)];
      const mappedDistractor = getChoiceItem(distractor);
      
      // Strict duplicate detection checks:
      const isDuplicate = choicesList.some((existing) => {
        const idMatch = existing.id === mappedDistractor.id;
        const displayMatch = existing.display === mappedDistractor.display;
        const romajiMatch = existing.romaji.trim().toLowerCase() === mappedDistractor.romaji.trim().toLowerCase();
        const meaningMatch = testType === "vocabulary" && 
          existing.meaning.trim().toLowerCase() === mappedDistractor.meaning.trim().toLowerCase();
        
        return idMatch || displayMatch || romajiMatch || meaningMatch;
      });

      if (!isDuplicate && !choicesSet.has(mappedDistractor.id)) {
        choicesList.push(mappedDistractor);
        choicesSet.add(mappedDistractor.id);
      }
    }

    // Fallback: Relax constraint if we couldn't fetch enough unique candidates due to pool size
    if (choicesSet.size < maxChoices) {
      for (const dist of candidates) {
        if (choicesSet.size >= maxChoices) break;
        const mappedDistractor = getChoiceItem(dist);
        if (!choicesSet.has(mappedDistractor.id)) {
          choicesList.push(mappedDistractor);
          choicesSet.add(mappedDistractor.id);
        }
      }
    }

    const shuffledChoices = choicesList.sort(() => Math.random() - 0.5);
    setChoices(shuffledChoices);

    // 1. Nhận diện đọc chữ: không tự động đọc chữ khi chuyển câu, chỉ nói khi nhấn nút phát âm.
    // Luyện nghe & Từ vựng, tự động đọc chữ ngay khi đổi câu.
    if (testType !== "reading") {
      speakJapanese(chosen.speakText);
    }
  };

  const handleAnswerSubmit = (choiceId: string) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswerId(choiceId);
    setHasAnswered(true);
    setTotalQuestionsAsked((prev) => prev + 1);

    // Match label to verify correctness
    const isResponseCorrect = choiceId === currentQuestion.id;
    setIsCorrect(isResponseCorrect);

    // Clone & update progress
    const updatedMap = { ...progressMap };
    const itemKey = currentQuestion.id;
    const currentStats = updatedMap[itemKey] || {
      consecutiveCorrect: 0,
      isPassed: false,
      totalCorrect: 0,
      totalWrong: 0,
    };

    let isGameOver = false;
    if (isResponseCorrect) {
      sounds.playSuccess();
      const updatedStreak = currentStats.consecutiveCorrect + 1;
      const willPass = updatedStreak >= 5;

      updatedMap[itemKey] = {
        ...currentStats,
        consecutiveCorrect: updatedStreak,
        isPassed: willPass,
        totalCorrect: currentStats.totalCorrect + 1,
      };
    } else {
      sounds.playFailure();
      // Speak correct pronunciation immediately when they make a mistake so they learn it on the spot
      if (currentQuestion.speakText) {
        speakJapanese(currentQuestion.speakText);
      }
      // Reset streak of this word/char to 0
      updatedMap[itemKey] = {
        ...currentStats,
        consecutiveCorrect: 0,
        totalWrong: currentStats.totalWrong + 1,
      };

      if (enableHearts) {
        const nextHearts = heartsLeft - 1;
        setHeartsLeft(nextHearts);
        if (nextHearts <= 0) {
          isGameOver = true;
        }
      }
    }

    setProgressMap(updatedMap);

    // Auto next or Game Over logic
    if (isGameOver) {
      const timer = setTimeout(() => {
        setGameState("failed");
      }, 1800);
      return () => clearTimeout(timer);
    } else if (isResponseCorrect && autoNext) {
      const timer = setTimeout(() => {
        generateQuestion(activeTestPool, updatedMap);
      }, 1500);
      return () => clearTimeout(timer);
    }
  };

  // Safe latest ref pattern to support interval triggering without stale state issues
  const handleAnswerSubmitRef = useRef(handleAnswerSubmit);
  useEffect(() => {
    handleAnswerSubmitRef.current = handleAnswerSubmit;
  }, [handleAnswerSubmit]);

  // Game timer loop
  useEffect(() => {
    if (gameState !== "running" || !enableTimer || hasAnswered || !currentQuestion) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      return;
    }

    setTimeLeft(timerLimit);

    questionTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
          }
          // Timeout occurred! Trigger incorrect answer
          handleAnswerSubmitRef.current("__TIMEOUT__");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [currentQuestion, gameState, hasAnswered, enableTimer, timerLimit]);

  const triggerNext = () => {
    sounds.playClick();
    generateQuestion(activeTestPool, progressMap);
  };

  const handleRestart = () => {
    sounds.playClick();
    setGameState("setup");
  };

  const totalItemsCount = activeTestPool.length;
  const passedCount = (Object.values(progressMap) as ItemProgress[]).filter((item) => item.isPassed).length;
  const percentComplete = totalItemsCount > 0 ? Math.round((passedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Dynamic Intro Header */}
      <div className="bg-white rounded-2xl border border-stone-150 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
              Thử Thách Sống Sót 5x
            </span>
            <h2 className="text-xl font-extrabold text-stone-850 tracking-tight">Kỳ Thi Phản Xạ Hiragana Cực Hạn</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Để hoàn thành bài thi cực hạn, bạn phải trả lời đúng mỗi chữ/từ vựng <strong className="text-rose-500">5 lần liên tiếp</strong>. 
            Bất kỳ câu trả lời sai nào hoặc quá giờ trả lời sẽ ngay lập tức kéo chuỗi streak về 0!
          </p>
        </div>

        {gameState === "running" && (
          <button
            id="btn-quit-survival"
            onClick={handleRestart}
            className="px-4 py-2 hover:bg-stone-100 text-stone-500 hover:text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 transition-colors"
          >
            Quay lại cài đặt
          </button>
        )}
      </div>

      {/* SETUP SCREEN */}
      {gameState === "setup" && (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 md:p-10 shadow-xs max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div id="setup-decor-icon" className="inline-flex w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 items-center justify-center mb-2 border border-rose-100 animate-float">
              <Flame className="w-7 h-7 fill-rose-100" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-850">Chọn Chế Độ Thi Phản Xạ</h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              Bắt đầu hành trình kiểm tra bản thân bằng một trong ba phương pháp học sâu dưới đây
            </p>
          </div>

          {/* Test Type Selectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Reading Mode option */}
            <button
              id="setup-mode-reading-btn"
              onClick={() => {
                sounds.playClick();
                setTestType("reading");
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all space-y-3 ${
                testType === "reading"
                  ? "bg-rose-50/40 border-rose-500 shadow-xs"
                  : "bg-stone-50 border-stone-150 hover:bg-stone-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl ${testType === "reading" ? "bg-rose-500 text-white" : "bg-stone-200/80 text-stone-600"}`}>
                  <Eye className="w-5 h-5" />
                </span>
                {testType === "reading" && <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">Đang chọn</span>}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-800">1. Nhận Diện Đọc Chữ</h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Nhìn mặt chữ Hiragana để chọn Romaji tương ứng. Hỗ trợ phát âm thủ công hạn chế gợi ý bộc phát.
                </p>
              </div>
            </button>

            {/* Listening Mode option */}
            <button
              id="setup-mode-listening-btn"
              onClick={() => {
                sounds.playClick();
                setTestType("listening");
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all space-y-3 ${
                testType === "listening"
                  ? "bg-rose-50/40 border-rose-500 shadow-xs"
                  : "bg-stone-50 border-stone-150 hover:bg-stone-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl ${testType === "listening" ? "bg-rose-500 text-white" : "bg-stone-200/80 text-stone-600"}`}>
                  <Headphones className="w-5 h-5" />
                </span>
                {testType === "listening" && <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">Đang chọn</span>}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-800">2. Luyện Nghe Phản Xạ</h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                  Ẩn chữ cái, chỉ phát tiếng đọc bản xứ. Nhìn và chọn đúng mặt chữ cái Hiragana tương thích bạn vừa được nghe.
                </p>
              </div>
            </button>

            {/* Vocabulary Hardcore Mode option */}
            <button
              id="setup-mode-vocab-btn"
              onClick={() => {
                sounds.playClick();
                setTestType("vocabulary");
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all space-y-3 ${
                testType === "vocabulary"
                  ? "bg-stone-900 border-stone-950 text-white shadow-md transform scale-102"
                  : "bg-stone-50 border-stone-150 hover:bg-stone-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl ${testType === "vocabulary" ? "bg-rose-500 text-white" : "bg-stone-200/80 text-stone-600"}`}>
                  <BookOpen className="w-5 h-5 font-bold" />
                </span>
                <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                  Hardcore
                </span>
              </div>
              <div>
                <h4 className={`text-sm font-black ${testType === "vocabulary" ? "text-white" : "text-stone-800"}`}>
                  3. Từ Vựng Bản Xứ
                </h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${testType === "vocabulary" ? "text-stone-300" : "text-stone-400"}`}>
                  Kiểm tra từ vựng tiếng Nhật. Phiên âm Romaji được ẩn cho đến khi chọn để bảo đảm thuộc nghĩa tiếng Việt sâu!
                </p>
              </div>
            </button>

          </div>

          {/* Time limit option input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-rose-50/25 border border-rose-100/50 rounded-2xl">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-800 cursor-pointer select-none">
                <input
                  id="checkbox-enable-timer-limit"
                  type="checkbox"
                  checked={enableTimer}
                  onChange={(e) => {
                    sounds.playClick();
                    setEnableTimer(e.target.checked);
                  }}
                  className="rounded border-stone-350 text-rose-600 focus:ring-rose-400 w-4 h-4"
                />
                <span>⏱️ Giới hạn thời gian trả lời mỗi câu hỏi</span>
              </label>
              <p className="text-[11px] text-stone-400 pl-6">
                Đặt thêm áp lực thời gian giúp gia tăng đáng kể phản ứng thần kinh tự nhiên
              </p>
            </div>

            {enableTimer && (
              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                <span className="text-xs text-stone-500 font-medium font-sans">Thời gian giới hạn:</span>
                <input
                  id="input-timer-seconds"
                  type="number"
                  min={2}
                  max={60}
                  value={timerLimit}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 5;
                    setTimerLimit(Math.max(2, Math.min(60, val)));
                  }}
                  className="w-20 px-3 py-1.5 border border-stone-250 rounded-xl text-xs font-mono font-bold text-center text-stone-850 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-xs text-stone-405 font-bold font-mono">giây</span>
              </div>
            )}
          </div>

          {/* Heart/Lives option input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-rose-50/25 border border-rose-100/50 rounded-2xl">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-800 cursor-pointer select-none">
                <input
                  id="checkbox-enable-hearts-limit"
                  type="checkbox"
                  checked={enableHearts}
                  onChange={(e) => {
                    sounds.playClick();
                    setEnableHearts(e.target.checked);
                  }}
                  className="rounded border-stone-350 text-rose-600 focus:ring-rose-400 w-4 h-4"
                />
                <span>❤️ Giới hạn mạng sống (Số tim cho phép sai)</span>
              </label>
              <p className="text-[11px] text-stone-400 pl-6">
                Khi hết tim, bạn sẽ thất bại thử thách ngay lập tức mà không thể hoàn thành bài thi
              </p>
            </div>

            {enableHearts && (
              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                <span className="text-xs text-stone-500 font-medium font-sans">Số mạng sống:</span>
                <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded-xl">
                  {[1, 2, 3, 5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      id={`btn-setup-hearts-${h}`}
                      onClick={() => {
                        sounds.playClick();
                        setHeartsLimit(h);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                        heartsLimit === h
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-transparent text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {h} <Heart className="w-3 h-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details / Stats for chosen mode */}
          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5 text-left space-y-3">
            <span className="block text-[10px] text-stone-400 font-extrabold uppercase tracking-wide">
              CẤU HÌNH PHÒNG THI SẮP TỚI
            </span>
            
            {testType === "vocabulary" ? (
              <div className="text-xs space-y-1.5 text-stone-600">
                <p>• 🧩 Danh sách nguồn: <strong className="text-stone-800">{JAPANESE_VOCABULARY.length} từ vựng Tiếng Nhật giao tiếp thông dụng</strong></p>
                <p>• 🏆 Cách trả lời: <strong className="text-stone-850">Ghép nghĩa Tiếng Việt (Romaji được tuyệt đối ẩn lúc lướt đáp án)</strong></p>
                <p>• 🔥 Độ khó: <strong className="text-red-600 text-xs">Cực hạn</strong> {enableTimer && <strong className="text-rose-500 font-mono">({timerLimit}s đếm ngược)</strong>}</p>
                <p>• ❤️ Giới hạn tim: <strong className={enableHearts ? "text-rose-600 font-bold" : "text-stone-500 font-bold"}>{enableHearts ? `${heartsLimit} mạng sống (cho phép sai ${heartsLimit - 1} lần)` : "Không giới hạn (Vô cực)"}</strong></p>
              </div>
            ) : (
              <div className="text-xs space-y-1.5 text-stone-600">
                <p>• 🧩 Số chữ cái đã chọn: <strong className="text-stone-800">{activeCharPool.length || ALL_HIRAGANA.length} chữ cái {characterSet === "katakana" ? "Katakana" : "Hiragana"}</strong> {activeCharPool.length === 0 && <span className="text-[10px] text-stone-400 font-semibold italic">(Mặc định chọn toàn bộ bảng chữ)</span>}</p>
                <p>• 🏆 Điểm đạt chuẩn: <strong className="text-emerald-600">Chuỗi 5 câu đúng liên tục cho từng chữ cái một</strong></p>
                <p>• 🔊 Hỗ trợ âm thanh: <strong className="text-stone-850">{testType === "reading" ? "Không tự động nói (Chỉ nói khi bấm nút)" : "Có, tự động phát âm ngay khi chuyển câu"}</strong></p>
                <p>• ❤️ Giới hạn tim: <strong className={enableHearts ? "text-rose-600 font-bold" : "text-stone-500 font-bold"}>{enableHearts ? `${heartsLimit} mạng sống (cho phép sai ${heartsLimit - 1} lần)` : "Không giới hạn (Vô cực)"}</strong></p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              id="btn-start-survival-now"
              onClick={startSurvivalTest}
              className="px-10 py-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-2xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> BẮT ĐẦU THỬ THÁCH SỐNG SÓT ngay
            </button>
          </div>

        </div>
      )}

      {/* RUNNING GAME SCREEN */}
      {gameState === "running" && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Block: Main Quiz Area (7 Columns) */}
          <div className="lg:col-span-7 bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-4 sm:p-6 md:p-8 shadow-xs space-y-4 sm:space-y-6">
            
            {/* Answer Stats Info & Time countdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 gap-2 sm:gap-3">
              <div className="flex items-center justify-start w-full sm:w-auto gap-3.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-stone-400 shrink-0">
                  Lượt bấm: <span id="span-total-clicks" className="text-stone-700">{totalQuestionsAsked}</span>
                </span>

                {/* Hearts limit indicator */}
                {enableHearts && (
                  <div className="flex items-center gap-1 shrink-0 bg-rose-50/70 border border-rose-100 px-2 py-0.5 rounded-full">
                    <span className="text-[10px] font-bold text-rose-600 font-sans">Mạng:</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: heartsLimit }).map((_, i) => {
                        const isLost = i >= heartsLeft;
                        return (
                          <Heart
                            key={i}
                            className={`w-3 h-3 transition-colors ${
                              isLost 
                                ? "text-stone-300 fill-none" 
                                : "text-rose-500 fill-rose-500"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Countdown indicator */}
                {enableTimer && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-stone-400 font-sans">Thời gian:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold shadow-2xs ${
                      hasAnswered 
                        ? "bg-stone-50 text-stone-450"
                        : timeLeft <= 2 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-rose-100 text-rose-700"
                    }`}>
                      {hasAnswered ? "--" : `${timeLeft}s`}
                    </span>
                  </div>
                )}
              </div>

              <button
                id="btn-survival-speak"
                onClick={() => speakJapanese(currentQuestion.speakText)}
                className="flex items-center justify-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold transition-all w-full sm:w-auto mt-0.5 sm:mt-0"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="w-3.5 h-3.5" /> Phát âm giọng chuẩn
              </button>
            </div>

            {/* Time progress bar */}
            {enableTimer && !hasAnswered && (
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden shrink-0 -mt-2">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 2 ? "bg-red-500" : timeLeft <= timerLimit / 2 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${(timeLeft / timerLimit) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Question Display Card (Hidden in listening mode until answered) */}
            <div className="bg-stone-50 rounded-xl sm:rounded-2xl py-6 sm:py-12 text-center relative border border-stone-100 overflow-hidden">
              
              {testType === "listening" && !hasAnswered ? (
                // Listening mode: Display a big interactive Speaker button so they listen carefully
                <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                  <button
                    id="btn-listening-pulse"
                    onClick={() => speakJapanese(currentQuestion.speakText)}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-500 hover:bg-rose-400 text-white rounded-full flex items-center justify-center shadow-md border-4 border-rose-100 transition-all cursor-pointer animate-float"
                  >
                    <Volume2 className="w-8 h-8 sm:w-10 sm:h-10" />
                  </button>
                  <span className="text-[11px] sm:text-xs font-bold text-rose-500 animate-pulse">Luyện Nghe: Nhấn loa phát lại âm thanh</span>
                </div>
              ) : (
                // Reading mode & Vocabulary mode OR after answered in listening mode
                <div>
                  <span className={`font-serif-jp font-black text-stone-850 tracking-normal select-none block animate-float ${
                    testType === "vocabulary" ? "text-4xl sm:text-5xl md:text-6xl" : "text-7xl sm:text-8xl md:text-9xl"
                  }`}>
                    {currentQuestion.display}
                  </span>
                  
                  {/* Under reading or vocabulary, show help subtitle after answering */}
                  {hasAnswered && (
                    <div className="mt-2.5 sm:mt-3 flex flex-col items-center gap-1 sm:gap-1.5">
                      <span className="block text-xs font-mono text-rose-600 font-extrabold bg-rose-50 px-3 py-1 rounded-full">
                        Phát âm chuẩn: /{currentQuestion.correctRomaji}/
                      </span>
                      {testType === "vocabulary" && (
                        <span className="block text-xs text-stone-500 font-medium">
                          Nghĩa Việt: &ldquo;{currentQuestion.vietnameseLabel}&rdquo;
                        </span>
                      )}
                    </div>
                  )}

                  {testType === "listening" && hasAnswered && (
                    <span className="block mt-2 text-[10px] bg-rose-500/15 text-rose-700 px-2.5 py-0.5 rounded-full font-bold w-fit mx-auto">
                      Đã hé lộ chữ cái
                    </span>
                  )}
                </div>
              )}

              {/* Grid Lines for layout balance */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04]">
                <svg className="w-full h-full text-stone-900" viewBox="0 0 100 100">
                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Individual streak count badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                <span className="text-[10px] bg-white border border-stone-150 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 font-bold text-stone-600 block shadow-3xs">
                  Chuỗi hiện tại: {progressMap[currentQuestion.id]?.consecutiveCorrect || 0}/5
                </span>
              </div>
            </div>

            {/* Grid options choices */}
            <div className="space-y-2 sm:space-y-3">
              <span className="block text-[11px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                {testType === "vocabulary"
                  ? "Chọn nghĩa Tiếng Việt tương ứng (Romaji được ẩn):"
                  : testType === "listening"
                    ? "Chọn biểu tượng Hiragana phù hợp âm đọc:"
                    : "Chọn đúng Romaji tương ứng:"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                {choices.map((choice) => {
                  const isChoiceSelected = selectedAnswerId === choice.id;
                  const isChoiceCorrect = choice.id === currentQuestion.id;

                  let btnColor = "bg-stone-50 border-stone-200/80 hover:bg-stone-100/80 text-stone-850";
                  let endIcon = null;

                  if (hasAnswered) {
                    if (isChoiceCorrect) {
                       btnColor = "bg-green-50 border-green-300 text-green-700 font-extrabold scale-[1.01]";
                       endIcon = <CheckCircle className="w-4 h-4 text-green-600 shrink-0 fill-green-50" />;
                    } else if (isChoiceSelected) {
                      btnColor = "bg-rose-50 border-rose-300 text-rose-700 font-extrabold";
                      endIcon = <XCircle className="w-4 h-4 text-rose-600 shrink-0 fill-rose-50" />;
                    } else {
                      btnColor = "bg-stone-50/50 border-stone-100 text-stone-400 opacity-60";
                    }
                  }

                  // Determine button label text dynamically:
                  let labelHTMLText = "";
                  if (testType === "vocabulary") {
                    // Từ vựng: KHÔNG hiển thị romanji khi người dùng chưa trả lời, chỉ hiển thị sau khi đã chọn
                    if (hasAnswered) {
                      labelHTMLText = `${choice.romaji} - (${choice.meaning})`;
                    } else {
                      labelHTMLText = choice.meaning; // Show only meaning before submit
                    }
                  } else if (testType === "listening") {
                    // Luyện nghe: Hiển thị chữ cái tiếng Nhật đang học thay vì Romaji
                    labelHTMLText = choice.display;
                  } else {
                    // Nhận diện đọc chữ: Hiển thị Romaji
                    labelHTMLText = choice.romaji;
                  }

                  return (
                    <button
                      id={`survival-choice-${choice.id.replace(/\s+/g, "_")}`}
                      key={choice.id}
                      disabled={hasAnswered}
                      onClick={() => handleAnswerSubmit(choice.id)}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left text-xs md:text-sm font-sans font-bold transition-all flex items-center justify-between gap-3 cursor-pointer ${btnColor}`}
                    >
                      <span className={testType === "listening" ? "font-serif-jp text-base" : "font-sans"}>
                        {labelHTMLText}
                      </span>
                      {endIcon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* controls panel */}
            <div className="pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-stone-500 text-xs cursor-pointer select-none">
                <input
                  id="checkbox-survival-auto-next"
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => {
                    sounds.playClick();
                    setAutoNext(e.target.checked);
                  }}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-400"
                />
                <span>Tự động qua câu mới sau 1.5s (Chỉ khi đúng)</span>
              </label>

              {hasAnswered && (
                <button
                  id="btn-survival-next-trigger"
                  onClick={triggerNext}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  Qua câu khác <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mnemonic and visual help card if wrong or timeout */}
            {hasAnswered && !isCorrect && (
              <div className="bg-rose-50/20 border border-rose-100 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                <Lightbulb className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-700">Mẹo giải câu và nghĩa Việt</h5>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Mẫu chữ <strong className="font-serif-jp text-rose-600 text-sm font-black">{currentQuestion.display}</strong> có phiên âm la-tinh là <strong className="font-mono text-stone-900 font-bold">{currentQuestion.correctRomaji}</strong> ({currentQuestion.vietnameseLabel}).
                    {currentQuestion.mnemonic && (
                      <span className="block mt-1 italic text-stone-405">&ldquo;{currentQuestion.mnemonic}&rdquo;</span>
                    )}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right Block: Overall Test Dashboard Tracker (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global Metric Gauge */}
            <div className="bg-stone-950 text-white rounded-2xl p-5 border border-stone-850 shadow-md">
              <h3 className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase mb-3">
                TIẾN TRÌNH THỦ THÁCH SỐNG SÓT
              </h3>

              <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                <span>Số phần tử đạt chuẩn (Streak 5x):</span>
                <span className="font-bold text-white tracking-wider text-xs">
                  {passedCount} / {totalItemsCount}
                </span>
              </div>

              {/* Progress gauge bar */}
              <div className="w-full bg-stone-850 h-3 rounded-full overflow-hidden mb-4 border border-stone-800">
                <div
                  className="h-full bg-green-500 transition-all duration-700"
                  style={{ width: `${percentComplete}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-850">
                  <span className="block text-[8px] text-stone-500 uppercase font-bold">Tỷ lệ thuộc</span>
                  <span className="font-mono text-lg font-black text-rose-500">{percentComplete}%</span>
                </div>
                <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-850">
                  <span className="block text-[8px] text-stone-500 uppercase font-bold">Cần hoàn thành</span>
                  <span className="font-mono text-lg font-black text-white">{totalItemsCount - passedCount}</span>
                </div>
              </div>
            </div>

            {/* List box detailing individual streaks */}
            <div className="bg-white rounded-2xl border border-stone-150 p-5 shadow-xs max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Trạng thái lặp lại chi tiết
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100 font-mono">
                  <span>● Đúng</span>
                  <span>○ Hỏng</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100/65">
                {activeTestPool.map((item) => {
                  const data = progressMap[item.id] || {
                    consecutiveCorrect: 0,
                    isPassed: false,
                    totalCorrect: 0,
                    totalWrong: 0,
                  };

                  return (
                    <div
                      id={`survival-track-${item.id}`}
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-serif-jp font-bold text-stone-800 ${testType === "vocabulary" ? "text-sm" : "text-base"}`}>
                          {item.display}
                        </span>
                        <span className="font-mono text-[9px] text-stone-400 lowercase truncate max-w-[120px]">
                          ({item.correctRomaji})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {data.isPassed ? (
                          <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                            ✓ THUỘC SÂU
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full border transition-all ${
                                  i < data.consecutiveCorrect
                                    ? "bg-rose-500 border-rose-600 scale-110"
                                    : "bg-stone-50 border-stone-200"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* COMPLETED SUCCESS SCREEN */}
      {gameState === "completed" && (
        <div className="bg-stone-900 text-white rounded-3xl p-8 text-center max-w-2xl mx-auto py-12 shadow-md relative overflow-hidden">
          
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-44 h-44 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute left-0 top-0 -translate-x-8 -translate-y-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div id="congrats-decor-podium" className="inline-block p-4 bg-emerald-500/10 text-emerald-500 rounded-full mb-6 scale-110 border border-emerald-500/20">
            <Trophy className="w-10 h-10 fill-emerald-500/10" />
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Tuyệt Đỉnh Phản Xạ! 🏆</h3>
          <p className="text-stone-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
            Bạn đã vượt qua toàn bộ mục kiểm tra với chuỗi đúng <strong className="text-emerald-500">5 lần liên tục riêng biệt</strong> cho mỗi từ/chữ cái!
          </p>

          <div className="my-8 max-w-sm mx-auto bg-stone-950 rounded-2xl p-5 border border-stone-850 text-left space-y-3.5">
            <span className="block text-[9px] text-stone-500 uppercase tracking-widest font-black">Nhật ký kỳ thi</span>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Chế độ đã luyện:</span>
              <strong className="text-white">
                {testType === "reading" ? "Đọc nhận diện chữ" : testType === "listening" ? "Luyện nghe tiếng Nhật" : "Từ vựng bản xứ"}
              </strong>
            </div>
            <div className="flex justify-between text-xs border-t border-stone-900 pt-3">
              <span className="text-stone-400">Tổng số lượt trả lời:</span>
              <strong className="text-white font-mono">{totalQuestionsAsked} lượt bấm</strong>
            </div>
            <div className="flex justify-between text-xs border-t border-stone-900 pt-3">
              <span className="text-stone-400">Số lượng hoàn thành:</span>
              <strong className="text-green-500 font-mono">{passedCount} / {totalItemsCount} nội dung</strong>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              id="btn-completed-restart-survival"
              onClick={startSurvivalTest}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              Luyện lại đề này
            </button>
            <button
              id="btn-completed-to-setup"
              onClick={handleRestart}
              className="px-6 py-3 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Chọn chế độ khác
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED FAILED SCREEN */}
      {gameState === "failed" && (
        <div className="bg-stone-900 text-white rounded-3xl p-8 text-center max-w-2xl mx-auto py-12 shadow-md relative overflow-hidden">
          
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-44 h-44 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute left-0 top-0 -translate-x-8 -translate-y-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div id="failed-decor-podium" className="inline-block p-4 bg-rose-500/10 text-rose-500 rounded-full mb-6 scale-110 border border-rose-500/20">
            <XCircle className="w-10 h-10 fill-rose-500/10" />
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Kỳ Thi Thất Bại! ❤️‍🩹</h3>
          <p className="text-stone-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
            Bạn đã dùng hết tất cả số mạng sống được chọn trước đó. Đừng nản lòng, luyện tập nhiều sẽ giúp phản xạ nhanh hơn!
          </p>

          <div className="my-8 max-w-sm mx-auto bg-stone-950 rounded-2xl p-5 border border-stone-850 text-left space-y-3.5">
            <span className="block text-[9px] text-stone-500 uppercase tracking-widest font-black">Người hùng chiến đấu</span>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Chế độ luyện:</span>
              <strong className="text-white">
                {testType === "reading" ? "Đọc nhận diện chữ" : testType === "listening" ? "Luyện nghe tiếng Nhật" : "Từ vựng bản xứ"}
              </strong>
            </div>
            <div className="flex justify-between text-xs border-t border-stone-900 pt-3">
              <span className="text-stone-400">Tổng số lượt bấm:</span>
              <strong className="text-white font-mono">{totalQuestionsAsked} lượt bấm</strong>
            </div>
            <div className="flex justify-between text-xs border-t border-stone-900 pt-3">
              <span className="text-stone-400">Đã thuộc sâu:</span>
              <strong className="text-rose-550 font-mono">{passedCount} / {totalItemsCount} nội dung</strong>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              id="btn-failed-restart-survival"
              onClick={startSurvivalTest}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              Thử lại lần nữa
            </button>
            <button
              id="btn-failed-to-setup"
              onClick={handleRestart}
              className="px-6 py-3 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Thay đổi cấu hình
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
