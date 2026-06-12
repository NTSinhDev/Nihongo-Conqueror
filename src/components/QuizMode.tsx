import React, { useState, useEffect, useMemo } from "react";
import { HiraganaChar, ALL_HIRAGANA } from "../data/hiragana";
import { speakJapanese, sounds } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Flame,
  ThumbsUp,
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface Properties {
  activeCharPool: HiraganaChar[];
}

export default function QuizMode({ activeCharPool }: Properties) {
  const [questionChar, setQuestionChar] = useState<HiraganaChar | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // States
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(() => {
    const saved = localStorage.getItem("hiragana_highest_streak");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [autoAdvance, setAutoAdvance] = useState(true);

  // Save highest streak to localStorage
  useEffect(() => {
    localStorage.setItem("hiragana_highest_streak", highestStreak.toString());
  }, [highestStreak]);

  // Generate a brand new question whenever the active pool changes or a new round starts
  const spawnQuestion = () => {
    if (activeCharPool.length === 0) {
      setQuestionChar(null);
      return;
    }

    // Pick a random char from the pool
    const randomChar = activeCharPool[Math.floor(Math.random() * activeCharPool.length)];
    setQuestionChar(randomChar);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setIsCorrect(false);

    // Build choice candidates
    // Make sure we have 4 distinct options. If active pool is too small, inject from global pool.
    const uniqueOptions = new Set<string>();
    uniqueOptions.add(randomChar.romaji);

    // Filter candidate list to find distractor options
    const candidates = activeCharPool.length >= 4 ? activeCharPool : ALL_HIRAGANA;

    // Fill up choices up to 4
    while (uniqueOptions.size < 4) {
      const randomDistractor = candidates[Math.floor(Math.random() * candidates.length)];
      uniqueOptions.add(randomDistractor.romaji);
    }

    // Shuffle choices array
    const shuffledChoices = Array.from(uniqueOptions).sort(() => Math.random() - 0.5);
    setChoices(shuffledChoices);

    // Voice hint
    speakJapanese(randomChar.hiragana);
  };

  // Triggers once on start or pool switches
  useEffect(() => {
    spawnQuestion();
  }, [activeCharPool]);

  const handleChoiceClick = (choice: string) => {
    if (hasAnswered || !questionChar) return;

    setSelectedAnswer(choice);
    setHasAnswered(true);
    const correct = choice === questionChar.romaji;
    setIsCorrect(correct);
    setTotalAttempts((prev) => prev + 1);

    if (correct) {
      sounds.playSuccess();
      setCorrectAnswers((prev) => prev + 1);
      setCurrentStreak((prev) => {
        const next = prev + 1;
        if (next > highestStreak) setHighestStreak(next);
        return next;
      });

      // Auto advance
      if (autoAdvance) {
        const timer = setTimeout(() => {
          spawnQuestion();
        }, 1300);
        return () => clearTimeout(timer);
      }
    } else {
      sounds.playFailure();
      setCurrentStreak(0);
    }
  };

  const handleResetScores = () => {
    sounds.playClick();
    setTotalAttempts(0);
    setCorrectAnswers(0);
    setCurrentStreak(0);
    setHighestStreak(0);
    localStorage.removeItem("hiragana_highest_streak");
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    spawnQuestion();
  };

  // If pool is empty
  if (activeCharPool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs max-w-lg mx-auto">
        <span className="text-4xl mb-4">📝</span>
        <h3 className="text-lg font-semibold text-stone-800">Không có ký tự để kiểm tra</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-sm">
          Vui lòng cuộn xuống bên dưới để tích chọn tối thiểu một hàng chữ trong bảng để thiết lập đề thi!
        </p>
      </div>
    );
  }

  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Quiz Area (Main Card) */}
      <div className="md:col-span-8 flex flex-col items-center">
        {questionChar && (
          <div className="w-full bg-white rounded-2xl border border-stone-150 p-8 shadow-xs relative">
            {/* Header info */}
            <div className="flex justify-between items-center text-xs text-stone-400 mb-6">
              <span className="flex items-center gap-1 font-semibold text-stone-500">
                <HelpCircle className="w-3.5 h-3.5" /> TRẮC NGHIỆM PHẢN XẠ
              </span>
              <button
                id="btn-speak-question"
                onClick={() => speakJapanese(questionChar.hiragana)}
                className="text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium bg-rose-50 px-2 py-1 rounded"
              >
                <Volume2 className="w-3.5 h-3.5" /> Nghe lại âm
              </button>
            </div>

            {/* Character Viewbox */}
            <div className="text-center py-8 border-y-2 border-stone-50 bg-stone-50/50 rounded-xl mb-8 relative">
              <span className="font-serif-jp text-9xl font-black text-stone-800 tracking-normal block animate-float">
                {questionChar.hiragana}
              </span>
              <span className="text-xs text-stone-400 mt-4 block">Chọn cách phiên âm Romaji chính xác:</span>
            </div>

            {/* MCQ Quiz Choices Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {choices.map((choice) => {
                const isSelected = selectedAnswer === choice;
                const isCorrectChoice = choice === questionChar.romaji;
                
                let btnStyles = "bg-stone-50 border-stone-200/80 hover:bg-stone-100 text-stone-850";
                let iconElement = null;

                if (hasAnswered) {
                  if (isCorrectChoice) {
                    btnStyles = "bg-green-50 border-green-300 text-green-700 font-bold scale-102";
                    iconElement = <CheckCircle2 className="w-4 h-4 text-green-600" />;
                  } else if (isSelected) {
                    btnStyles = "bg-rose-50 border-rose-300 text-rose-700 font-bold";
                    iconElement = <XCircle className="w-4 h-4 text-rose-600" />;
                  } else {
                    btnStyles = "bg-stone-50/40 border-stone-100 text-stone-400 opacity-60";
                  }
                }

                return (
                  <button
                    id={`quiz-choice-${choice}`}
                    key={choice}
                    onClick={() => handleChoiceClick(choice)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-xl border-2 text-center text-lg font-mono font-bold lowercase transition-all flex items-center justify-center gap-2 ${btnStyles}`}
                  >
                    <span>{choice}</span>
                    {iconElement}
                  </button>
                );
              })}
            </div>

            {/* Action footer */}
            <div className="mt-8 flex justify-between items-center pt-5 border-t border-stone-100 flex-wrap gap-4">
              <label className="flex items-center gap-2 text-stone-500 text-xs cursor-pointer">
                <input
                  id="checkbox-quiz-auto"
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => {
                    sounds.playClick();
                    setAutoAdvance(e.target.checked);
                  }}
                  className="rounded border-stone-300 text-rose-500 focus:ring-rose-400"
                />
                <span>Tự động qua câu mới khi trả lời đúng</span>
              </label>

              {hasAnswered && (
                <button
                  id="btn-quiz-next"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white font-medium text-xs rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Câu tiếp theo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Sidebar */}
      <div className="md:col-span-4 space-y-6">
        {/* Score & Accuracy Card */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-stone-700 border-b border-stone-100 pb-3 mb-4">
            TIẾN TRÌNH LUYỆN TẬP
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>Số câu trả lời đúng</span>
                <span className="font-bold text-stone-800">
                  {correctAnswers}/{totalAttempts}
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                <span className="block text-[10px] text-stone-400 font-medium uppercase">tính chính xác</span>
                <span className="text-xl font-bold text-stone-750 font-mono">{accuracy}%</span>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                <span className="block text-[10px] text-stone-400 font-medium uppercase">tổng kiểm tra</span>
                <span className="text-xl font-bold text-stone-750 font-mono">{totalAttempts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak details */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xs relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>

          <h3 className="text-xs font-semibold text-stone-400 tracking-wide uppercase mb-4">
            Kỷ lục liên tiếp
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <Flame className="w-6 h-6 fill-orange-500/20" />
              </div>
              <div>
                <span className="block text-xs text-stone-400">Chuỗi đúng hiện tại</span>
                <strong className="text-2xl font-bold font-mono tracking-tight text-white block">
                  {currentStreak} <span className="text-xs font-medium text-amber-500">câu</span>
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-stone-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6 fill-amber-500/20" />
              </div>
              <div>
                <span className="block text-xs text-stone-400">Kỷ lục cao nhất (All-time)</span>
                <strong className="text-2xl font-bold font-mono tracking-tight text-white block">
                  {highestStreak} <span className="text-xs font-medium text-amber-400">câu</span>
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Reset stats button */}
        {(totalAttempts > 0 || highestStreak > 0) && (
          <button
            id="btn-quiz-score-reset"
            onClick={handleResetScores}
            className="w-full py-2.5 text-xs font-medium text-stone-400 hover:text-stone-750 bg-stone-100 hover:bg-stone-200/80 rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khởi động lại chỉ số thống kê
          </button>
        )}
      </div>
    </div>
  );
}
