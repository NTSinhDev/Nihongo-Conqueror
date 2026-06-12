import React, { useState, useEffect } from "react";
import { HiraganaChar, ALL_HIRAGANA } from "../data/hiragana";
import { speakJapanese, sounds } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  Check,
  Search,
  BookOpen,
} from "lucide-react";

interface Properties {
  activeCharPool: HiraganaChar[];
}

interface CharacterMasteryState {
  char: HiraganaChar;
  streak: number; // 0 to 5
}

export default function MasteryTestMode({ activeCharPool }: Properties) {
  // Mastery states for each chosen character
  const [masteryStates, setMasteryStates] = useState<CharacterMasteryState[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CharacterMasteryState | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  
  // Overall game statistics
  const [totalClicks, setTotalClicks] = useState(0);
  const [isTestFinished, setIsTestFinished] = useState(false);

  // Initialize mastery states when pool changes
  useEffect(() => {
    initTest();
  }, [activeCharPool]);

  const initTest = () => {
    if (activeCharPool.length === 0) {
      setMasteryStates([]);
      setCurrentQuestion(null);
      setIsTestFinished(false);
      return;
    }

    const initialStates: CharacterMasteryState[] = activeCharPool.map((char) => ({
      char,
      streak: 0,
    }));

    setMasteryStates(initialStates);
    setIsTestFinished(false);
    setTotalClicks(0);
    setSelectedAnswer(null);
    setHasAnswered(false);

    // Spawn first question based on these initial states
    spawnQuestion(initialStates);
  };

  const spawnQuestion = (currentStates: CharacterMasteryState[]) => {
    // Filter out characters that have already reached 5 streak ticks
    const remaining = currentStates.filter((state) => state.streak < 5);

    if (remaining.length === 0) {
      setIsTestFinished(true);
      setCurrentQuestion(null);
      sounds.playSuccess();
      return;
    }

    // Pick a random char from the remaining ones
    const randomTarget = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrentQuestion(randomTarget);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setIsCorrect(false);
    setFeedbackMsg("");

    // Generate 4 multiple choices (including correct answer)
    const uniqueOptions = new Set<string>();
    uniqueOptions.add(randomTarget.char.romaji);

    // Candidates can be from overall list to avoid duplicates / lack of choices
    const candidates = activeCharPool.length >= 4 ? activeCharPool : ALL_HIRAGANA;

    while (uniqueOptions.size < Math.min(4, candidates.length)) {
      const distractor = candidates[Math.floor(Math.random() * candidates.length)];
      uniqueOptions.add(distractor.romaji);
    }

    // Shuffle
    setChoices(Array.from(uniqueOptions).sort(() => Math.random() - 0.5));

    // Pronounce the target character automatically
    speakJapanese(randomTarget.char.hiragana);
  };

  const handleAnswerSubmit = (chosenRomaji: string) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(chosenRomaji);
    setHasAnswered(true);
    setTotalClicks((prev) => prev + 1);

    const correct = chosenRomaji === currentQuestion.char.romaji;
    setIsCorrect(correct);

    // Update mastery states matching current criteria
    const updatedStates = masteryStates.map((state) => {
      if (state.char.hiragana === currentQuestion.char.hiragana) {
        if (correct) {
          const nextStreak = state.streak + 1;
          return { ...state, streak: nextStreak };
        } else {
          // If incorrect, reset streak of THAT character to 0!
          return { ...state, streak: 0 };
        }
      }
      return state;
    });

    setMasteryStates(updatedStates);

    if (correct) {
      sounds.playSuccess();
      const currentSuccessCount = currentQuestion.streak + 1;
      
      if (currentSuccessCount >= 5) {
        setFeedbackMsg(`Xuất sắc! 🎉 Bạn đã thành thạo hoàn toàn chữ '${currentQuestion.char.hiragana}'!`);
      } else {
        setFeedbackMsg(`Chính xác! Chuỗi đúng hiện tại: ${currentSuccessCount}/5`);
      }

      // Auto advance to next question on correct selection
      const timer = setTimeout(() => {
        spawnQuestion(updatedStates);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      sounds.playFailure();
      setFeedbackMsg(`Sai mất rồi! Chuỗi đúng của chữ '${currentQuestion.char.hiragana}' đã bị reset về 0.`);
    }
  };

  const skipToNext = () => {
    sounds.playClick();
    spawnQuestion(masteryStates);
  };

  if (activeCharPool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs max-w-lg mx-auto">
        <span className="text-4xl mb-4">📝</span>
        <h3 className="text-lg font-semibold text-stone-800">Không có ký tự để ôn thi</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-sm">
          Vui lòng cuộn xuống bên dưới tích chọn ít nhất một hàng ký tự (như Hàng A, Hàng Ka...) để tạo danh sách ôn thi trắc nghiệm!
        </p>
      </div>
    );
  }

  // Count metrics
  const totalChars = masteryStates.length;
  const passedCharsCount = masteryStates.filter((s) => s.streak >= 5).count ?? masteryStates.filter((s) => s.streak >= 5).length;
  const progressPercent = totalChars > 0 ? Math.round((passedCharsCount / totalChars) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Test Finishes Screen */}
      <AnimatePresence mode="wait">
        {isTestFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-50 border border-emerald-150 rounded-2xl p-8 md:p-12 text-center shadow-lg max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
              <Trophy className="w-9 h-9 fill-emerald-100" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-stone-850 tracking-tight">
              Tuyệt Vời! Đã Hoàn Thành Toàn Bộ Bài Test! 🏆
            </h2>
            <p className="text-sm text-stone-600 mt-3 max-w-lg mx-auto leading-relaxed">
              Bạn đã thành công trả lời đúng liên tiếp <strong className="text-emerald-700">5 lần ròng rã</strong> cho từng chữ cái trong nhóm **{totalChars}** ký tự đã lọc! Mặt chữ đã in sâu vào phản xạ não bộ của bạn.
            </p>

            <div className="my-8 bg-white border border-emerald-150 p-6 rounded-xl max-w-md mx-auto grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-stone-400 font-semibold uppercase">Số chữ đạt chuẩn</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">{passedCharsCount} / {totalChars}</span>
              </div>
              <div>
                <span className="block text-xs text-stone-400 font-semibold uppercase">Tổng lượt nhấp</span>
                <span className="text-2xl font-bold font-mono text-stone-700">{totalClicks} lần</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                id="btn-restart-mastery-test"
                onClick={initTest}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-wide rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Làm Bài Kiểm Tra Mới
              </button>
            </div>
          </motion.div>
        ) : (
          /* Actual Quiz Section */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Active Spaced Question Panel */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-150 p-6 md:p-8 shadow-xs relative">
                
                {/* HUD Header */}
                <div className="flex justify-between items-center text-xs mb-6 pb-4 border-b border-stone-100">
                  <span className="flex items-center gap-1.5 font-bold text-rose-500 uppercase tracking-widest text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" /> Thử Thách Đạt Điểm 5 Chuỗi Đúng
                  </span>
                  
                  <button
                    id="btn-speak-mastery-char"
                    onClick={() => currentQuestion && speakJapanese(currentQuestion.char.hiragana)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Phát âm
                  </button>
                </div>

                {/* Character visual display */}
                {currentQuestion ? (
                  <div className="text-center py-10 bg-stone-50 border border-stone-100 rounded-2xl mb-8 relative group">
                    <span className="font-serif-jp text-9xl font-black text-stone-850 block select-all transition-all duration-300 transform group-hover:scale-105">
                      {currentQuestion.char.hiragana}
                    </span>

                    {/* Streak indicator on character */}
                    <div className="mt-4 flex justify-center items-center gap-1.5">
                      <span className="text-[11px] text-stone-400 font-medium mr-1.5">Tiến trình chữ này:</span>
                      {[...Array(5)].map((_, tickIdx) => {
                        const activeTick = tickIdx < currentQuestion.streak;
                        return (
                          <span
                            id={`streak-tick-${currentQuestion.char.hiragana}-${tickIdx}`}
                            key={tickIdx}
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                              activeTick
                                ? "bg-rose-500 text-white scale-110"
                                : "bg-stone-200 text-stone-400"
                            }`}
                          >
                            {tickIdx + 1}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-stone-400">Đang chuẩn bị câu hỏi...</div>
                )}

                {/* Question Prompt */}
                <div className="text-center text-xs text-stone-400 font-semibold mb-4 tracking-wider uppercase">
                  Chọn cách đọc phiên âm hệ Romaji:
                </div>

                {/* Answer choice grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  {choices.map((choice) => {
                    if (!currentQuestion) return null;
                    const isSelected = selectedAnswer === choice;
                    const isCorrectAnswer = choice === currentQuestion.char.romaji;

                    let btnStyles = "bg-white border-stone-200/85 hover:border-stone-400 hover:bg-stone-50 text-stone-800";
                    let prefixIcon = null;

                    if (hasAnswered) {
                      if (isCorrectAnswer) {
                        btnStyles = "bg-green-50 border-green-300 text-green-700 font-bold scale-102";
                        prefixIcon = <Check className="w-4 h-4 stroke-[3px] text-green-600" />;
                      } else if (isSelected) {
                        btnStyles = "bg-rose-50 border-rose-300 text-rose-700 font-bold";
                        prefixIcon = <XCircle className="w-4 h-4 text-rose-600" />;
                      } else {
                        btnStyles = "bg-white/40 border-stone-100 text-stone-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        id={`mastery-choice-${choice}`}
                        key={choice}
                        onClick={() => handleAnswerSubmit(choice)}
                        disabled={hasAnswered}
                        className={`p-4 rounded-xl border-2 text-center text-lg font-mono font-bold lowercase transition-all flex items-center justify-center gap-2 ${btnStyles}`}
                      >
                        {prefixIcon}
                        <span>{choice}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Toast */}
                <AnimatePresence>
                  {feedbackMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-6 p-4 rounded-xl border text-xs text-center font-semibold leading-normal ${
                        isCorrect
                          ? "bg-green-50 border-green-150 text-green-700"
                          : "bg-rose-50 border-rose-150 text-rose-700"
                      }`}
                    >
                      {feedbackMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Skip or Next Controls */}
                {hasAnswered && !isCorrect && (
                  <div className="mt-6 flex justify-end">
                    <button
                      id="btn-mastery-next-question"
                      onClick={skipToNext}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      Tiếp tục thử lại chữ này
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Grid Dashboard Tracker of all letter streaks */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Mastery progress HUD */}
              <div className="bg-white rounded-2xl border border-stone-150 p-6 shadow-xs">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 border-b border-stone-100 pb-2">
                  Tiến Độ Học Tập
                </h3>

                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-2xl font-black text-stone-800 font-mono">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-stone-400 font-medium font-mono">
                    Đã thuộc: {passedCharsCount} / {totalChars} chữ
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden mb-5">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Đạt 5/5 = Đã thuộc
                  </span>
                  <button
                    id="btn-re-init-mastery"
                    onClick={initTest}
                    className="text-stone-400 hover:text-stone-600 text-[10px] font-bold underline cursor-pointer"
                  >
                    Reset Làm Lại Từ Đầu
                  </button>
                </div>
              </div>

              {/* Status List Grid */}
              <div className="bg-white rounded-2xl border border-stone-150 p-6 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Bảng Thống Kê Theo Từng Chữ
                  </h4>
                  <span className="text-[10px] bg-stone-50 text-stone-500 border border-stone-100 px-2 py-0.5 rounded">
                    Lọc: {masteryStates.length} chữ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {masteryStates.map((state) => {
                    const isPassed = state.streak >= 5;

                    return (
                      <div
                        id={`stat-card-${state.char.hiragana}`}
                        key={state.char.hiragana}
                        className={`p-2 rounded-lg border text-center flex items-center justify-between gap-2 transition-all ${
                          isPassed
                            ? "bg-emerald-50/40 border-emerald-150 text-emerald-800"
                            : "bg-stone-50/50 border-stone-150"
                        }`}
                      >
                        <div className="text-left font-serif-jp">
                          <span className="text-base font-bold block leading-tight text-stone-850">
                            {state.char.hiragana}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 lowercase block font-semibold leading-none">
                            {state.char.romaji}
                          </span>
                        </div>

                        {/* Streak Dots */}
                        <div className="flex flex-col items-end gap-0.5">
                          {isPassed ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                              Đạt ✔
                            </span>
                          ) : (
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, dotIdx) => (
                                <span
                                  key={dotIdx}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    dotIdx < state.streak ? "bg-rose-500" : "bg-stone-200"
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
      </AnimatePresence>
    </div>
  );
}
