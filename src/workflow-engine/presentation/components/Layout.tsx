import React from "react";
import { DraftManager } from "./DraftManager";
import { Editors } from "./Editors";
import { Timeline } from "./Timeline";
import { Progress } from "./Progress";
import { AILogs } from "./AILogs";
import { ErrorUI } from "./ErrorUI";
import { PublishDialog } from "./PublishDialog";
import { useDraft } from "../lessonBuilderContext";
import { Sparkles, X, BookOpen, Layers, Milestone } from "lucide-react";

interface LayoutProps {
  onClose?: () => void;
}

export function Layout({ onClose }: LayoutProps) {
  const { currentDraft } = useDraft();

  return (
    <div className="flex flex-col h-full bg-stone-100/50">
      {/* Upper Navigation Bar */}
      <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-rose-50 rounded-lg text-rose-600">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-sm font-extrabold text-stone-850 tracking-tight">
              Trợ lý Soạn Giáo Trình AI (Lesson Builder)
            </h2>
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
            Biên soạn và cấu hình chuỗi tự động hóa ngôn ngữ cấp cao bằng mô hình ngôn ngữ lớn Gemini.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Main Workspace split panel */}
      <div className="p-5 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* LEFT COLUMN: Controls & Progress */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-start">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-3xs space-y-4">
            <DraftManager />
          </div>

          {currentDraft ? (
            <>
              <Progress />
              <ErrorUI />
              <PublishDialog />
              <Timeline />
            </>
          ) : (
            <div className="bg-white border border-dashed border-stone-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-stone-400 gap-2 shadow-3xs">
              <Milestone className="w-8 h-8 text-stone-300 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-stone-600">Vui lòng chọn một bản thảo</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Chọn bản thảo từ danh mục phía trên hoặc tạo mới để xem tiến độ biên dịch 8 bước.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Realtime Data Review & Terminology Logs */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-start">
          {currentDraft ? (
            <>
              <Editors />
              <AILogs />
            </>
          ) : (
            <div className="bg-white border border-dashed border-stone-200 rounded-xl p-16 flex flex-col items-center justify-center text-center text-stone-400 gap-3 h-full shadow-3xs">
              <Layers className="w-10 h-10 text-stone-300" />
              <div>
                <p className="text-sm font-bold text-stone-600">Workspace Bộ Soạn thảo trống</p>
                <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Khi bạn bắt đầu hoặc mở một bản thảo giáo trình, bộ chỉnh sửa cấu trúc từ vựng / ngữ pháp và màn hình console của Gemini AI sẽ hiển thị tại đây.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
