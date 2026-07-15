import React from "react";
import { useStepStatus, usePipeline, useDraft } from "../lessonBuilderContext";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  HelpCircle, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Circle,
  Clock,
  Sparkles
} from "lucide-react";
import { StepState } from "../../domain/types";

interface StepMeta {
  id: string;
  name: string;
  desc: string;
}

const PIPELINE_STEPS_META: StepMeta[] = [
  { id: "validate-vocabulary", name: "1. Xác thực Từ vựng", desc: "Chuẩn hóa và làm sạch đầu vào danh sách từ vựng." },
  { id: "validate-grammar", name: "2. Xác thực Ngữ pháp", desc: "Kiểm tra cú pháp cấu trúc và nội dung mẫu ngữ pháp." },
  { id: "tokenize", name: "3. Tách từ & Chuyển âm", desc: "Tự động phân tách bộ Kanji, gán âm đọc Hiragana và Romaji." },
  { id: "generate-english", name: "4. Biên dịch Đa ngữ", desc: "Dịch nghĩa từ vựng & ngữ pháp sang tiếng Anh để hỗ trợ song ngữ." },
  { id: "generate-vocabulary-examples", name: "5. Câu mẫu Từ vựng", desc: "AI tạo các câu ví dụ tự nhiên kèm dịch nghĩa cho từng từ vựng." },
  { id: "generate-grammar-examples", name: "6. Câu mẫu Ngữ pháp", desc: "AI đặt câu ví dụ thực tế ứng dụng cấu trúc ngữ pháp vừa học." },
  { id: "generate-review", name: "7. Biên soạn Đề ôn tập", desc: "AI tạo bài trắc nghiệm nhanh (Quiz) tổng hợp kiến thức của bài." },
  { id: "save-lesson", name: "8. Đồng bộ & Lưu", desc: "Đóng gói toàn bộ giáo trình và lưu trực tiếp vào cơ sở dữ liệu học tập." },
];

export function Timeline() {
  const { getStepStatus, runningStep, failedSteps } = useStepStatus();
  const { currentDraft } = useDraft();
  const { retryStep, isRetrying, isPipelineRunning } = usePipeline();

  if (!currentDraft) return null;

  return (
    <div id="pipeline-timeline-container" className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <h4 className="text-xs font-extrabold text-stone-850 uppercase tracking-wider">
            Chi tiết tiến trình (8 Bước AI)
          </h4>
          <p className="text-[10px] text-stone-400">
            Xem trạng thái thời gian thực và lịch sử thử lại của từng tác vụ trong chuỗi.
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-stone-100 ml-3.5 pl-5.5 space-y-6">
        {PIPELINE_STEPS_META.map((step, idx) => {
          const statusObj = getStepStatus(step.id);
          const state = statusObj?.status || StepState.PENDING;
          const retryCount = statusObj?.retryCount || 0;
          const isCurrent = runningStep === step.id;
          const isFailed = state === StepState.FAILED;

          let Icon = Circle;
          let colorClass = "text-stone-300";
          let bgClass = "bg-stone-50 border-stone-200";

          if (state === StepState.SUCCESS) {
            Icon = CheckCircle2;
            colorClass = "text-emerald-500";
            bgClass = "bg-emerald-50 border-emerald-300";
          } else if (state === StepState.FAILED) {
            Icon = XCircle;
            colorClass = "text-rose-500";
            bgClass = "bg-rose-50 border-rose-300";
          } else if (isCurrent || state === StepState.RUNNING) {
            Icon = Loader2;
            colorClass = "text-rose-500 animate-spin";
            bgClass = "bg-rose-50 border-rose-300";
          } else if (state === StepState.CANCELLED || state === StepState.SKIPPED) {
            Icon = AlertTriangle;
            colorClass = "text-amber-500";
            bgClass = "bg-amber-50 border-amber-300";
          }

          return (
            <div key={step.id} className="relative group">
              {/* Bullet icon indicator */}
              <div className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${bgClass} z-10 shadow-3xs`}>
                <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
              </div>

              {/* Step info block */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-xs font-extrabold transition-all ${
                    isCurrent ? "text-rose-600 font-extrabold scale-[1.01]" : "text-stone-800"
                  }`}>
                    {step.name}
                  </h5>

                  {/* Badges / Retry actions */}
                  <div className="flex items-center gap-1.5">
                    {retryCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 text-[8px] font-bold rounded-md flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Thử lại: {retryCount} lần
                      </span>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => retryStep(step.id)}
                        disabled={isRetrying}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-extrabold rounded flex items-center gap-1 transition-all shadow-3xs"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Chạy lại bước này
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-stone-500 leading-normal max-w-xl">
                  {step.desc}
                </p>

                {/* Real-time Sub-context output if any */}
                {state === StepState.SUCCESS && (
                  <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50/20 px-2 py-0.5 rounded border border-emerald-100/30 w-fit">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Hoàn tất thành công</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
