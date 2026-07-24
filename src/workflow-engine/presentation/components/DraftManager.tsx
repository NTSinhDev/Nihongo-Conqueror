import React, { useState } from "react";
import { useDraftList, useDraft } from "../lessonBuilderContext";
import { 
  Plus, 
  Copy, 
  Trash2, 
  Archive, 
  FolderOpen, 
  Check, 
  Loader2, 
  AlertCircle, 
  FileText,
  Bookmark,
  Calendar,
  Layers,
  ArchiveRestore
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function DraftManager() {
  const { drafts, isLoading, isDeleting, isDuplicating, isArchiving, loadDrafts, deleteDraft, duplicateDraft, archiveDraft, error } = useDraftList();
  const { currentDraft, loadDraft } = useDraft();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createDraft } = useDraft();

  React.useEffect(() => {
    loadDrafts();
  }, []);

  // Create form states
  const [level, setLevel] = useState("N5");
  const [lessonId, setLessonId] = useState(1);
  const [titleVi, setTitleVi] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");

  // Easy initial vocab / grammar entries for creating draft
  const [rawVocab, setRawVocab] = useState("いぬ (inu) - con chó\nねこ (neko) - con mèo\nさくら (sakura) - hoa anh đào");
  const [rawGrammar, setRawGrammar] = useState("～は～です (~ wa ~ desu) - là...\n～は～ではありません (~ wa ~ de wa arimasen) - không phải là...");

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleVi.trim()) return;

    // Parse vocabs
    const vocabulary = rawVocab.split("\n").filter(line => line.trim()).map((line, i) => {
      const parts = line.split("-");
      const wordPart = parts[0]?.trim() || "";
      const meaningPart = parts[1]?.trim() || "";
      const match = wordPart.match(/^([^\(]+)(?:\((.*)\))?/);
      const hiragana = match ? match[1].trim() : wordPart;
      const romaji = match && match[2] ? match[2].trim() : "";
      
      return {
        id: `vocab-${Date.now()}-${i}`,
        hiragana,
        romaji,
        meaningVi: meaningPart || hiragana,
        examples: []
      };
    });

    // Parse grammar
    const grammar = rawGrammar.split("\n").filter(line => line.trim()).map((line, i) => {
      const parts = line.split("-");
      const patternPart = parts[0]?.trim() || "";
      const meaningPart = parts[1]?.trim() || "";
      const match = patternPart.match(/^([^\(]+)(?:\((.*)\))?/);
      const pattern = match ? match[1].trim() : patternPart;
      
      return {
        id: `grammar-${Date.now()}-${i}`,
        pattern,
        meaningVi: meaningPart || pattern,
        explanationVi: `Cấu trúc ngữ pháp ${pattern}`,
        examples: []
      };
    });

    try {
      await createDraft({
        metadata: {
          level,
          lessonId,
          titleVi
        },
        input: {
          vocabulary,
          grammar
        },
        aiModel: selectedModel
      });
      setShowCreateForm(false);
      // Reset form
      setTitleVi("");
    } catch (err) {
      console.error("Failed to create draft:", err);
    }
  };

  return (
    <div id="draft-manager-container" className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-rose-500" />
            <span>Quản lý Bản thảo (Drafts)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Tạo, sao chép hoặc tiếp tục soạn các bản thiết kế bài học AI.
          </p>
        </div>
        
        <button
          id="btn-open-create-draft"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all"
        >
          {showCreateForm ? (
            <span>Hủy</span>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo bản thảo mới</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error.message || "Đã xảy ra lỗi ngoài ý muốn."}</span>
        </div>
      )}

      {/* Create Draft Form Dropdown */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            onSubmit={handleCreateDraft}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Cấp độ</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="N5">N5 (Sơ cấp 1)</option>
                  <option value="N4">N4 (Sơ cấp 2)</option>
                  <option value="N3">N3 (Trung cấp)</option>
                  <option value="N2">N2 (Thượng trung cấp)</option>
                  <option value="N1">N1 (Cao cấp)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Số thứ tự bài</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={lessonId}
                  onChange={(e) => setLessonId(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Mô hình AI</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Nhanh & Tối ưu)</option>
                  <option value="gemini-3.5-pro">Gemini 3.5 Pro (Thông minh vượt trội)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Tiêu đề bài học (Việt hóa)</label>
              <input
                type="text"
                required
                value={titleVi}
                onChange={(e) => setTitleVi(e.target.value)}
                placeholder="Ví dụ: Bài học về chủ đề Thời tiết và Thiên nhiên"
                className="w-full bg-white border border-stone-250 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Danh sách Từ vựng (Mỗi dòng một từ)</label>
                  <span className="text-[9px] text-stone-400">Định dạng: Từ (Phiên âm) - Nghĩa</span>
                </div>
                <textarea
                  rows={4}
                  value={rawVocab}
                  onChange={(e) => setRawVocab(e.target.value)}
                  className="w-full border border-stone-250 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-rose-500 bg-white leading-relaxed font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Danh sách Ngữ pháp (Mỗi dòng một mẫu)</label>
                  <span className="text-[9px] text-stone-400">Định dạng: Mẫu (Giải thích) - Nghĩa</span>
                </div>
                <textarea
                  rows={4}
                  value={rawGrammar}
                  onChange={(e) => setRawGrammar(e.target.value)}
                  className="w-full border border-stone-250 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-rose-500 bg-white leading-relaxed font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-3xs transition-all"
              >
                Xác nhận tạo draft
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading state for drafts list */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          <span className="text-xs font-semibold">Đang tải danh sách bản thảo...</span>
        </div>
      ) : drafts.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 gap-2.5 bg-stone-50/50">
          <FolderOpen className="w-8 h-8 text-stone-300" />
          <div className="text-center">
            <p className="text-xs font-bold text-stone-600">Không tìm thấy bản thảo nào</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Nhấn "Tạo bản thảo mới" để bắt đầu chuẩn bị bài học của bạn.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
          {drafts.map((draft) => {
            const isSelected = currentDraft?.id === draft.id;
            const stepCount = Object.keys(draft.steps || {}).length;
            const completedCount = Object.values(draft.steps || {}).filter((s: any) => s.status === "SUCCESS" || s.status === "success").length;
            
            return (
              <div
                key={draft.id}
                id={`draft-card-${draft.id}`}
                className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between group relative ${
                  isSelected
                    ? "bg-rose-50/20 border-rose-500 ring-1 ring-rose-200/50 shadow-xs"
                    : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-stone-100 text-[10px] font-extrabold text-stone-600 rounded">
                      {draft.context.metadata.level}
                    </span>
                    <span className={`text-[10px] uppercase font-mono font-extrabold tracking-wider ${
                      draft.pipelineState === "completed"
                        ? "text-emerald-600"
                        : draft.pipelineState === "running"
                        ? "text-rose-600 animate-pulse"
                        : draft.pipelineState === "failed"
                        ? "text-rose-500"
                        : "text-stone-400"
                    }`}>
                      {draft.pipelineState}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-stone-800 line-clamp-1">
                    Bài {draft.context.metadata.lessonId}: {draft.context.metadata.titleVi}
                  </h4>

                  <p className="text-[10px] text-stone-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-stone-400" />
                    <span>{draft.context.input.vocabulary.length} Từ vựng • {draft.context.input.grammar.length} Ngữ pháp</span>
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-stone-400 pt-1">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-stone-300" />
                      {new Date(draft.updatedAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="font-semibold text-stone-600">
                      Tiến độ: {completedCount}/{stepCount || 8} bước
                    </span>
                  </div>
                </div>

                {/* Card Actions Overlay on Hover */}
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 justify-end">
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1 transition-all ${
                      isSelected 
                        ? "bg-rose-600 text-white shadow-3xs" 
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <FolderOpen className="w-3 h-3" />}
                    <span>{isSelected ? "Đang chọn" : "Mở soạn"}</span>
                  </button>

                  <button
                    onClick={() => duplicateDraft(draft.id)}
                    disabled={isDuplicating}
                    title="Nhân bản nháp"
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => archiveDraft(draft.id)}
                    disabled={isArchiving}
                    title={draft.archived ? "Phục hồi nháp" : "Lưu trữ nháp"}
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-all"
                  >
                    {draft.archived ? <ArchiveRestore className="w-3.5 h-3.5 text-amber-500" /> : <Archive className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa bản thảo này?")) {
                        deleteDraft(draft.id);
                      }
                    }}
                    disabled={isDeleting}
                    title="Xóa nháp"
                    className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
