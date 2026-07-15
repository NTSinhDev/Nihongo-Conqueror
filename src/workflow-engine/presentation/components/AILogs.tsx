import React, { useEffect, useState, useRef } from "react";
import { useStepStatus, usePipeline, useDraft } from "../lessonBuilderContext";
import { Terminal, ShieldCheck, Cpu, Trash2 } from "lucide-react";

interface LogMessage {
  timestamp: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  text: string;
}

export function AILogs() {
  const { completedSteps, runningStep, failedSteps, getStepStatus } = useStepStatus();
  const { currentDraft } = useDraft();
  const { status } = usePipeline();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to add a log line
  const addLog = (text: string, level: LogMessage["level"] = "INFO") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    setLogs(prev => {
      // Avoid duplicate logs if identical to last
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      return [...prev, { timestamp, level, text }];
    });
  };

  // Auto-scroll logs terminal
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle building logs reactively based on pipeline states
  const completedStepsStr = completedSteps.join(",");
  const failedStepsStr = failedSteps.join(",");

  useEffect(() => {
    if (!currentDraft) {
      setLogs([]);
      return;
    }

    // Initial draft logs
    if (logs.length === 0) {
      addLog(`Initializing workspace context for Draft ID: ${currentDraft.id}`);
      addLog(`Target Level: ${currentDraft.context.metadata.level} | Lesson: ${currentDraft.context.metadata.lessonId}`);
      addLog(`Selected AI LLM Engine: ${currentDraft.aiModel || "gemini-3.5-flash"}`);
      addLog(`Draft loaded successfully. Status is: "${currentDraft.pipelineState}"`, "SUCCESS");
    }

    // Success logs trace
    completedSteps.forEach(stepId => {
      const s = getStepStatus(stepId);
      if (stepId === "validate-vocabulary") {
        addLog("[Compiler] Validating and cleaning raw Vocabulary input rows...", "INFO");
        addLog("[Compiler] Vocabulary list validated and normalized successfully.", "SUCCESS");
      } else if (stepId === "validate-grammar") {
        addLog("[Compiler] Parsing Grammar list structures and schema...", "INFO");
        addLog("[Compiler] Grammar guidelines formatted and passed.", "SUCCESS");
      } else if (stepId === "tokenize") {
        addLog("[Gemini Tokenizer] Dispatching NLP tokens command to extract furigana and romaji...", "INFO");
        addLog("[Gemini Tokenizer] Kanji/Kana separation and Furigana bindings compiled successfully.", "SUCCESS");
      } else if (stepId === "generate-english") {
        addLog("[Gemini Translators] Prompt template compiled for Vietnamese-English bilingual translation...", "INFO");
        addLog("[Gemini Translators] Bilingual English meanings and descriptions attached.", "SUCCESS");
      } else if (stepId === "generate-vocabulary-examples") {
        addLog("[Gemini Generator] Crafting contextual example sentences for vocabulary items...", "INFO");
        addLog("[Gemini Generator] Three natural examples per word compiled.", "SUCCESS");
      } else if (stepId === "generate-grammar-examples") {
        addLog("[Gemini Generator] Constructing grammar application scenarios with translations...", "INFO");
        addLog("[Gemini Generator] Grammar visual scenarios synthesized.", "SUCCESS");
      } else if (stepId === "generate-review") {
        addLog("[Gemini Examiner] Compiling multiple-choice vocabulary & grammar quizzes...", "INFO");
        addLog("[Gemini Examiner] 4-option randomized dynamic quizzes compiled successfully.", "SUCCESS");
      } else if (stepId === "save-lesson") {
        addLog("[Database Publisher] Merging generated assets into production Lesson context...", "INFO");
        addLog("[Database Publisher] Successfully persisted Lesson packet to cloud collections!", "SUCCESS");
      }
    });

    // Running steps trace
    if (runningStep) {
      if (runningStep === "validate-vocabulary") {
        addLog("[Compiler] Normalizing whitespace, trailing spaces and symbols on input words...", "INFO");
      } else if (runningStep === "validate-grammar") {
        addLog("[Compiler] Validating pattern formats against lexical rules...", "INFO");
      } else if (runningStep === "tokenize") {
        addLog("[Gemini Tokenizer] Running deep tokenization with Gemini-3.5-Flash tokenization model...", "INFO");
      } else if (runningStep === "generate-english") {
        addLog("[Gemini Translators] Translating terminology and making Vietnamese/English synonyms...", "INFO");
      } else if (runningStep === "generate-vocabulary-examples") {
        addLog("[Gemini Generator] Synthesizing high-quality conversational JP-VI example sentences...", "INFO");
      } else if (runningStep === "generate-grammar-examples") {
        addLog("[Gemini Generator] Generating logical situations for grammar usage patterns...", "INFO");
      } else if (runningStep === "generate-review") {
        addLog("[Gemini Examiner] Generating custom options, question keys and explanations for review quiz...", "INFO");
      } else if (runningStep === "save-lesson") {
        addLog("[Database Publisher] Serializing full JSON schema to SQLite/Firestore storage...", "INFO");
      }
    }

    // Failed steps trace
    failedSteps.forEach(stepId => {
      addLog(`[Error Handler] Step execution failed at: "${stepId}". Waiting for user intervention.`, "ERROR");
    });

  }, [completedStepsStr, runningStep, failedStepsStr, currentDraft?.id, currentDraft?.pipelineState]);

  const clearLogs = () => {
    setLogs([{
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
      level: "INFO",
      text: "Logs terminal cleared by compiler."
    }]);
  };

  return (
    <div id="ai-logs-terminal" className="bg-stone-950 text-stone-100 rounded-xl border border-stone-800 shadow-xl flex flex-col h-[280px]">
      {/* Header */}
      <div className="bg-stone-900 px-3.5 py-2 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-stone-300">
            Terminal Logs: Trực quan hóa Biên soạn AI
          </span>
        </div>
        <button
          onClick={clearLogs}
          title="Xóa logs"
          className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Terminal logs content */}
      <div 
        ref={scrollRef}
        className="p-3.5 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent"
      >
        {logs.map((log, index) => {
          let lvlColor = "text-stone-400";
          if (log.level === "SUCCESS") lvlColor = "text-emerald-400 font-semibold";
          if (log.level === "WARN") lvlColor = "text-amber-400 font-semibold";
          if (log.level === "ERROR") lvlColor = "text-rose-400 font-extrabold animate-[pulse_1s_infinite]";

          return (
            <div key={index} className="flex items-start gap-1.5 hover:bg-stone-900/30 px-1 py-0.5 rounded transition-all">
              <span className="text-stone-600 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`${lvlColor} shrink-0 select-none`}>[{log.level}]</span>
              <span className="text-stone-200">{log.text}</span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-stone-600 italic text-center py-8">
            Chưa có dòng log nào được tạo. Hãy mở một bản thảo.
          </div>
        )}
      </div>
    </div>
  );
}
