import React from "react";
import { HIRAGANA_GROUPS, HiraganaChar } from "../data/hiragana";
import { KATAKANA_GROUPS } from "../data/katakana";
import { speakJapanese, sounds } from "../utils/audio";
import { Volume2, CheckCircle2, Circle } from "lucide-react";

interface Properties {
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  characterSet: "hiragana" | "katakana";
}

export default function HiraganaChart({
  selectedGroups,
  onToggleGroup,
  onSelectAll,
  onSelectNone,
  characterSet,
}: Properties) {
  const [activeTab, setActiveTab] = React.useState<"gojuon" | "dakuten" | "handakuten">("gojuon");

  const gojuonKeys = ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"];
  const dakutenKeys = ["dakuten"];
  const handakutenKeys = ["handakuten"];

  const currentGroups = React.useMemo(() => {
    if (activeTab === "gojuon") return gojuonKeys;
    if (activeTab === "dakuten") return dakutenKeys;
    return handakutenKeys;
  }, [activeTab]);

  const activeGroupsSource = characterSet === "hiragana" ? HIRAGANA_GROUPS : KATAKANA_GROUPS;

  const handleCellClick = (char: HiraganaChar) => {
    sounds.playClick();
    speakJapanese(char.hiragana);
  };

  return (
    <div id="hiragana-chart-ref" className="bg-white rounded-2xl border border-stone-100 shadow-xs p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-stone-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-800">
            Bản Đồ Ký Tự {characterSet === "hiragana" ? "Hiragana" : "Katakana"}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Chọn hàng chữ để bao gồm trong bộ chữ ngẫu nhiên khi học / thi thử.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-select-all-groups"
            onClick={() => {
              sounds.playClick();
              onSelectAll();
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            Chọn tất cả
          </button>
          <button
            id="btn-clear-all-groups"
            onClick={() => {
              sounds.playClick();
              onSelectNone();
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 mb-6 gap-2">
        <button
          id="tab-chart-gojuon"
          onClick={() => {
            sounds.playClick();
            setActiveTab("gojuon");
          }}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === "gojuon"
              ? "border-rose-500 text-rose-600 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Âm Bản Bản (Gojūon)
        </button>
        <button
          id="tab-chart-dakuten"
          onClick={() => {
            sounds.playClick();
            setActiveTab("dakuten");
          }}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === "dakuten"
              ? "border-rose-500 text-rose-600 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Âm Đục (Dakuten)
        </button>
        <button
          id="tab-chart-handakuten"
          onClick={() => {
            sounds.playClick();
            setActiveTab("handakuten");
          }}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === "handakuten"
              ? "border-rose-500 text-rose-600 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Bán Biến Âm (Handakuten)
        </button>
      </div>

      {/* Group Lists */}
      <div className="grid grid-cols-1 gap-6">
        {currentGroups.map((groupKey) => {
          const group = activeGroupsSource[groupKey];
          if (!group) return null;
          const isSelected = selectedGroups.includes(groupKey);

          return (
            <div
              id={`group-row-${groupKey}`}
              key={groupKey}
              className={`rounded-xl border transition-all p-4 ${
                isSelected
                  ? "bg-rose-50/20 border-rose-100"
                  : "bg-stone-50/50 border-stone-200/60"
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    id={`toggle-group-btn-${groupKey}`}
                    onClick={() => onToggleGroup(groupKey)}
                    className="text-rose-500 hover:scale-105 transition-transform"
                    title={isSelected ? "Bỏ chọn hàng này" : "Chọn hàng này"}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 fill-rose-500 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-stone-700">
                    {group.label}
                  </span>
                </div>
                <span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded-full text-stone-500">
                  {group.chars.length} tự
                </span>
              </div>

              {/* Characters inside the group */}
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {group.chars.map((char) => (
                  <div
                    id={`char-cell-${char.hiragana}`}
                    key={char.hiragana}
                    onClick={() => handleCellClick(char)}
                    className="group relative flex flex-col items-center justify-between p-2.5 bg-white border border-stone-200 hover:border-rose-300 rounded-lg cursor-pointer transition-all hover:shadow-xs hover:-translate-y-0.5"
                  >
                    <span className="font-serif-jp text-2xl font-bold text-stone-800 group-hover:text-rose-600 transition-colors">
                      {char.hiragana}
                    </span>
                    <div className="text-center mt-1">
                      <span className="block text-xs font-semibold text-stone-600 font-mono tracking-tight lowercase">
                        {char.romaji}
                      </span>
                      <span className="block text-[9px] text-stone-400 font-medium">
                        /{char.vietnamesePronunciation}/
                      </span>
                    </div>

                    {/* Audio Hover Cue */}
                    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 text-stone-400 transition-opacity">
                      <Volume2 className="w-2.5 h-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
