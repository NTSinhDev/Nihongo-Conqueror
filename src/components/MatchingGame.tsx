import React, { useState, useEffect, useRef } from "react";
import { HiraganaChar, ALL_HIRAGANA } from "../data/hiragana";
import { ALL_KATAKANA } from "../data/katakana";
import { JAPANESE_VOCABULARY } from "../data/vocabulary";
import { speakJapanese, sounds } from "../utils/audio";
import { Sparkles, Timer, RotateCcw, Award, Zap, Trophy, ShieldAlert, HeartCrack } from "lucide-react";

interface Properties {
  activeCharPool: HiraganaChar[];
  characterSet: "hiragana" | "katakana";
}

interface Tile {
  id: string; // unique ID
  value: string; // the Japanese symbol or its romaji/meaning equivalence
  type: "hiragana" | "romaji";
  matchKey: string; // the romaji representation representing the absolute key
  isCleared: boolean;
}

interface LevelConfig {
  level: number;
  pairCount: number;
  mode: "char" | "vocab" | "mixed";
  timeLimit: number;
  description: string;
}

const getLevelConfig = (lvl: number): LevelConfig => {
  if (lvl === 1) return { level: 1, pairCount: 3, mode: "char", timeLimit: 25, description: "Bình minh: Ghép 3 cặp chữ cái cơ bản (6 thẻ)" };
  if (lvl === 2) return { level: 2, pairCount: 4, mode: "char", timeLimit: 30, description: "Khởi động: Ghép 4 cặp chữ cái (8 thẻ)" };
  if (lvl === 3) return { level: 3, pairCount: 5, mode: "char", timeLimit: 35, description: "Tăng tốc: Ghép 5 cặp chữ cái (10 thẻ)" };
  if (lvl === 4) return { level: 4, pairCount: 6, mode: "char", timeLimit: 40, description: "Thượng thừa chữ cái: Ghép 6 cặp chữ cái (12 thẻ)" };
  if (lvl === 5) return { level: 5, pairCount: 8, mode: "char", timeLimit: 45, description: "Ma trận Cơ bản: Ghép 8 cặp chữ cái (16 thẻ)" };
  if (lvl === 6) return { level: 6, pairCount: 4, mode: "vocab", timeLimit: 50, description: "Sơ cấp Từ Vựng: Ghép từ vựng với nghĩa Việt (8 thẻ)" };
  if (lvl === 7) return { level: 7, pairCount: 6, mode: "vocab", timeLimit: 55, description: "Trung cấp Từ Vựng: 6 từ vựng Việt - Nhật (12 thẻ)" };
  if (lvl === 8) return { level: 8, pairCount: 8, mode: "vocab", timeLimit: 60, description: "Cao cấp Từ Vựng: Ghi nhớ bản xứ cực sâu (16 thẻ)" };
  if (lvl === 9) return { level: 9, pairCount: 8, mode: "mixed", timeLimit: 60, description: "Hỗn hợp Sơ cấp: Trộn Chữ cái & Từ vựng (16 thẻ)" };
  if (lvl === 10) return { level: 10, pairCount: 10, mode: "mixed", timeLimit: 75, description: "Đại lộ Thử thách: Trộn 10 cặp Chữ & Từ vựng (20 thẻ)" };
  if (lvl === 11) return { level: 11, pairCount: 12, mode: "char", timeLimit: 85, description: "Siêu Việt Chữ Cái: Ma trận 12 cặp khó nhằn (24 thẻ)" };
  if (lvl === 12) return { level: 12, pairCount: 15, mode: "vocab", timeLimit: 100, description: "Siêu Việt Từ Vựng: Ma trận 15 từ ghép đôi (30 thẻ)" };
  if (lvl === 13) return { level: 13, pairCount: 18, mode: "mixed", timeLimit: 120, description: "Độ bão hòa Hỗn hợp: Ghép 18 cặp chữ và từ (36 thẻ)" };
  if (lvl === 14) return { level: 14, pairCount: 24, mode: "char", timeLimit: 140, description: "Tuyệt đỉnh nhãn lực: Thử thách 24 cặp kí tự (48 thẻ)" };
  if (lvl === 15) return { level: 15, pairCount: 32, mode: "mixed", timeLimit: 180, description: "CỰC HẠN PHẢN XẠ: Bản hòa ca ma trận 64 lá bài!" };

  // Level 16 and above
  const pairCount = lvl >= 20 ? 32 : lvl >= 18 ? 24 : 16;
  const timeLimit = Math.max(40, 180 - (lvl - 15) * 5);
  const mode = lvl % 3 === 0 ? "mixed" : lvl % 3 === 1 ? "vocab" : "char";
  return {
    level: lvl,
    pairCount,
    mode,
    timeLimit,
    description: `Truyền Thuyết Vô Hạn (Cấp ${lvl}): Phản xạ chớp nhoáng ${pairCount * 2} lá (${mode === "char" ? "Chữ cái" : mode === "vocab" ? "Từ vựng" : "Hỗn hợp"})`
  };
};

