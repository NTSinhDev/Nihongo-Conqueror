import React, { useState } from "react";
import { usePipeline, useDraft, useLessonActions } from "../lessonBuilderContext";
import { 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  PartyPopper,
  BookOpen,
  ArrowRight
} from "lucide-react";

export function PublishDialog() {
  const { isPublishing, canPublish, publishLesson } = usePipeline();
  const { currentDraft } = useDraft();
  const [published, setPublished] = useState(false);

  if (!currentDraft || !canPublish) return null;

  const handlePublish = async () => {
    try {
      await publishLesson();
      setPublished(true);
      setTimeout(() => {
        setPublished(false);
      }, 5000);
    } catch (err) {
      console.error("Failed to publish lesson:", err);
    }
  };

  return (
    <div id="publish-lesson-dialog" className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl space-y-4 shadow-sm animate-pulse-slow">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <PartyPopper className="w-5.5 h-5.5 text-emerald-600 animate-bounce" />
        </div>
        
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Biên dịch AI hoàn tất thành công!
          </h4>
          <p className="text-[11px] text-emerald-700 leading-relaxed font-semibold">
            Toàn bộ từ vựng, ngữ pháp, câu ví dụ và bài thi thử trắc nghiệm đã được đóng gói chuẩn chỉnh. Sẵn sàng tích hợp trực tiếp vào danh sách bài học chính thức.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-emerald-150 pt-4">
        <div className="text-[10px] text-emerald-600/80 font-bold flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Bài {currentDraft.context.metadata.lessonId} • Giáo trình cấp độ {currentDraft.context.metadata.level}</span>
        </div>

        {published ? (
          <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã xuất bản thành công!</span>
          </span>
        ) : (
          <button
            id="btn-publish-lesson"
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all scale-100 hover:scale-102 cursor-pointer"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <>
                <span>Xuất bản giáo trình</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
