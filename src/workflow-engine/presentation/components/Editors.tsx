import React, { useState } from "react";
import { useDraft } from "../lessonBuilderContext";
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  PlusCircle, 
  BookOpen, 
  FileText,
  BookmarkCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { VocabularyItem, GrammarItem } from "../../domain/types";
import { motion, AnimatePresence } from "motion/react";

export function Editors() {
  const { currentDraft, updateDraft, isUpdating } = useDraft();
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar">("vocab");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Expanded card/accordion details states
  const [expandedVocab, setExpandedVocab] = useState<Record<string, boolean>>({});
  const [expandedGrammar, setExpandedGrammar] = useState<Record<string, boolean>>({});

  if (!currentDraft) {
    return (
      <div className="py-12 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 gap-2 bg-stone-50/50">
        <BookOpen className="w-8 h-8 text-stone-300" />
        <p className="text-xs font-bold text-stone-600">Chọn hoặc tạo một Bản thảo để mở bộ soạn thảo</p>
      </div>
    );
  }

  const { vocabulary, grammar } = currentDraft.context.input;

  const handleUpdateVocab = (index: number, field: keyof VocabularyItem, value: any) => {
    const nextVocab = [...vocabulary];
    nextVocab[index] = { ...nextVocab[index], [field]: value };
    updateDraftContext(nextVocab, grammar);
  };

  const handleAddVocabRow = () => {
    const newItem: VocabularyItem = {
      id: `vocab-${Date.now()}`,
      kanji: "",
      hiragana: "新しい単語",
      romaji: "atarashii tango",
      meaningVi: "từ vựng mới",
      examples: []
    };
    const nextVocab = [...vocabulary, newItem];
    updateDraftContext(nextVocab, grammar);
  };

  const handleRemoveVocabRow = (id: string) => {
    const nextVocab = vocabulary.filter(item => item.id !== id);
    updateDraftContext(nextVocab, grammar);
  };

  const handleUpdateGrammar = (index: number, field: keyof GrammarItem, value: any) => {
    const nextGrammar = [...grammar];
    nextGrammar[index] = { ...nextGrammar[index], [field]: value };
    updateDraftContext(vocabulary, nextGrammar);
  };

  const handleAddGrammarRow = () => {
    const newItem: GrammarItem = {
      id: `grammar-${Date.now()}`,
      pattern: "～は～です",
      meaningVi: "là...",
      explanationVi: "Mẫu ngữ pháp cơ bản để chỉ đặc tính, danh tính.",
      examples: []
    };
    const nextGrammar = [...grammar, newItem];
    updateDraftContext(vocabulary, nextGrammar);
  };

  const handleRemoveGrammarRow = (id: string) => {
    const nextGrammar = grammar.filter(item => item.id !== id);
    updateDraftContext(vocabulary, nextGrammar);
  };

  // Helper to commit inputs to state
  const updateDraftContext = async (newVocab: VocabularyItem[], newGrammar: GrammarItem[]) => {
    try {
      await updateDraft(currentDraft.id, {
        context: {
          ...currentDraft.context,
          input: {
            vocabulary: newVocab,
            grammar: newGrammar
          }
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update draft inputs:", err);
    }
  };

  const toggleVocabExpand = (id: string) => {
    setExpandedVocab(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGrammarExpand = (id: string) => {
    setExpandedGrammar(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div id="editors-container" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Tabs Header */}
      <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("vocab")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "vocab"
                ? "bg-white text-rose-600 shadow-3xs border border-stone-150"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            Từ vựng ({vocabulary.length})
          </button>
          <button
            onClick={() => setActiveTab("grammar")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              activeTab === "grammar"
                ? "bg-white text-rose-600 shadow-3xs border border-stone-150"
                : "text-stone-500 hover:text-stone-850"
            }`}
          >
            Ngữ pháp ({grammar.length})
          </button>
        </div>

        {/* Save/Sync Indicators */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
          {isUpdating ? (
            <span className="flex items-center gap-1 text-rose-500 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Đang lưu...
            </span>
          ) : saveSuccess ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã đồng bộ tự động
            </span>
          ) : (
            <span className="flex items-center gap-1 text-stone-400">
              <Save className="w-3 h-3" />
              Tự động lưu
            </span>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4">
        {activeTab === "vocab" ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Danh sách từ vựng gốc cho bài học
              </span>
              <button
                onClick={handleAddVocabRow}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm từ vựng</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {vocabulary.map((item, index) => {
                const isExpanded = !!expandedVocab[item.id];
                return (
                  <div 
                    key={item.id} 
                    className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50/30 hover:bg-stone-50/50 transition-all"
                  >
                    <div className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={item.hiragana}
                          onChange={(e) => handleUpdateVocab(index, "hiragana", e.target.value)}
                          placeholder="Chữ Hiragana (vd: いぬ)"
                          className="bg-white border border-stone-200 rounded px-2 py-1 font-bold text-stone-800 focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={item.romaji}
                          onChange={(e) => handleUpdateVocab(index, "romaji", e.target.value)}
                          placeholder="Romaji (vd: inu)"
                          className="bg-white border border-stone-200 rounded px-2 py-1 font-semibold text-stone-600 focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={item.meaningVi}
                          onChange={(e) => handleUpdateVocab(index, "meaningVi", e.target.value)}
                          placeholder="Nghĩa tiếng Việt"
                          className="bg-white border border-stone-200 rounded px-2 py-1 font-medium text-stone-700 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleVocabExpand(item.id)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"
                          title="Chi tiết phụ"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRemoveVocabRow(item.id)}
                          className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded panel for Kanji/Category */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-stone-200 bg-white p-3 space-y-2 text-xs"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-stone-400 block mb-1">Chữ Hán (Kanji - Tùy chọn)</label>
                              <input
                                type="text"
                                value={item.kanji || ""}
                                onChange={(e) => handleUpdateVocab(index, "kanji", e.target.value)}
                                placeholder="Ví dụ: 犬"
                                className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 font-semibold text-stone-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-stone-400 block mb-1">Phân loại (Category)</label>
                              <input
                                type="text"
                                value={item.category || ""}
                                onChange={(e) => handleUpdateVocab(index, "category", e.target.value)}
                                placeholder="Ví dụ: Danh từ, Động từ..."
                                className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 font-semibold text-stone-800"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Cấu trúc ngữ pháp trọng tâm bài học
              </span>
              <button
                onClick={handleAddGrammarRow}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm ngữ pháp</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {grammar.map((item, index) => {
                const isExpanded = !!expandedGrammar[item.id];
                return (
                  <div 
                    key={item.id} 
                    className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50/30 hover:bg-stone-50/50 transition-all"
                  >
                    <div className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          value={item.pattern}
                          onChange={(e) => handleUpdateGrammar(index, "pattern", e.target.value)}
                          placeholder="Cấu trúc ngữ pháp (vd: ～は～です)"
                          className="bg-white border border-stone-200 rounded px-2 py-1 font-bold text-stone-800 focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={item.meaningVi}
                          onChange={(e) => handleUpdateGrammar(index, "meaningVi", e.target.value)}
                          placeholder="Nghĩa tiếng Việt"
                          className="bg-white border border-stone-200 rounded px-2 py-1 font-semibold text-stone-700 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleGrammarExpand(item.id)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"
                          title="Chi tiết phụ"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRemoveGrammarRow(item.id)}
                          className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded panel for Explanation */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-stone-200 bg-white p-3 space-y-2 text-xs"
                        >
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 block mb-1">Giải thích chi tiết (Tiếng Việt)</label>
                            <textarea
                              rows={2}
                              value={item.explanationVi || ""}
                              onChange={(e) => handleUpdateGrammar(index, "explanationVi", e.target.value)}
                              placeholder="Giải thích cách dùng, hoàn cảnh..."
                              className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 font-medium text-stone-800"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