interface GridDimensions {
  cols: number;
  rows: number;
}

const getGridDimensions = (totalTiles: number, isMobile: boolean): GridDimensions => {
  if (isMobile) {
    if (totalTiles <= 4) return { cols: 2, rows: 2 };
    if (totalTiles <= 6) return { cols: 2, rows: 3 };
    if (totalTiles <= 8) return { cols: 2, rows: 4 };
    if (totalTiles <= 10) return { cols: 2, rows: 5 };
    if (totalTiles <= 12) return { cols: 3, rows: 4 };
    if (totalTiles <= 16) return { cols: 4, rows: 4 };
    if (totalTiles <= 20) return { cols: 4, rows: 5 };
    if (totalTiles <= 24) return { cols: 4, rows: 6 };
    if (totalTiles <= 30) return { cols: 5, rows: 6 };
    if (totalTiles <= 36) return { cols: 6, rows: 6 };
    if (totalTiles <= 48) return { cols: 6, rows: 8 };
    if (totalTiles <= 60) return { cols: 6, rows: 10 };
    return { cols: 8, rows: 8 }; // 64 tiles fallback
  } else {
    if (totalTiles <= 4) return { cols: 2, rows: 2 };
    if (totalTiles <= 6) return { cols: 3, rows: 2 };
    if (totalTiles <= 8) return { cols: 4, rows: 2 };
    if (totalTiles <= 10) return { cols: 5, rows: 2 };
    if (totalTiles <= 12) return { cols: 4, rows: 3 };
    if (totalTiles <= 16) return { cols: 4, rows: 4 };
    if (totalTiles <= 20) return { cols: 5, rows: 4 };
    if (totalTiles <= 24) return { cols: 6, rows: 4 };
    if (totalTiles <= 30) return { cols: 6, rows: 5 };
    if (totalTiles <= 32) return { cols: 8, rows: 4 };
    if (totalTiles <= 36) return { cols: 6, rows: 6 };
    if (totalTiles <= 40) return { cols: 8, rows: 5 };
    if (totalTiles <= 48) return { cols: 8, rows: 6 };
    if (totalTiles <= 52) return { cols: 10, rows: 5 };
    if (totalTiles <= 60) return { cols: 10, rows: 6 };
    return { cols: 8, rows: 8 }; // 64 tiles fallback
  }
};

interface TileSizing {
  hiraSize: string;
  romajiSize: string;
  paddings: string;
  showLabels: boolean;
  gapClass: string;
}

