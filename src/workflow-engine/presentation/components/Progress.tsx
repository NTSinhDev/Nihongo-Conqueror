import React from "react";
import { usePipeline, usePipelineProgress, useDraft } from "../lessonBuilderContext";
import { 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  Loader2, 
  RotateCcw,
  Sparkles,
  AlertOctagon,
  ChevronRight
} from "lucide-react";
import { PipelineState } from "../../domain/types";

export function Progress() {
  const { completed, total, percentage } = usePipelineProgress();
  const { 
    status, 
    isStarting, 
    isPausing, 
    isResuming, 
    isCanceling, 
    isPipelineRunning, 
    isPipelinePaused, 
    isPipelineCompleted,
    canResume,
    canRetry,
    startPipeline,
    pausePipeline,
    resumePipeline,
    cancelPipeline
  } = usePipeline();
  
  const { currentDraft } = useDraft();

  if (!currentDraft) return null;

  // Render status badge helper
  const renderStatusBadge = () => {
    switch (status) {
      case PipelineState.COMPLETED:
        return (
          <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
        );
      case PipelineState.RUNNING:
        return (
          <span className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-extrabold rounded-lg flex items-center gap-1 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang biên dịch
          </span>
        );
      case PipelineState.PAUSED:
        return (
          <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold rounded-lg flex items-center gap-1">
            <Pause className="w-3.5 h-3.5" />
            Tạm dừng
          </span>
        );
      case PipelineState.FAILED:
        return (
          <span className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-extrabold rounded-lg flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Gặp lỗi phát sinh
          </span>
        );
      case PipelineState.CANCELLED:
        return (
          <span className="px-2 py-1 bg-stone-100 border border-stone-250 text-stone-600 text-xs font-extrabold rounded-lg flex items-center gap-1">
            <X className="w-3.5 h-3.5" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-stone-50 border border-stone-200 text-stone-500 text-xs font-extrabold rounded-lg flex items-center gap-1">
            Nháp (Draft)
          </span>
        );
    }
  };

  return (
    <div id="pipeline-progress-container" className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-4">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Trạng thái Biên soạn AI</h4>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-sm font-extrabold text-stone-800">
              Bài {currentDraft.context.metadata.lessonId}: {currentDraft.context.metadata.titleVi}
            </h3>
            {renderStatusBadge()}
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {status === PipelineState.DRAFT && (
            <button
              id="btn-start-pipeline"
              onClick={startPipeline}
              disabled={isStarting}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-200 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Bắt đầu Biên dịch AI</span>
            </button>
          )}

          {isPipelineRunning && (
            <button
              id="btn-pause-pipeline"
              onClick={pausePipeline}
              disabled={isPausing}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              {isPausing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5 fill-white" />}
              <span>Tạm dừng</span>
            </button>
          )}

          {canResume && (
            <button
              id="btn-resume-pipeline"
              onClick={resumePipeline}
              disabled={isResuming}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              {isResuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Tiếp tục</span>
            </button>
          )}

          {isPipelineRunning && (
            <button
              id="btn-cancel-pipeline"
              onClick={cancelPipeline}
              disabled={isCanceling}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
            >
              {isCanceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              <span>Hủy quy trình</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress slider / bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-stone-500">Tiến độ biên dịch:</span>
          <span className="text-rose-600">{percentage}% ({completed}/{total} bước)</span>
        </div>

        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200/40">
          <div 
            className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-500 relative"
            style={{ width: `${percentage}%` }}
          >
            {isPipelineRunning && (
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/25 animate-[pulse_1s_infinite]"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
