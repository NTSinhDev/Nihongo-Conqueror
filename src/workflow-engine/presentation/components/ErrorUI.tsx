import React from "react";
import { usePipeline, useStepStatus, useLessonActions } from "../lessonBuilderContext";
import { AlertCircle, RotateCcw, X, AlertTriangle } from "lucide-react";

export function ErrorUI() {
  const { error, isRetrying, retryStep } = usePipeline();
  const { failedSteps } = useStepStatus();
  const { clearError } = useLessonActions();

  // If no global error and no failed steps, do not render
  if (!error && failedSteps.length === 0) return null;

  return (
    <div id="pipeline-error-alert-box" className="p-4 bg-rose-50 border border-rose-150 rounded-xl space-y-3 shadow-3xs animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
              Có sự cố phát sinh khi biên dịch AI
            </h4>
            <p className="text-[11px] text-rose-700 leading-relaxed font-semibold">
              {error?.message || "Hành động gặp sự cố kỹ thuật hoặc giới hạn lưu lượng (Quota Limit). Bạn có thể chạy lại bước lỗi."}
            </p>
          </div>
        </div>

        <button
          onClick={clearError}
          title="Đóng thông báo"
          className="p-1 hover:bg-rose-100 rounded-md text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {failedSteps.length > 0 && (
        <div className="border-t border-rose-100 pt-2.5 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
          <span className="text-rose-600 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Các bước gặp lỗi: {failedSteps.join(", ")}
          </span>

          <div className="flex gap-1.5">
            {failedSteps.map(stepId => (
              <button
                key={stepId}
                onClick={() => retryStep(stepId)}
                disabled={isRetrying}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white rounded-md text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Thử lại bước "{stepId}"</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