const getTileSizing = (totalTiles: number, isMobile: boolean): TileSizing => {
  if (isMobile) {
    if (totalTiles <= 8) {
      return {
        hiraSize: "text-xl sm:text-3xl md:text-5xl",
        romajiSize: "text-[11px] sm:text-xs md:text-base",
        paddings: "p-1 sm:p-2",
        showLabels: false,
        gapClass: "gap-1.5 sm:gap-4",
      };
    }
    if (totalTiles <= 16) {
      return {
        hiraSize: "text-lg sm:text-2xl md:text-3xl",
        romajiSize: "text-[10px] sm:text-xs md:text-sm",
        paddings: "p-1 sm:p-1.5",
        showLabels: false,
        gapClass: "gap-1 sm:gap-3",
      };
    }
    return {
      hiraSize: "text-sm sm:text-lg md:text-xl",
      romajiSize: "text-[8px] sm:text-[9px] md:text-xs",
      paddings: "p-0.5 sm:p-1.5",
      showLabels: false,
      gapClass: "gap-0.5 sm:gap-1.5",
    };
  }

  if (totalTiles <= 8) {
    return {
      hiraSize: "text-2xl sm:text-4xl md:text-5xl",
      romajiSize: "text-xs sm:text-sm md:text-base",
      paddings: "p-2 sm:p-4",
      showLabels: true,
      gapClass: "gap-3 sm:gap-4",
    };
  }
  if (totalTiles <= 16) {
    return {
      hiraSize: "text-xl sm:text-2xl md:text-3xl",
      romajiSize: "text-xs sm:text-xs md:text-sm",
      paddings: "p-1.5 sm:p-2.5",
      showLabels: true,
      gapClass: "gap-2 sm:gap-3",
    };
  }
  if (totalTiles <= 32) {
    return {
      hiraSize: "text-lg sm:text-xl md:text-2xl",
      romajiSize: "text-[10px] sm:text-[11px] md:text-xs",
      paddings: "p-1 sm:p-2",
      showLabels: false,
      gapClass: "gap-1.5 sm:gap-2",
    };
  }
  if (totalTiles <= 48) {
    return {
      hiraSize: "text-base sm:text-lg md:text-xl",
      romajiSize: "text-[9px] sm:text-[10px] md:text-xs",
      paddings: "p-0.5 sm:p-1.5",
      showLabels: false,
      gapClass: "gap-1 sm:gap-1.5",
    };
  }
  // Up to 64 tiles
  return {
    hiraSize: "text-xs sm:text-sm md:text-base",
    romajiSize: "text-[8px] sm:text-[9px] md:text-[10px]",
    paddings: "p-0.5 sm:p-1",
    showLabels: false,
    gapClass: "gap-0.5 sm:gap-1",
  };
};

const getDynamicTextClass = (
  value: string,
  type: "hiragana" | "romaji",
  totalTiles: number,
  isMobile: boolean
): string => {
  const isHighDensity = totalTiles > 24;
  const isMediumDensity = totalTiles > 12;

  if (type === "hiragana") {
    const len = value.length;
    if (len === 1) {
      if (isMobile) {
        if (isHighDensity) return "text-base sm:text-lg md:text-xl font-black text-rose-600";
        if (isMediumDensity) return "text-xl sm:text-2xl md:text-3xl font-black text-rose-600";
        return "text-3xl sm:text-4xl md:text-5xl font-black text-rose-600";
      } else {
        if (isHighDensity) return "text-xl sm:text-2xl md:text-3xl font-black text-rose-600";
        if (isMediumDensity) return "text-3xl sm:text-4xl md:text-5xl font-black text-rose-600";
        return "text-5xl sm:text-6xl md:text-7xl font-black text-rose-600";
      }
    } else if (len === 2) {
      if (isMobile) {
        if (isHighDensity) return "text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-stone-900";
        if (isMediumDensity) return "text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-stone-900";
        return "text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900";
      } else {
        if (isHighDensity) return "text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-stone-900";
        if (isMediumDensity) return "text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900";
        return "text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900";
      }
    } else {
      if (isMobile) {
        if (isHighDensity) return "text-[9px] sm:text-[10px] md:text-xs font-bold tracking-tighter leading-none text-stone-900";
        if (isMediumDensity) return "text-[11px] sm:text-xs md:text-sm font-bold tracking-tighter leading-none text-stone-900";
        return "text-base sm:text-lg md:text-xl font-bold tracking-tight text-stone-900";
      } else {
        if (isHighDensity) return "text-xs sm:text-sm md:text-base font-bold tracking-tighter text-stone-900";
        if (isMediumDensity) return "text-base sm:text-lg md:text-xl font-bold tracking-tighter text-stone-900";
        return "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900";
      }
    }
  } else {
    // Romaji / translation / meaning
    const len = value.length;
    if (len <= 2) {
      // Single/double romaji like "yu", "ta", "ji" -> MAKE THEM VERY LARGE & PROMIMENT
      if (isMobile) {
        if (isHighDensity) return "text-xs sm:text-sm font-black tracking-wider uppercase text-stone-700";
        if (isMediumDensity) return "text-sm sm:text-base font-black tracking-wider uppercase text-stone-700";
        return "text-2xl sm:text-3xl font-black tracking-widest uppercase text-stone-800";
      } else {
        if (isHighDensity) return "text-sm sm:text-base md:text-lg font-black tracking-wider uppercase text-stone-700";
        if (isMediumDensity) return "text-lg sm:text-xl md:text-2xl font-black tracking-wider uppercase text-stone-700";
        return "text-4xl sm:text-5xl md:text-6xl font-black tracking-widest uppercase text-stone-800";
      }
    } else if (len <= 5) {
      // "yama", "kaze", "yuki", etc.
      if (isMobile) {
        if (isHighDensity) return "text-[9px] sm:text-[10px] font-bold leading-tight text-stone-700";
        if (isMediumDensity) return "text-[11px] sm:text-xs font-bold leading-tight text-stone-700";
        return "text-base sm:text-lg md:text-xl font-bold leading-tight text-stone-800 italic";
      } else {
        if (isHighDensity) return "text-xs sm:text-sm md:text-base font-bold text-stone-700";
        if (isMediumDensity) return "text-sm sm:text-base md:text-lg font-bold text-stone-700";
        return "text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 italic";
      }
    } else {
      // Long romaji or phrases
      if (isMobile) {
        if (isHighDensity) return "text-[8px] sm:text-[9px] font-semibold tracking-tighter leading-none text-stone-605";
        if (isMediumDensity) return "text-[9px] sm:text-[11px] font-semibold tracking-tighter leading-none text-stone-605";
        return "text-xs sm:text-sm md:text-base font-semibold tracking-tight text-stone-700 leading-tight";
      } else {
        if (isHighDensity) return "text-xs sm:text-sm font-semibold tracking-tighter text-stone-605";
        if (isMediumDensity) return "text-xs sm:text-sm md:text-base font-semibold tracking-tighter text-stone-605";
        return "text-base sm:text-lg md:text-xl font-semibold tracking-tight text-stone-700";
      }
    }
  }
};

export default function MatchingGame({ activeCharPool, characterSet }: Properties) {
  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem("matching_game_player_level");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [mismatchIds, setMismatchIds] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameFailed, setGameFailed] = useState(false);
  
  // Timer states (Countdown remaining)
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Unlocked maximum level completed
  const [maxClearedLevel, setMaxClearedLevel] = useState<number>(() => {
    const saved = localStorage.getItem("matching_game_max_cleared");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Helper to start the game directly with a specific level parameter
  const initGameWithLevel = (currentLvl: number) => {
    const config = getLevelConfig(currentLvl);
    const fallbackPool = characterSet === "katakana" ? ALL_KATAKANA : ALL_HIRAGANA;
    
    stopTimer();
    setGameWon(false);
    setGameFailed(false);
    setSelectedTileId(null);
    setMismatchIds([]);

    const newTiles: Tile[] = [];

    if (config.mode === "char") {
      // Pick unique characters
      const poolCopy = activeCharPool.length >= config.pairCount ? [...activeCharPool] : [...fallbackPool];
      const picked: HiraganaChar[] = [];
      const limit = Math.min(config.pairCount, poolCopy.length);

      for (let i = 0; i < limit; i++) {
        const randIdx = Math.floor(Math.random() * poolCopy.length);
        picked.push(poolCopy.splice(randIdx, 1)[0]);
      }

      picked.forEach((char, idx) => {
        newTiles.push({
          id: `h-${idx}-${char.romaji}`,
          value: char.hiragana,
          type: "hiragana",
          matchKey: char.romaji,
          isCleared: false,
        });
        newTiles.push({
          id: `r-${idx}-${char.romaji}`,
          value: char.romaji,
          type: "romaji",
          matchKey: char.romaji,
          isCleared: false,
        });
      });
    } else if (config.mode === "vocab") {
      const vocabCopy = [...JAPANESE_VOCABULARY];
      const picked: typeof JAPANESE_VOCABULARY = [];
      const limit = Math.min(config.pairCount, vocabCopy.length);

      for (let i = 0; i < limit; i++) {
        const randIdx = Math.floor(Math.random() * vocabCopy.length);
        picked.push(vocabCopy.splice(randIdx, 1)[0]);
      }

      picked.forEach((word, idx) => {
        newTiles.push({
          id: `v-j-${idx}-${word.romaji}`,
          value: word.japanese,
          type: "hiragana",
          matchKey: word.romaji,
          isCleared: false,
        });
        newTiles.push({
          id: `v-v-${idx}-${word.romaji}`,
          value: `${word.romaji} - ${word.vietnameseMeaning}`,
          type: "romaji",
          matchKey: word.romaji,
          isCleared: false,
        });
      });
    } else {
      // Mixed Mode
      const charsNeeded = Math.ceil(config.pairCount / 2);
      const vocabNeeded = config.pairCount - charsNeeded;

      // Pick chars
      const poolCopy = activeCharPool.length >= charsNeeded ? [...activeCharPool] : [...fallbackPool];
      const pickedChars: HiraganaChar[] = [];
      for (let i = 0; i < Math.min(charsNeeded, poolCopy.length); i++) {
        const randIdx = Math.floor(Math.random() * poolCopy.length);
        pickedChars.push(poolCopy.splice(randIdx, 1)[0]);
      }

      pickedChars.forEach((char, idx) => {
        newTiles.push({
          id: `h-m-${idx}-${char.romaji}`,
          value: char.hiragana,
          type: "hiragana",
          matchKey: char.romaji,
          isCleared: false,
        });
        newTiles.push({
          id: `r-m-${idx}-${char.romaji}`,
          value: char.romaji,
          type: "romaji",
          matchKey: char.romaji,
          isCleared: false,
        });
      });

      // Pick vocab
      const vocabCopy = [...JAPANESE_VOCABULARY];
      const pickedVocab: typeof JAPANESE_VOCABULARY = [];
      for (let i = 0; i < Math.min(vocabNeeded, vocabCopy.length); i++) {
        const randIdx = Math.floor(Math.random() * vocabCopy.length);
        pickedVocab.push(vocabCopy.splice(randIdx, 1)[0]);
      }

      pickedVocab.forEach((word, idx) => {
        newTiles.push({
          id: `v-j-m-${idx}-${word.romaji}`,
          value: word.japanese,
          type: "hiragana",
          matchKey: word.romaji,
          isCleared: false,
        });
        newTiles.push({
          id: `v-v-m-${idx}-${word.romaji}`,
          value: `${word.romaji} - ${word.vietnameseMeaning}`,
          type: "romaji",
          matchKey: word.romaji,
          isCleared: false,
        });
      });
    }

    const shuffledTiles = newTiles.sort(() => Math.random() - 0.5);
    setTiles(shuffledTiles);
    setGameStarted(true);
    
    // Set ticking countdown
    setSeconds(config.timeLimit);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          stopTimer();
          handleLoseGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Default initializer using current level state
  const initGame = () => {
    sounds.playClick();
    initGameWithLevel(level);
  };

  const handleTileClick = (clickedTile: Tile) => {
    if (clickedTile.isCleared || mismatchIds.length > 0) return;

    sounds.playClick();

    // Trigger TTS if selecting a Japanese Hiragana tile
    if (clickedTile.type === "hiragana") {
      speakJapanese(clickedTile.value);
    }

    // Case 1: First tile selection
    if (selectedTileId === null) {
      setSelectedTileId(clickedTile.id);
      return;
    }

    // Clicked the exact same tile again: do nothing
    if (selectedTileId === clickedTile.id) {
      return;
    }

    // Case 2: Matching with the previously selected tile
    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) return;

    // Verify compatibility
    const isSamePair = firstTile.matchKey === clickedTile.matchKey;
    const isDifferentType = firstTile.type !== clickedTile.type;

    if (isSamePair && isDifferentType) {
      // Correct Match!
      sounds.playSuccess();
      setTiles((prev) =>
        prev.map((tile) =>
          tile.matchKey === clickedTile.matchKey ? { ...tile, isCleared: true } : tile
        )
      );
      setSelectedTileId(null);

      // Verify Win Condition
      setTimeout(() => {
        setTiles((currentTiles) => {
          const allCleared = currentTiles.every((t) => t.isCleared);
          if (allCleared) {
            handleWinGame();
          }
          return currentTiles;
        });
      }, 300);
    } else {
      // Incorrect Match
      sounds.playFailure();
      setMismatchIds([firstTile.id, clickedTile.id]);
      setSelectedTileId(null);

      // Flashing timeout delay
      setTimeout(() => {
        setMismatchIds([]);
      }, 1000);
    }
  };

  const handleWinGame = () => {
    stopTimer();
    sounds.playSuccess();
    setGameWon(true);

    // Save max unlocked level
    if (level > maxClearedLevel) {
      localStorage.setItem("matching_game_max_cleared", level.toString());
      setMaxClearedLevel(level);
    }
  };

  const handleLoseGame = () => {
    stopTimer();
    sounds.playFailure();
    setGameFailed(true);
  };

  const handleNextLevel = () => {
    sounds.playClick();
    const nextLvl = level + 1;
    setLevel(nextLvl);
    localStorage.setItem("matching_game_player_level", nextLvl.toString());
    
    // Slight timeout delay to let the state register
    setTimeout(() => {
      initGameWithLevel(nextLvl);
    }, 120);
  };

  const handleResetLevel = () => {
    sounds.playClick();
    setLevel(1);
    setMaxClearedLevel(0);
    localStorage.setItem("matching_game_player_level", "1");
    localStorage.setItem("matching_game_max_cleared", "0");
    setGameStarted(false);
    setGameWon(false);
    setGameFailed(false);
  };

  const activeConfig = getLevelConfig(level);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HUD Info bar */}
      <div className="bg-white rounded-2xl border border-stone-150 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        
        {/* Challenge level badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Zap className="w-5 h-5 fill-rose-50 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-widest">Cấp độc hiện tại</span>
            <span className="text-sm font-black text-rose-600 font-sans uppercase">CẤP ĐỘ {level}</span>
          </div>
        </div>

        {/* Dynamic Countdown */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-widest">Thời gian còn lại</span>
            <span className={`text-sm font-black font-mono ${gameStarted && !gameWon && !gameFailed && seconds <= 5 ? "text-red-650 animate-ping" : "text-stone-850"}`}>
              {gameStarted && !gameWon && !gameFailed ? `${seconds} giây` : activeConfig.timeLimit + " giây"}
            </span>
          </div>
        </div>

        {/* Max progress level stats */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Trophy className="w-5 h-5 fill-emerald-50" />
          </div>
          <div>
            <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-widest">Kỷ lục vượt ải</span>
            <span className="text-sm font-black text-emerald-600 font-sans">
              {maxClearedLevel > 0 ? `ẢI CẤP ${maxClearedLevel}` : "CHƯA VƯỢT"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {maxClearedLevel > 0 && (
            <button
              id="btn-level-reset-records"
              onClick={handleResetLevel}
              className="px-2.5 py-1.5 border border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50 text-2xs font-bold font-sans transition-all rounded-lg"
              title="Khởi tạo lại toàn bộ hành trình"
            >
              Reset Level
            </button>
          )}

          <button
            id="btn-match-start-action"
            onClick={initGame}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl tracking-wide transition-all active:scale-98 shadow-sm cursor-pointer uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {(gameWon || gameFailed) ? "Luyện Lại Ván" : gameStarted ? "Chơi ván mới" : "Khai cuộc ghép"}
          </button>
        </div>
      </div>

      {/* Main Board view */}
      {!gameStarted ? (
        <div className="bg-white rounded-3xl border border-stone-150 p-10 md:p-14 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="inline-block p-4 rounded-3xl bg-rose-50 text-rose-600 scale-110 animate-float border border-rose-100">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-850 tracking-tight">Thử Thách Ghép Đôi Phản Xạ Ải</h2>
            <p className="text-xs text-rose-500 font-bold font-mono uppercase bg-rose-50 w-fit mx-auto px-3.5 py-1 rounded-full border border-rose-100/50">
              {activeConfig.description}
            </p>
            <p className="text-xs text-stone-450 mt-2 max-w-md mx-auto leading-relaxed">
              Vượt qua từng cấp độ phản xạ từ thấp đến cao. Độ phức tạp tăng vút dựa trên hỗn hợp Hiragana, nghĩa tiếng Việt, sái số lùi, bộ đếm ngược và số lượng lá bài!
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 text-left text-xs text-stone-650 space-y-1.5 max-w-sm mx-auto shadow-2xs">
            <span className="block text-[10px] text-stone-400 font-black uppercase tracking-wider mb-1">Cấu hình cấp hiện tại ({level}):</span>
            <p>• ⏱️ Thời gian dợt: <strong className="text-rose-500 font-mono">{activeConfig.timeLimit} giây đếm ngược</strong></p>
            <p>• 🃏 Số cặp thẻ ghép: <strong className="text-stone-850 font-mono">{activeConfig.pairCount} cặp ({activeConfig.pairCount * 2} lá bài)</strong></p>
            <p>• 🧩 Thể thức test: <strong className="text-stone-850">{activeConfig.mode === "char" ? "Kí tự Hiragana đại cương" : activeConfig.mode === "vocab" ? "Từ vựng bản xứ siêu hạt nhân" : "Hỗn hợp xáo trộn cực đại"}</strong></p>
          </div>

          <button
            id="btn-match-start-large"
            onClick={initGame}
            className="px-8 py-3.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs tracking-widest uppercase rounded-2xl shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            BẮT ĐẦU CHINH PHỤC CẤP {level} 🚀
          </button>
        </div>
      ) : gameWon ? (
        <div className="bg-emerald-50/40 border border-emerald-150 rounded-3xl p-10 md:p-14 text-center max-w-2xl mx-auto shadow-xs space-y-6">
          <div className="inline-block p-4 bg-emerald-100 text-emerald-600 rounded-3xl border border-emerald-200 animate-float scale-110">
            <Trophy className="w-10 h-10 fill-emerald-100" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-emerald-800 tracking-tight">Chiến Thắng Cấp Độ {level}! 🎉</h2>
            <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
              Không gì ngăn cản được con mắt nhạ bén tinh tường của bạn! Bạn đã dọn sạch toàn bộ <strong className="text-emerald-600">{activeConfig.pairCount} cặp thẻ</strong> ghép cặp phản xạ trong thời gian quy chuẩn!
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              id="btn-match-congrats-restart"
              onClick={initGame}
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Luyện Lại Ván Này
            </button>
            <button
              id="btn-match-congrats-next-level"
              onClick={handleNextLevel}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-550 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-103 flex items-center gap-1 cursor-pointer"
            >
              BƯỚC SANG CẤP ĐỘ {level + 1} 🏅
            </button>
          </div>
        </div>
      ) : gameFailed ? (
        <div className="bg-rose-50/40 border border-rose-150 rounded-3xl p-10 md:p-14 text-center max-w-2xl mx-auto shadow-xs space-y-6">
          <div className="inline-block p-4 bg-rose-100 text-rose-600 rounded-3xl border border-rose-200 animate-pulse scale-110">
            <HeartCrack className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-800 tracking-tight">Ồ Không, Hết Giờ Rồi! 🥺</h2>
            <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
              Bạn đã không kịp dọn sạch các cặp ghép đôi trước khi đồng hồ đếm ngược chạm mức 0 ở <strong className="text-rose-500 font-sans">Cấp độ {level}</strong>. Thử lại ván chơi ở cấp độ hiện tại để phục thù và mở khóa sang ải mới nhé!
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              id="btn-match-fail-retry"
              onClick={initGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-103 cursor-pointer"
            >
              THỬ LẠI CẤP ĐỘ {level} 🔄
            </button>
          </div>
        </div>
      ) : (
        /* The Card Matrix Grid based on level layout scale */
        (() => {
          const { cols, rows } = getGridDimensions(tiles.length, isMobile);
          const sizing = getTileSizing(tiles.length, isMobile);
          return (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center bg-stone-50 border border-stone-200/60 rounded-xl px-4 py-2 text-stone-550 text-xs">
                <span>🔥 Thể Thức: <strong className="text-stone-800">{activeConfig.mode === "char" ? "Chữ đại" : activeConfig.mode === "vocab" ? "Từ vựng" : "Hỗn hợp"}</strong></span>
                <span>🧩 Ma Trận: <strong className="text-stone-800">{activeConfig.pairCount * 2} quân bài</strong></span>
              </div>

              {/* Fixed Height Game Frame to keep everything fit in one screen view without page scrolling */}
              <div className="bg-stone-50/40 border border-stone-200/60 rounded-3xl p-2.5 sm:p-4 h-[calc(100vh-290px)] min-h-[385px] max-h-[580px] w-full flex items-center justify-center shadow-inner overflow-hidden">
                <div 
                  className="grid w-full h-full"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    gap: tiles.length > 32 ? "5px" : tiles.length > 16 ? "8px" : "12px"
                  }}
                >
                  {tiles.map((tile) => {
                    const isSelected = selectedTileId === tile.id;
                    const isMismatch = mismatchIds.includes(tile.id);
                    const isCleared = tile.isCleared;

                    let cardStyles = "bg-white border-stone-150 hover:border-stone-300 text-stone-850 cursor-pointer shadow-3xs transition-all";
                    
                    if (isCleared) {
                      cardStyles = "bg-emerald-50/50 border-emerald-100 text-emerald-400 opacity-25 cursor-default pointer-events-none scale-95 shadow-inner";
                    } else if (isSelected) {
                      cardStyles = "bg-rose-50 border-rose-400 ring-2 ring-rose-500/25 text-rose-600 font-bold scale-[1.015]";
                    } else if (isMismatch) {
                      cardStyles = "bg-rose-105 border-rose-400 text-rose-700 animate-pulse scale-98";
                    } else {
                      cardStyles += " hover:bg-stone-50 active:scale-98";
                    }

                    const isVocabSplit = tile.type === "romaji" && tile.value.includes(" - ");

                    return (
                      <div
                        id={`match-tile-${tile.id}`}
                        key={tile.id}
                        onClick={() => handleTileClick(tile)}
                        className={`flex flex-col items-center justify-center ${sizing.paddings} rounded-xl sm:rounded-2xl border-2 transition-all select-none text-center w-full h-full min-h-0 min-w-0 ${cardStyles}`}
                      >
                        {isVocabSplit ? (
                          (() => {
                            const romajiPart = tile.value.split(" - ")[0];
                            const meaningPart = tile.value.split(" - ")[1];
                            
                            // Dynamically determine romaji part text size using our helper
                            const romajiSizeClass = getDynamicTextClass(romajiPart, "romaji", tiles.length, isMobile);
                            
                            let meaningSizeClass = "text-[9.5px] sm:text-xs";
                            if (tiles.length > 24) {
                              meaningSizeClass = "text-[7.5px] sm:text-[9.5px]";
                            } else if (meaningPart.length > 12) {
                              meaningSizeClass = "text-[8.5px] sm:text-[10.5px]";
                            }

                            return (
                              <div className="flex flex-col items-center justify-center leading-tight select-none w-full max-w-full px-1">
                                <span 
                                  className={`block font-extrabold leading-tight w-full whitespace-normal break-words ${romajiSizeClass}`}
                                >
                                  {romajiPart}
                                </span>
                                {tiles.length <= 48 && (
                                  <span 
                                    className={`block text-stone-500 font-medium whitespace-normal line-clamp-2 leading-tight w-full mt-0.5 ${meaningSizeClass}`}
                                  >
                                    {meaningPart}
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span
                            className={`block tracking-normal select-none leading-normal w-full whitespace-normal break-words ${
                              tile.type === "hiragana"
                                ? `font-serif-jp ${getDynamicTextClass(tile.value, "hiragana", tiles.length, isMobile)}`
                                : `font-sans ${getDynamicTextClass(tile.value, "romaji", tiles.length, isMobile)} px-0.5`
                            }`}
                          >
                            {tile.value}
                          </span>
                        )}
                        
                        {!isCleared && sizing.showLabels && !isVocabSplit && (
                          <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-1 hidden sm:block">
                            {tile.type === "hiragana" ? "Hiragana" : "Romaji"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
