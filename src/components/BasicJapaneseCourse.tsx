import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  N5_LESSONS, 
  Lesson, 
  getUnlockedLessons, 
  saveUnlockLesson,
  getCompletedLessons,
  saveCompleteLesson
} from "../data/lessons";
import { VocabularyWord, JAPANESE_VOCABULARY } from "../data/vocabulary";
import { 
  BookOpen, 
  CheckCircle, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Award, 
  Volume2, 
  RotateCcw, 
  Check, 
  X, 
  GraduationCap, 
  Layers, 
  Play, 
  BookMarked, 
  Trophy, 
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  TrendingUp,
  Sliders,
  MessageSquare,
  Sparkles,
  Search,
  BookOpenCheck,
  ChevronRight,
  BookmarkCheck,
  VolumeX,
  PlayCircle,
  FileJson,
  Edit3,
  FileText,
  MoreVertical,
  User,
  LogIn,
  LogOut,
  Trash2,
  ArrowRightLeft,
  List,
  RefreshCw,
  Languages,
  PlusCircle
} from "lucide-react";
import { sounds } from "../utils/audio";
import { 
  authenticateAnonymously, 
  saveProgressToCloud, 
  loadProgressFromCloud,
  getLessonsFromCloud,
  seedLessonsToCloud,
  verifyCustomAccount,
  registerCustomAccount,
  saveCategorizedVocabToCloud,
  seedCasualVocabToCloud
} from "../utils/firebase";

// Smart confusable generator for distraction generation
const JP_CONFUSABLES: Record<string, string[]> = {
  'あ': ['お', 'め', 'ぬ', 'む'],
  'い': ['り', 'に', 'こ', 'け'],
  'う': ['ら', 'つ', 'お', 'る'],
  'え': ['ん', 'お', 'わ', 'れ'],
  'お': ['あ', 'む', 'わ', 'め'],
  'か': ['が', 'お', 'わ'],
  'き': ['ぎ', 'さ', 'ち'],
  'こ': ['ご', 'に', 'い', 'た'],
  'さ': ['ざ', 'き', 'ち', 'さ'],
  'し': ['じ', 'つ', 'い', 'し'],
  'す': ['ず', 'む', 'お', 'ぬ'],
  'た': ['だ', 'な', 'に', 'た'],
  'ち': ['ぢ', 'さ', 'ら'],
  'つ': ['づ', 'っ', 'し'],
  'て': ['de', 'と', 'そ'],
  'と': ['ど', 'て', 'と'],
  'な': ['た', 'ね', 'ぬ'],
  'に': ['こ', 'た', 'り'],
  'は': ['ば', 'ぱ', 'ほ'],
  'ま': ['よ', 'も', 'は'],
  'み': ['ね', 'み'],
  'む': ['す', 'お', 'め'],
  'め': ['ぬ', 'あ', 'の'],
  'も': ['ま', 'し', 'む'],
  'ら': ['ち', 'う', 'る'],
  'り': ['い', 'け'],
  'る': ['ろ', 'ら', 'う'],
  'れ': ['ね', 'わ'],
  'ろ': ['る', 'ら'],
  'わ': ['れ', 'ね', 'お'],
  'を': ['お', 'と'],
  'ん': ['そ', 'え', 'れ']
};

function generateConfusableAnswers(correct: string, currentLessonWords: VocabularyWord[]): string[] {
  const distractors: Set<string> = new Set();
  
  for (let attempt = 0; attempt < 15; attempt++) {
    let perturbed = "";
    const indexToChange = Math.floor(Math.random() * correct.length);
    
    for (let i = 0; i < correct.length; i++) {
      const char = correct[i];
      if (i === indexToChange && JP_CONFUSABLES[char]) {
        const confList = JP_CONFUSABLES[char];
        const randomReplacement = confList[Math.floor(Math.random() * confList.length)];
        perturbed += randomReplacement;
      } else {
        perturbed += char;
      }
    }
    
    if (perturbed && perturbed !== correct && !distractors.has(perturbed)) {
      distractors.add(perturbed);
    }
    if (distractors.size >= 3) break;
  }
  
  if (distractors.size < 3) {
    const modifications = [
      correct.replace(/か/g, "g").replace(/さ/g, "za").replace(/た/g, "da").replace(/は/g, "ba"),
      correct + "ね",
      correct + "よ"
    ];
    for (const mod of modifications) {
      if (mod && mod !== correct) {
        distractors.add(mod);
      }
      if (distractors.size >= 3) break;
    }
  }

  if (distractors.size < 3) {
    const shuffledLesson = [...currentLessonWords].sort(() => Math.random() - 0.5);
    for (const item of shuffledLesson) {
      if (item.japanese !== correct) {
        distractors.add(item.japanese);
      }
      if (distractors.size >= 3) break;
    }
  }

  return Array.from(distractors).slice(0, 3);
}

// Text-to-speech voicing
const speakJapanese = (text: string) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\s*\(.*?\)\s*/g, ""); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85; 
    
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.includes("JP") || v.lang.includes("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech Synthesis failure", e);
  }
};

function generateEssayQuestions(lesson: Lesson): { question: string; hint: string; answers: string[] }[] {
  const list: { question: string; hint: string; answers: string[] }[] = [];
  
  if (lesson.id === 1) {
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Tôi là học sinh'",
      hint: "Sử dụng từ vựng: わたし (Tôi), がくせい (Học sinh). Cấu trúc: N1 は N2 です。",
      answers: ["わたしはがくseいです", "わたしはがくせいです", "わたしはがくせいです。", "わたしは がくせいです", "わたしは がくせいです。"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Anh Miller là người Mỹ'",
      hint: "Sử dụng từ vựng: みらー (Miller), あめりかじん (Người Mỹ). Đừng quên hậu tố さん cho người khác.",
      answers: ["みらーさんはあめりかじんです", "みらーさんはあめりかじんです。", "ミラーさんはアメリカじんです", "ミラーさんはアメリカじんです。"]
    });
    list.push({
      question: "Điền trợ từ thích hợp vào chỗ trống: わたし (__) べとなむじんです。",
      hint: "Điền trợ từ đứng sau chủ đề câu (Tôi là người Việt Nam).",
      answers: ["は"]
    });
    list.push({
      question: "Hãy viết lời chào xã giao 'Rất vui được gặp anh/chị' bằng Hiragana:",
      hint: "Câu chào dùng lần đầu tiên gặp mặt.",
      answers: ["はじめまして", "はじめまして。"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Tôi cũng là nhân viên công ty'",
      hint: "Sử dụng từ vựng: わたし (Tôi), かいしゃいn (Nhân viên công ty), trợ từ も (cũng).",
      answers: ["わたしもかいしゃいんです", "わたしもかいしゃいんです。", "わたしも かいしゃいんです", "わたしも かいしゃいんです。"]
    });
  } else if (lesson.id === 2) {
    list.push({
      question: "Hãy dịch câu sau sang Hiragana/Katakana: 'Đây là quyển sách'",
      hint: "Sử dụng từ vựng: これ (Đây), ほん (Quyển sách).",
      answers: ["これはほんです", "これはほんです。"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana/Katakana: 'Đó là cái ô'",
      hint: "Sử dụng từ vựng: それ (Đó), かさ (Cái ô).",
      answers: ["それはかさです", "それはかさです。"]
    });
    list.push({
      question: "Điền trợ từ sở hữu vào chỗ trống: これは わたし (__) ほんです。",
      hint: "Quyển sách này là của tôi.",
      answers: ["の"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Cái kia là cái gì?'",
      hint: "Sử dụng từ vựng: あれ (Cái kia), なん (Cái gì), nghi vấn từ ですか.",
      answers: ["あれはなんですか", "あれはなんですか。"]
    });
    list.push({
      question: "Hãy viết từ 'Sổ tay cá nhân' bằng chữ Hiragana:",
      hint: "Từ vựng chỉ sổ tay nhỏ bỏ túi.",
      answers: ["てちょう"]
    });
  } else if (lesson.id === 3) {
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Văn phòng ở đằng kia'",
      hint: "Sử dụng từ vựng: じむしょ (Văn phòng), あそこ (Đằng kia).",
      answers: ["じむしょはあそこです", "じむしょはあそこです。"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Nhà vệ sinh ở đâu?'",
      hint: "Sử dụng từ vựng: おてあらい (Nhà vệ sinh), どこ (Ở đâu).",
      answers: ["おてあらいはどこですか", "おてあらいはどこですか。"]
    });
    list.push({
      question: "Điền trợ từ thích hợp: しょくどう (__) どこですか。",
      hint: "Nhà ăn ở đâu vậy?",
      answers: ["は"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Điện thoại ở tầng 2'",
      hint: "Sử dụng từ vựng: でんわ (Điện thoại), にかい (Tầng 2).",
      answers: ["deんわはにかいです", "でんわはにかいです", "でんわはにかいです。"]
    });
    list.push({
      question: "Hãy dịch câu sau sang Hiragana: 'Đất nước của bạn ở đâu vậy?' (lịch sự)",
      hint: "Sử dụng kính ngữ: おくに (Đất nước), どちら (Đâu, hướng nào).",
      answers: ["おくにはどちらですか", "おくにはどちらですか。"]
    });
  } else {
    // Fallback generator for custom/imported vocabulary
    const words = lesson.words && lesson.words.length > 0 ? lesson.words : [{ japanese: "にほん", vietnameseMeaning: "Nhật Bản", romaji: "nihon" }];
    const count = Math.min(5, words.length);
    for (let i = 0; i < count; i++) {
      const w = words[i];
      list.push({
        question: `Hãy dịch từ vựng mang ý nghĩa "${w.vietnameseMeaning}" sang chữ Hiragana hoặc Katakana:`,
        hint: `Phát âm tiếng Nhật (romaji) là: /${w.romaji || ""}/`,
        answers: [w.japanese, w.japanese.replace(/\s+/g, ""), w.japanese.trim()]
      });
    }
    while (list.length < 5) {
      const w = words[list.length % words.length];
      list.push({
        question: `Hãy viết chính xác từ vựng sau bằng tiếng Nhật: "${w.vietnameseMeaning}"`,
        hint: `Gợi ý phát âm: /${w.romaji || ""}/`,
        answers: [w.japanese, w.japanese.replace(/\s+/g, "")]
      });
    }
  }

  return list;
}

function generateJLPTQuestions(lesson: Lesson): {
  type: "moji-goi" | "bunpou" | "dokkai";
  questionText: string;
  passage?: string;
  passageTranslation?: string;
  options: string[];
  correctStr: string;
  explanation: string;
}[] {
  const list: {
    type: "moji-goi" | "bunpou" | "dokkai";
    questionText: string;
    passage?: string;
    passageTranslation?: string;
    options: string[];
    correctStr: string;
    explanation: string;
  }[] = [];

  if (lesson.id === 1) {
    list.push({
      type: "moji-goi",
      questionText: "Cách đọc Hiragana chính xác của từ '先生' (Thầy/cô giáo) là gì?",
      options: ["せんせい", "きょうし", "がくせい", "しゃいん"],
      correctStr: "せんせい",
      explanation: "先生 đọc là せんせい (sensei), dùng làm danh xưng hoặc gọi giáo viên."
    });
    list.push({
      type: "moji-goi",
      questionText: "Từ Katakana 'エンジニア' tương ứng với nghề nghiệp nào?",
      options: ["Bác sĩ", "Giáo viên", "Kỹ sư", "Nhà nghiên cứu"],
      correctStr: "Kỹ sư",
      explanation: "エンジニア (enjinia) phiên âm từ 'Engineer' nghĩa là Kỹ sư."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn trợ từ phù hợp: わたし (__) ミラー です。",
      options: ["が", "を", "は", "の"],
      correctStr: "は",
      explanation: "Trợ từ は (đọc là wa) đứng sau chủ đề câu khẳng định 'N1 は N2 です'."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn đuôi câu phủ định thích hợp: サントスさんは 学生 (__)。",
      options: ["です", "では ありません", "ですか", "の です"],
      correctStr: "では ありません",
      explanation: "Để phủ định danh từ ở N5, ta dùng 'では ありません' (không phải là...)."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn trợ từ phù hợp: ミラーさんは アメリカ人 です. サントスさん (__) アメリカ人 ですか。",
      options: ["は", "も", "が", "の"],
      correctStr: "も",
      explanation: "Trợ từ も biểu thị ý nghĩa 'cũng là'. Câu hỏi hỏi Santos cũng là người Mỹ phải không."
    });
    list.push({
      type: "dokkai",
      passage: "はじめまして。わたしは タワポン です。タイ から きました。学生 です。どうぞ よろしく。",
      passageTranslation: "Rất vui được gặp các bạn. Tôi là Thawaphon. Tôi đến từ Thái Lan. Tôi là học sinh. Rất mong nhận được sự giúp đỡ.",
      questionText: "タワポンさんは どこから きましたか。(Anh Thawaphon đến từ đâu?)",
      options: ["ベトナム", "アメリカ", "タイ", "日本"],
      correctStr: "タイ",
      explanation: "Trong đoạn văn: 'タイ から きました' có nghĩa là đến từ Thái Lan."
    });
    list.push({
      type: "dokkai",
      passage: "あの人は サントスさん です。サントスさんは ブラジル人 です。学生 では ありません。会社員 です。",
      passageTranslation: "Người kia là anh Santos. Anh Santos là người Brazil. Anh ấy không phải là học sinh. Anh ấy là nhân viên công ty.",
      questionText: "サントスさんの しごとは 何ですか。(Công việc của anh Santos là gì?)",
      options: ["学生", "会社員", "先生", "医者"],
      correctStr: "会社員",
      explanation: "Trong đoạn văn có viết: '学生 では ありません。会社員 です' (Không phải là học sinh. Là nhân viên công ty)."
    });
  } else if (lesson.id === 2) {
    list.push({
      type: "moji-goi",
      questionText: "Từ vựng 'しんぶん' tương ứng với đồ vật nào sau đây?",
      options: ["Quyển sách", "Tờ báo", "Cuốn vở", "Cuốn từ điển"],
      correctStr: "Tờ báo",
      explanation: "しんぶん (shinbun) nghĩa là tờ báo."
    });
    list.push({
      type: "moji-goi",
      questionText: "Cách đọc Hiragana chính xác của từ '辞書' (Từ điển) là gì?",
      options: ["じしょ", "ほん", "ざっし", "てちょう"],
      correctStr: "じしょ",
      explanation: "辞書 đọc là じしょ (jisho) có nghĩa là cuốn từ điển."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn từ chỉ thị thích hợp: (__) は わたし の ほん です。 (Vật ở gần người nói)",
      options: ["これ", "それ", "あれ", "この"],
      correctStr: "これ",
      explanation: "これ (kore) dùng để chỉ vật ở gần người nói."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn trợ từ sở hữu phù hợp: それは わたし (__) てちょう です。",
      options: ["は", "の", "か", "も"],
      correctStr: "の",
      explanation: "Trợ từ の liên kết 2 danh từ biểu thị sự sở hữu: わたし の てちょう (sổ tay của tôi)."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn từ chỉ thị thích hợp: (__) ほんは わたし の です。",
      options: ["これ", "それ", "この", "あれ"],
      correctStr: "この",
      explanation: "この (kono) bổ nghĩa trực tiếp cho danh từ đi liền sau nó: この ほん (quyển sách này)."
    });
    list.push({
      type: "dokkai",
      passage: "これは 辞書 です. 日本語 の 辞書 です. わたし の 辞書 です. ミラーさん の では ありません。",
      passageTranslation: "Đây là cuốn từ điển. Là từ điển tiếng Nhật. Là từ điển của tôi. Không phải là của anh Miller.",
      questionText: "これは だれの 辞書 ですか。(Đây là từ điển của ai?)",
      options: ["ミラーさんの", "わたし の", "日本語", "先生 của tôi"],
      correctStr: "わたし の",
      explanation: "Đoạn văn viết rõ: 'わたし の 辞書 です' (Là từ điển của tôi)."
    });
  } else if (lesson.id === 3) {
    list.push({
      type: "moji-goi",
      questionText: "Từ vựng 'じむしょ' có ý nghĩa tiếng Việt là gì?",
      options: ["Nhà vệ sinh", "Văn phòng", "Lớp học", "Nhà ăn"],
      correctStr: "Văn phòng",
      explanation: "じむしょ (jimusho) nghĩa là văn phòng làm việc."
    });
    list.push({
      type: "moji-goi",
      questionText: "Từ 'おてあらい' đồng nghĩa với từ nào sau đây?",
      options: ["トイレ", "じむしょ", "へや", "うち"],
      correctStr: "トイレ",
      explanation: "おてあらい (お手洗い) và トイレ (toire) đều có nghĩa là nhà vệ sinh."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn trợ từ phù hợp: じむしょ は あそこ (__) です。",
      options: ["の", "に", "は", "Không cần điền"],
      correctStr: "Không cần điền",
      explanation: "Trong câu cấu trúc 'N は Địa điểm です', ta không cần trợ từ giữa địa điểm và です."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn nghi vấn từ phù hợp: トイレ は (__) ですか。",
      options: ["だれ", "なん", "どこ", "どれ"],
      correctStr: "どこ",
      explanation: "どこ (doko) dùng để hỏi địa điểm ở đâu."
    });
    list.push({
      type: "bunpou",
      questionText: "Chọn từ chỉ hướng lịch sự: エレベーター は (__) ですか。",
      options: ["どちら", "だれ", "なんの", "đâu"],
      correctStr: "どちら",
      explanation: "どちら (dochira) là nghi vấn từ hỏi phương hướng/địa điểm một cách lịch sự, thay cho <u>doko</u>."
    });
    list.push({
      type: "dokkai",
      passage: "ここは 大学 です. 食堂 は ２階 です. 事務所 も ２階 です. お手洗い は １階 です。",
      passageTranslation: "Đây là trường đại học. Nhà ăn ở tầng 2. Văn phòng cũng ở tầng 2. Nhà vệ sinh ở tầng 1.",
      questionText: "２階に なに が ありますか。(Ở tầng 2 có cái gì?)",
      options: ["食堂 と 事務所", "お手洗い", "大学", "エレベーター"],
      correctStr: "食堂 と 事務所",
      explanation: "Bài đọc cho biết 食堂 は ２階 です (Nhà ăn tầng 2) và 事務所 も ２階 です (Văn phòng cũng tầng 2)."
    });
  } else {
    // Dynamic/Smart fallback generator for any imported / custom lesson!
    const words = lesson.words && lesson.words.length > 0 ? lesson.words : [{ japanese: "にほん", vietnameseMeaning: "Nhật Bản", romaji: "nihon" }];
    const w1 = words[0];
    const w2 = words[Math.min(1, words.length - 1)];

    list.push({
      type: "moji-goi",
      questionText: `Cách viết tiếng Nhật chính xác của từ "${w1.vietnameseMeaning}" là gì?`,
      options: [w1.japanese, ...words.slice(1, 4).map(w => w.japanese)].sort(() => Math.random() - 0.5),
      correctStr: w1.japanese,
      explanation: `Từ "${w1.vietnameseMeaning}" viết bằng tiếng Nhật là: ${w1.japanese}.`
    });
    list.push({
      type: "moji-goi",
      questionText: `Từ vựng tiếng Nhật "${w2.japanese}" mang ý nghĩa gì?`,
      options: [w2.vietnameseMeaning, ...words.filter(w => w.vietnameseMeaning !== w2.vietnameseMeaning).slice(0, 3).map(w => w.vietnameseMeaning)].sort(() => Math.random() - 0.5),
      correctStr: w2.vietnameseMeaning,
      explanation: `Trong bài học, từ "${w2.japanese}" có nghĩa là "${w2.vietnameseMeaning}".`
    });
    list.push({
      type: "bunpou",
      questionText: `Mẫu ngữ pháp "${lesson.grammar?.pattern || 'của bài học'}" được minh họa chuẩn bởi câu nào?`,
      options: [lesson.grammar?.example || "わたしはにほんごをべんきょうします。", "これはなんですか。", "こんにちは。"].sort(() => Math.random() - 0.5),
      correctStr: lesson.grammar?.example || "わたしはにほんごをべんきょうします。",
      explanation: `Câu ví dụ của bài là: "${lesson.grammar?.example}" (${lesson.grammar?.exampleMeaning}).`
    });
    list.push({
      type: "bunpou",
      questionText: `Ý nghĩa giải thích chính xác của cấu trúc ngữ pháp "${lesson.grammar?.pattern || 'của bài học'}" là gì?`,
      options: [lesson.grammar?.explanation || "Giải thích mẫu câu", "Diễn đạt một yêu cầu khẩn cấp.", "Bày tỏ một cảm xúc vui mừng."],
      correctStr: lesson.grammar?.explanation || "Giải thích mẫu câu",
      explanation: `Cấu trúc này dùng để: ${lesson.grammar?.explanation}`
    });
    list.push({
      type: "dokkai",
      passage: `わたしは 毎日 日本語を べんきょうします。これは わたしの ${w1.japanese} です。とても おもしろい です。`,
      passageTranslation: `Tôi học tiếng Nhật mỗi ngày. Đây là ${w1.vietnameseMeaning.toLowerCase()} của tôi. Nó rất thú vị.`,
      questionText: `Theo đoạn văn, cái gì rất thú vị?`,
      options: [w1.vietnameseMeaning, "Tiếng Nhật", "Mỗi ngày", "Không nhắc đến"],
      correctStr: w1.vietnameseMeaning,
      explanation: `Đoạn văn viết: 'これは わたしの ${w1.japanese} です。とても おもしろい です' (Đây là ${w1.vietnameseMeaning.toLowerCase()} của tôi. Nó rất thú vị).`
    });
  }

  // Ensure options logic is clean
  list.forEach(q => {
    q.options = Array.from(new Set(q.options));
    if (!q.options.includes(q.correctStr)) {
      q.options.push(q.correctStr);
    }
    while (q.options.length < 4) {
      q.options.push("Đáp án khác " + Math.random().toString(36).substring(2, 6));
    }
    q.options.sort(() => Math.random() - 0.5);
  });

  return list;
}

interface BasicJapaneseCourseProps {
  activeLevel?: "N5" | "N4" | "N3" | "N2" | "N1";
  onLevelChange?: (lvl: "N5" | "N4" | "N3" | "N2" | "N1") => void;
}

export default function BasicJapaneseCourse({ activeLevel: propActiveLevel, onLevelChange }: BasicJapaneseCourseProps = {}) {
  const [internalActiveLevel, setInternalActiveLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const activeLevel = propActiveLevel !== undefined ? propActiveLevel : internalActiveLevel;
  const setActiveLevel = onLevelChange !== undefined ? onLevelChange : setInternalActiveLevel;
  const [unlockedLessons, setUnlockedLessons] = useState<number[]>([]);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  
  const [user, setUser] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "authenticating" | "syncing" | "synced" | "failed">("idle");

  // --- Account / Auth States ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("japanese_course_is_logged_in") === "true";
  });
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem("japanese_course_username");
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authModalError, setAuthModalError] = useState<string | null>(null);
  const [authModalSuccess, setAuthModalSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [lessonToEnterAfterLogin, setLessonToEnterAfterLogin] = useState<Lesson | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // --- Vocabulary Editing States ---
  const [isEditingVocab, setIsEditingVocab] = useState<boolean>(false);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [movingWordIndex, setMovingWordIndex] = useState<number | null>(null);
  const [deletingWordIndex, setDeletingWordIndex] = useState<number | null>(null);
  const [moveTargetLessonId, setMoveTargetLessonId] = useState<number | null>(null);
  
  // --- AI Auto-Categorize States ---
  const [vocabViewMode, setVocabViewMode] = useState<"list" | "ai">("list");
  const [isCategorizingByAi, setIsCategorizingByAi] = useState<boolean>(false);
  const [aiCategorizeError, setAiCategorizeError] = useState<string | null>(null);
  const [selectedAiModel, setSelectedAiModel] = useState<string>("gemini-3.5-flash");
  
  // --- AI Auto-Translate States ---
  const [isTranslatingEn, setIsTranslatingEn] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<string | null>(null);
  
  // Temporary fields for editing
  const [editJp, setEditJp] = useState<string>("");
  const [editRomaji, setEditRomaji] = useState<string>("");
  const [editVn, setEditVn] = useState<string>("");
  const [editEn, setEditEn] = useState<string>("");
  
  // Tab-based lesson learning structure
  // "vocab" | "flashcard" | "grammar" | "practice" | "choukai" | "kaiwa" | "reading"
  const [studySubMode, setStudySubMode] = useState<"vocab" | "flashcard" | "grammar" | "practice" | "choukai" | "kaiwa" | "reading">("vocab");

  // --- Database and Course State ---
  const [lessons, setLessons] = useState<Lesson[]>(N5_LESSONS);
  const [lessonsLoading, setLessonsLoading] = useState<boolean>(true);

  // --- Import Vocabulary JSON States ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importTargetLessonId, setImportTargetLessonId] = useState<number | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<"json" | "single">("json");
  const [singleJapanese, setSingleJapanese] = useState("");
  const [singleRomaji, setSingleRomaji] = useState("");
  const [singleVietnamese, setSingleVietnamese] = useState("");

  // New fields for custom topic (lesson) creation & grammar import
  const [importScope, setImportScope] = useState<"existing" | "new">("existing");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");
  const [newLessonLevel, setNewLessonLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [newLessonCategory, setNewLessonCategory] = useState("");
  const [newLessonGrammarPattern, setNewLessonGrammarPattern] = useState("");
  const [newLessonGrammarExplanation, setNewLessonGrammarExplanation] = useState("");
  const [newLessonGrammarExample, setNewLessonGrammarExample] = useState("");
  const [newLessonGrammarExampleMeaning, setNewLessonGrammarExampleMeaning] = useState("");

  // --- Flashcard Tab States ---
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // --- Practice Tab States (Subdivided into three types of exams) ---
  // "vocab-exam" | "essay-exam" | "jlpt-exam"
  const [practiceType, setPracticeType] = useState<"vocab-exam" | "essay-exam" | "jlpt-exam">("vocab-exam");
  
  // 1. Vocabulary MCQ Exam States (Kì thi trắc nghiệm từ vựng)
  const [examQuestions, setExamQuestions] = useState<{
    word: VocabularyWord;
    options: string[];
    correctStr: string;
    type: "jp-to-vn" | "vn-to-jp";
  }[]>([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examSelectedAns, setExamSelectedAns] = useState<string | null>(null);
  const [examAnswered, setExamAnswered] = useState(false);
  const [examIsCorrect, setExamIsCorrect] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examFinished, setExamFinished] = useState(false);

  // 2. Essay Exam States (Kì thi tự luận Hiragana/Katakana)
  const [essayQuestions, setEssayQuestions] = useState<{
    question: string;
    hint: string;
    answers: string[];
  }[]>([]);
  const [essayIndex, setEssayIndex] = useState(0);
  const [essayInput, setEssayInput] = useState("");
  const [essayAnswered, setEssayAnswered] = useState(false);
  const [essayIsCorrect, setEssayIsCorrect] = useState(false);
  const [essayScore, setEssayScore] = useState(0);
  const [essayFinished, setEssayFinished] = useState(false);

  // 3. JLPT N5 Lesson Exam States (Kì thi đề thi N5 JLPT của bài)
  const [jlptQuestions, setJlptQuestions] = useState<{
    type: "moji-goi" | "bunpou" | "dokkai";
    questionText: string;
    passage?: string;
    passageTranslation?: string;
    options: string[];
    correctStr: string;
    explanation: string;
  }[]>([]);
  const [jlptIndex, setJlptIndex] = useState(0);
  const [jlptSelectedAns, setJlptSelectedAns] = useState<string | null>(null);
  const [jlptAnswered, setJlptAnswered] = useState(false);
  const [jlptIsCorrect, setJlptIsCorrect] = useState(false);
  const [jlptScore, setJlptScore] = useState(0);
  const [jlptFinished, setJlptFinished] = useState(false);

  // --- Choukai (Listening) States ---
  const [choukaiIndex, setChoukaiIndex] = useState(0);
  const [choukaiAnswered, setChoukaiAnswered] = useState(false);
  const [choukaiSelectedAns, setChoukaiSelectedAns] = useState<string | null>(null);
  const [choukaiIsCorrect, setChoukaiIsCorrect] = useState(false);
  const [choukaiScore, setChoukaiScore] = useState(0);

  // --- Kaiwa (Conversation Roleplay) States ---
  // Role play: "none" | "A" | "B"
  const [rolePlayMode, setRolePlayMode] = useState<"none" | "A" | "B">("none");
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isDialoguePlayingAll, setIsDialoguePlayingAll] = useState(false);

  // --- Reading (Đọc Topic) States ---
  const [showReadingTranslation, setShowReadingTranslation] = useState(false);
  const [readingAnswered, setReadingAnswered] = useState(false);
  const [readingSelectedAns, setReadingSelectedAns] = useState<string | null>(null);
  const [readingIsCorrect, setReadingIsCorrect] = useState(false);

  const triggerProgressSync = async (uName: string) => {
    try {
      setSyncStatus("syncing");
      const localUnlocked = getUnlockedLessons();
      const localCompleted = getCompletedLessons();
      const cloudProgress = await loadProgressFromCloud("user_" + uName.toLowerCase());
      
      if (cloudProgress) {
        const mergedUnlocked = Array.from(
          new Set([...localUnlocked, ...cloudProgress.unlockedLessons])
        ).sort((a, b) => a - b);
        
        const mergedCompleted = Array.from(
          new Set([...localCompleted, ...cloudProgress.completedLessons])
        ).sort((a, b) => a - b);

        localStorage.setItem("japanese_course_unlocked_lessons", JSON.stringify(mergedUnlocked));
        localStorage.setItem("japanese_course_completed_lessons", JSON.stringify(mergedCompleted));
        
        setUnlockedLessons(mergedUnlocked);
        setCompletedLessons(mergedCompleted);

        await saveProgressToCloud("user_" + uName.toLowerCase(), mergedUnlocked, mergedCompleted);
        setSyncStatus("synced");
      } else {
        await saveProgressToCloud("user_" + uName.toLowerCase(), localUnlocked, localCompleted);
        setSyncStatus("synced");
      }
    } catch (err) {
      console.error("Firebase progress sync failed:", err);
      setSyncStatus("failed");
    }
  };

  // Load progress initially and sync with Firebase + fetch/seed lessons
  useEffect(() => {
    const localUnlocked = getUnlockedLessons();
    const localCompleted = getCompletedLessons();
    
    setUnlockedLessons(localUnlocked);
    setCompletedLessons(localCompleted);

    const loadLessonsAndSync = async () => {
      // 1. Fetch lessons from Firestore (Using local default lessons as fallback if empty/offline without overwriting the Cloud)
      try {
        setLessonsLoading(true);
        const cloudLessons = await getLessonsFromCloud();
        if (cloudLessons && cloudLessons.length > 0) {
          setLessons(cloudLessons.sort((a, b) => a.id - b.id));
        } else {
          // Keep local default lessons in UI but do NOT write/overwrite anything to Cloud automatically
          setLessons(N5_LESSONS);
        }
      } catch (e) {
        console.error("Using local lessons fallback due to Firestore load failure:", e);
        // Keeps the default state (N5_LESSONS)
      } finally {
        setLessonsLoading(false);
      }

      // 2. Sync progress only if logged in
      if (isLoggedIn && username) {
        await triggerProgressSync(username);
      }

      // 3. Sync/Seed local vocabulary list to Firestore casual_vocab
      try {
        await seedCasualVocabToCloud(JAPANESE_VOCABULARY);
      } catch (e) {
        console.error("Could not sync local vocabulary list to Firestore:", e);
      }
    };

    loadLessonsAndSync();
  }, [isLoggedIn, username]);

  const handleLevelChange = (lvl: "N5" | "N4" | "N3" | "N2" | "N1") => {
    sounds.playClick();
    setActiveLevel(lvl);
  };

  const handleLogout = () => {
    sounds.playClick();
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("japanese_course_is_logged_in");
      localStorage.removeItem("japanese_course_username");
      localStorage.removeItem("japanese_course_unlocked_lessons");
      localStorage.removeItem("japanese_course_completed_lessons");
      setIsLoggedIn(false);
      setUsername(null);
      setSelectedLesson(null);
      setUnlockedLessons([0]);
      setCompletedLessons([]);
      window.location.reload();
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    
    const uName = loginUsername.trim();
    const pWord = loginPassword.trim();
    
    if (!uName || !pWord) {
      setAuthModalError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      sounds.playFailure();
      return;
    }
    
    if (uName.length < 3) {
      setAuthModalError("Tên đăng nhập phải chứa ít nhất 3 ký tự.");
      sounds.playFailure();
      return;
    }

    if (pWord.length < 4) {
      setAuthModalError("Mật khẩu phải chứa ít nhất 4 ký tự.");
      sounds.playFailure();
      return;
    }

    try {
      setIsAuthLoading(true);
      setAuthModalError(null);
      setAuthModalSuccess(null);

      if (isRegisterMode) {
        await registerCustomAccount(uName, pWord);
        setAuthModalSuccess("Đăng ký tài khoản thành công! Đang đăng nhập...");
        sounds.playSuccess();
        
        setTimeout(async () => {
          try {
            await loginUserSuccess(uName);
          } catch (err: any) {
            setAuthModalError(err.message || "Có lỗi xảy ra khi tự động đăng nhập.");
            sounds.playFailure();
          }
        }, 1500);
      } else {
        await verifyCustomAccount(uName, pWord);
        setAuthModalSuccess("Đăng nhập thành công!");
        sounds.playSuccess();
        await loginUserSuccess(uName);
      }
    } catch (err: any) {
      setAuthModalError(err.message || "Thao tác thất bại. Vui lòng thử lại.");
      sounds.playFailure();
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginUserSuccess = async (uName: string) => {
    localStorage.setItem("japanese_course_is_logged_in", "true");
    localStorage.setItem("japanese_course_username", uName);
    setIsLoggedIn(true);
    setUsername(uName);
    
    // Sync progress immediately
    await triggerProgressSync(uName);
    
    // Close modal
    setIsLoginModalOpen(false);
    
    // Reset form fields
    setLoginUsername("");
    setLoginPassword("");
    setAuthModalError(null);
    setAuthModalSuccess(null);
    
    // Auto-enter the saved lesson if clicked earlier
    if (lessonToEnterAfterLogin) {
      setSelectedLesson(lessonToEnterAfterLogin);
      setStudySubMode("vocab");
      setFlashcardIndex(0);
      setIsCardFlipped(false);
      setLessonToEnterAfterLogin(null);
    }
  };

  const enterLesson = (lesson: Lesson) => {
    sounds.playClick();
    
    if (!isLoggedIn) {
      setLessonToEnterAfterLogin(lesson);
      setAuthModalError(null);
      setAuthModalSuccess(null);
      setIsLoginModalOpen(true);
      return;
    }

    setSelectedLesson(lesson);
    setStudySubMode("vocab");
    setFlashcardIndex(0);
    setIsCardFlipped(false);
    
    // Reset Vocab edit states
    setIsEditingVocab(false);
    setEditingWordIndex(null);
    setMovingWordIndex(null);
    setMoveTargetLessonId(null);
    
    // Reset Practice / Exam states
    setExamQuestions([]);
    setEssayQuestions([]);
    setJlptQuestions([]);
    setExamFinished(false);
    setEssayFinished(false);
    setJlptFinished(false);

    // Reset Choukai
    setChoukaiIndex(0);
    setChoukaiAnswered(false);
    setChoukaiSelectedAns(null);
    setChoukaiScore(0);

    // Reset Kaiwa
    setCurrentDialogueIndex(0);
    setRolePlayMode("none");
    setIsDialoguePlayingAll(false);

    // Reset Reading
    setShowReadingTranslation(false);
    setReadingAnswered(false);
    setReadingSelectedAns(null);
  };

  const handleBackToSyllabus = () => {
    sounds.playClick();
    setSelectedLesson(null);
    setIsEditingVocab(false);
    setEditingWordIndex(null);
    setMovingWordIndex(null);
    setMoveTargetLessonId(null);
  };

  const handleImportJson = async () => {
    try {
      setImportError(null);
      setImportSuccess(null);
      setIsImporting(true);

      let input = importJsonText.trim();
      if (!input) {
        throw new Error("Vui lòng nhập dữ liệu JSON.");
      }

      // 1. Khử khối mã Markdown (```json ... ``` hoặc ``` ... ```) nếu người dùng copy thừa
      const codeBlockMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        input = codeBlockMatch[1].trim();
      }

      // 2. Chuyển đổi ngoặc kép/đơn thông minh (smart quotes) sang ngoặc tiêu chuẩn
      input = input
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

      // 3. Tìm và trích xuất chuỗi JSON nằm giữa cặp ngoặc nhọn đầu tiên và cuối cùng
      const firstCurly = input.indexOf('{');
      const lastCurly = input.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        input = input.substring(firstCurly, lastCurly + 1);
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(input);
      } catch (e: any) {
        throw new Error(`Định dạng JSON không hợp lệ: ${e.message}. Hãy chắc chắn rằng bạn không có dấu phẩy dư thừa ở phần tử cuối cùng.`);
      }

      // Lọc và chuẩn hóa từ vựng
      const rawWords = parsedData.words || [];
      const validatedWords: VocabularyWord[] = [];
      for (let i = 0; i < rawWords.length; i++) {
        const item = rawWords[i];
        if (!item.japanese || !item.vietnameseMeaning) {
          throw new Error(`Từ vựng thứ ${i + 1} trong danh sách thiếu thuộc tính 'japanese' hoặc 'vietnameseMeaning'.`);
        }
        validatedWords.push({
          japanese: String(item.japanese).trim(),
          romaji: item.romaji ? String(item.romaji).trim() : "",
          vietnameseMeaning: String(item.vietnameseMeaning).trim(),
          englishMeaning: item.englishMeaning ? String(item.englishMeaning).trim() : ""
        });
      }

      if (importScope === "existing") {
        const targetLesson = lessons.find(les => les.id === importTargetLessonId) || selectedLesson || lessons[0];
        if (!targetLesson) {
          throw new Error("Không tìm thấy bài học đích để import từ vựng.");
        }

        // Lọc các từ vựng trùng lặp đã tồn tại sẵn trong bài học dựa trên thuộc tính 'japanese'
        const existingJapanese = new Set(targetLesson.words.map(w => w.japanese));
        const uniqueNewWords = validatedWords.filter(w => !existingJapanese.has(w.japanese));

        // Kiểm tra xem có phần ngữ pháp (grammar) cần import bổ sung vào bài học không
        let updatedGrammar = targetLesson.grammar;
        let isGrammarUpdated = false;
        if (parsedData.grammar && typeof parsedData.grammar === "object") {
          const g = parsedData.grammar;
          updatedGrammar = {
            pattern: g.pattern || targetLesson.grammar?.pattern || "N/A",
            explanation: g.explanation || targetLesson.grammar?.explanation || "Chưa có giải thích",
            example: g.example || targetLesson.grammar?.example || "Chưa có ví dụ",
            exampleMeaning: g.exampleMeaning || targetLesson.grammar?.exampleMeaning || "Chưa có nghĩa"
          };
          isGrammarUpdated = true;
        }

        if (uniqueNewWords.length === 0 && !isGrammarUpdated) {
          throw new Error("Không phát hiện từ vựng mới hoặc thông tin ngữ pháp nào mới để tích hợp.");
        }

        const updatedWords = [...targetLesson.words, ...uniqueNewWords];
        const updatedLesson = {
          ...targetLesson,
          words: updatedWords,
          grammar: updatedGrammar
        };

        const updatedLessons = lessons.map(les => les.id === targetLesson.id ? updatedLesson : les);

        // Lưu toàn bộ cấu trúc bài học lên Firestore
        await seedLessonsToCloud(updatedLessons);

        // Cập nhật lại state cục bộ để UI phản ánh ngay
        setLessons(updatedLessons);
        if (selectedLesson && selectedLesson.id === targetLesson.id) {
          setSelectedLesson(updatedLesson);
        }
        
        let successMsg = `Đã tích hợp thành công ${uniqueNewWords.length} từ vựng mới vào bài học "${targetLesson.title}"`;
        if (isGrammarUpdated) {
          successMsg += " và cập nhật cấu trúc ngữ pháp";
        }
        successMsg += " đồng bộ lên đám mây Firestore!";
        setImportSuccess(successMsg);
        setImportJsonText("");
        sounds.playSuccess();
      } else {
        // Tạo CHỦ ĐỀ / BÀI HỌC mới hoàn toàn
        const finalTitle = (parsedData.title || newLessonTitle || "").trim();
        if (!finalTitle) {
          throw new Error("Vui lòng cung cấp Tên chủ đề / Tên bài học mới (khai báo thuộc tính 'title' trong JSON hoặc điền tại ô nhập liệu).");
        }

        const finalDesc = (parsedData.description || newLessonDesc || "Học từ vựng và cấu trúc ngữ pháp thuộc chủ đề tự chọn mới.").trim();
        const finalLevel = (parsedData.level || newLessonLevel || "N5") as any;
        const finalCategory = (parsedData.category || newLessonCategory || "Chủ đề tự chọn").trim();

        // Xử lý Ngữ pháp đi kèm
        const g = parsedData.grammar || {};
        const finalGrammar = {
          pattern: g.pattern || newLessonGrammarPattern || "N/A",
          explanation: g.explanation || newLessonGrammarExplanation || "Chưa có giải thích",
          example: g.example || newLessonGrammarExample || "Chưa có ví dụ",
          exampleMeaning: g.exampleMeaning || newLessonGrammarExampleMeaning || "Chưa có nghĩa"
        };

        // Tìm ID lớn nhất để tăng tự động
        const maxId = lessons.reduce((max, les) => les.id > max ? les.id : max, 0);
        const newId = maxId + 1;

        const newLesson: Lesson = {
          id: newId,
          title: finalTitle,
          description: finalDesc,
          level: finalLevel,
          category: finalCategory,
          grammar: finalGrammar,
          words: validatedWords
        };

        const updatedLessons = [...lessons, newLesson].sort((a, b) => a.id - b.id);

        // Lưu lên đám mây Firestore
        await seedLessonsToCloud(updatedLessons);

        // Tự động mở khóa chủ đề này ngay lập tức để học viên học được luôn
        const nextUnlocked = Array.from(new Set([...unlockedLessons, newId])).sort((a, b) => a - b);
        setUnlockedLessons(nextUnlocked);
        try {
          localStorage.setItem("japanese_course_unlocked_lessons", JSON.stringify(nextUnlocked));
        } catch (e) {
          console.error("Lỗi lưu trữ tiến trình mở khóa:", e);
        }

        // Cập nhật state cục bộ
        setLessons(updatedLessons);
        setSelectedLesson(newLesson);
        setStudySubMode("vocab");

        setImportSuccess(`Đã tạo thành công chủ đề mới "${newLesson.title}" (Bài ${newId + 1}) với ${validatedWords.length} từ vựng và Ngữ pháp! Đang mở bài học để bạn khám phá...`);
        
        // Reset các trường
        setImportJsonText("");
        setNewLessonTitle("");
        setNewLessonDesc("");
        setNewLessonCategory("");
        setNewLessonGrammarPattern("");
        setNewLessonGrammarExplanation("");
        setNewLessonGrammarExample("");
        setNewLessonGrammarExampleMeaning("");

        sounds.playSuccess();
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSingleWord = async () => {
    sounds.playClick();
    setImportError(null);
    setImportSuccess(null);

    const jp = singleJapanese.trim();
    const romaji = singleRomaji.trim();
    const vn = singleVietnamese.trim();

    if (!jp) {
      setImportError("Vui lòng nhập từ tiếng Nhật (Hiragana, Katakana, Kanji hoặc Romaji).");
      return;
    }
    if (!vn) {
      setImportError("Vui lòng nhập nghĩa tiếng Việt.");
      return;
    }

    setIsImporting(true);
    try {
      const targetLesson = lessons.find(les => les.id === importTargetLessonId) || selectedLesson || lessons[0];
      if (!targetLesson) {
        throw new Error("Không tìm thấy bài học đích để import từ vựng.");
      }

      // Check duplicate
      const exists = targetLesson.words.some(w => w.japanese.trim() === jp);
      if (exists) {
        throw new Error(`Từ vựng "${jp}" đã tồn tại trong bài học "${targetLesson.title}".`);
      }

      const newWord: VocabularyWord = {
        japanese: jp,
        romaji: romaji,
        vietnameseMeaning: vn
      };

      const updatedWords = [...targetLesson.words, newWord];
      const updatedLesson = {
        ...targetLesson,
        words: updatedWords
      };

      const updatedLessons = lessons.map(les => les.id === targetLesson.id ? updatedLesson : les);

      // Save to Firestore
      await seedLessonsToCloud(updatedLessons);

      // Update state
      setLessons(updatedLessons);
      if (selectedLesson && selectedLesson.id === targetLesson.id) {
        setSelectedLesson(updatedLesson);
      }

      setImportSuccess(`Đã thêm thành công từ vựng "${jp}" vào bài học "${targetLesson.title}" và đồng bộ lên đám mây Firestore!`);
      setSingleJapanese("");
      setSingleRomaji("");
      setSingleVietnamese("");
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setIsImporting(false);
    }
  };

  // --- Vocabulary Word Management Handlers ---
  const handleUpdateVocabWord = async (wIdx: number) => {
    if (!selectedLesson) return;
    sounds.playClick();
    
    if (!editJp.trim() || !editVn.trim()) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc (tiếng Nhật và nghĩa tiếng Việt).");
      return;
    }
    
    try {
      const updatedWord: VocabularyWord = {
        ...selectedLesson.words[wIdx],
        japanese: editJp.trim(),
        romaji: editRomaji.trim(),
        vietnameseMeaning: editVn.trim(),
        englishMeaning: editEn.trim() || undefined
      };
      
      const updatedWords = selectedLesson.words.map((w, idx) => idx === wIdx ? updatedWord : w);
      const updatedLesson = {
        ...selectedLesson,
        words: updatedWords
      };
      
      const updatedLessons = lessons.map(les => les.id === selectedLesson.id ? updatedLesson : les);
      
      await seedLessonsToCloud(updatedLessons);
      
      setLessons(updatedLessons);
      setSelectedLesson(updatedLesson);
      setEditingWordIndex(null);
      await saveCategorizedVocabToCloud(selectedLesson.id, []);
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Đã xảy ra lỗi khi lưu từ vựng: " + (err.message || String(err)));
    }
  };

  const handleDeleteVocabWord = async (wIdx: number) => {
    if (!selectedLesson) return;
    sounds.playClick();
    
    try {
      const updatedWords = selectedLesson.words.filter((_, idx) => idx !== wIdx);
      const updatedLesson = {
        ...selectedLesson,
        words: updatedWords
      };
      
      const updatedLessons = lessons.map(les => les.id === selectedLesson.id ? updatedLesson : les);
      
      await seedLessonsToCloud(updatedLessons);
      
      setLessons(updatedLessons);
      setSelectedLesson(updatedLesson);
      setDeletingWordIndex(null);
      await saveCategorizedVocabToCloud(selectedLesson.id, []);
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Đã xảy ra lỗi khi xóa từ vựng: " + (err.message || String(err)));
    }
  };

  const handleMoveVocabWord = async (wIdx: number) => {
    if (!selectedLesson || moveTargetLessonId === null) return;
    sounds.playClick();
    
    try {
      const wordToMove = selectedLesson.words[wIdx];
      const targetLesson = lessons.find(l => l.id === moveTargetLessonId);
      if (!targetLesson) {
        alert("Không tìm thấy bài học đích để di chuyển.");
        return;
      }
      
      // Remove from current lesson
      const updatedCurrentWords = selectedLesson.words.filter((_, idx) => idx !== wIdx);
      const updatedCurrentLesson = {
        ...selectedLesson,
        words: updatedCurrentWords
      };
      
      // Add to target lesson
      const updatedTargetWords = [...targetLesson.words, wordToMove];
      const updatedTargetLesson = {
        ...targetLesson,
        words: updatedTargetWords
      };
      
      // Update the main lessons list
      const updatedLessons = lessons.map(l => {
        if (l.id === selectedLesson.id) return updatedCurrentLesson;
        if (l.id === targetLesson.id) return updatedTargetLesson;
        return l;
      });
      
      await seedLessonsToCloud(updatedLessons);
      
      setLessons(updatedLessons);
      setSelectedLesson(updatedCurrentLesson);
      setMovingWordIndex(null);
      setMoveTargetLessonId(null);
      await saveCategorizedVocabToCloud(selectedLesson.id, []);
      if (moveTargetLessonId !== null) await saveCategorizedVocabToCloud(moveTargetLessonId, []);
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Đã xảy ra lỗi khi di chuyển từ vựng: " + (err.message || String(err)));
    }
  };

  const handleCategorizeByAi = async () => {
    if (!selectedLesson) return;
    sounds.playClick();
    setIsCategorizingByAi(true);
    setAiCategorizeError(null);
    
    try {
      const response = await fetch("/api/vocab/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          words: selectedLesson.words,
          model: selectedAiModel
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể phân loại từ vựng bằng AI.");
      }
      
      const data = await response.json();
      if (data.categorized && Array.isArray(data.categorized)) {
        await saveCategorizedVocabToCloud(selectedLesson.id, data.categorized);
        const updatedLesson = { ...selectedLesson, categorizedVocab: data.categorized };
        setSelectedLesson(updatedLesson);
        setLessons(lessons.map(l => l.id === selectedLesson.id ? updatedLesson : l));
        
        // Auto-update model to the one that succeeded if fallback occurred
        if (data.activeModel && data.activeModel !== selectedAiModel) {
          setSelectedAiModel(data.activeModel);
        }
        
        sounds.playSuccess();
      } else {
        throw new Error("Phản hồi từ AI không đúng định dạng mong đợi.");
      }
    } catch (err: any) {
      console.error(err);
      setAiCategorizeError(err.message || String(err));
      sounds.playFailure();
    } finally {
      setIsCategorizingByAi(false);
    }
  };

  const handleTranslateEnglishByAi = async () => {
    if (!selectedLesson) return;
    sounds.playClick();
    setIsTranslatingEn(true);
    setTranslationError(null);
    setTranslationSuccess(null);
    
    try {
      const response = await fetch("/api/vocab/translate-english", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          words: selectedLesson.words,
          model: selectedAiModel
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể dịch từ vựng bằng AI.");
      }
      
      const data = await response.json();
      if (data.words && Array.isArray(data.words)) {
        const updatedLesson = { 
          ...selectedLesson, 
          words: data.words,
          categorizedVocab: undefined
        };
        const updatedLessons = lessons.map(l => l.id === selectedLesson.id ? updatedLesson : l);
        
        await seedLessonsToCloud(updatedLessons);
        await saveCategorizedVocabToCloud(selectedLesson.id, []);
        
        setSelectedLesson(updatedLesson);
        setLessons(updatedLessons);
        
        if (data.activeModel && data.activeModel !== selectedAiModel) {
          setSelectedAiModel(data.activeModel);
        }
        
        if (data.updatedCount > 0) {
          setTranslationSuccess(`Bổ sung thành công ${data.updatedCount} nghĩa tiếng Anh bằng AI (${data.activeModel})!`);
        } else {
          setTranslationSuccess("Toàn bộ từ vựng đã có nghĩa tiếng Anh đầy đủ.");
        }
        sounds.playSuccess();
      } else {
        throw new Error("Phản hồi dịch thuật từ AI không đúng định dạng.");
      }
    } catch (err: any) {
      console.error(err);
      setTranslationError(err.message || String(err));
      sounds.playFailure();
    } finally {
      setIsTranslatingEn(false);
    }
  };


  // Generate Choukai Listening Question
  const currentChoukaiQuestion = useMemo(() => {
    if (!selectedLesson) return null;
    
    // Explicit content for Lesson 0 and Lesson 1
    if (selectedLesson.id === 0) {
      const questions = [
        { phrase: "ありがとう", options: ["Cảm ơn", "Chào buổi sáng", "Con mèo", "Món Sushi"], correct: "Cảm ơn" },
        { phrase: "おはよう", options: ["Chúc ngủ ngon", "Chào buổi sáng", "Bạn bè", "Nước uống"], correct: "Chào buổi sáng" },
        { phrase: "ねこ", options: ["Con chó", "Hoa anh đào", "Con mèo", "Con cá"], correct: "Con mèo" }
      ];
      return questions[choukaiIndex] || questions[0];
    } else if (selectedLesson.id === 1) {
      const questions = [
        { phrase: "はじめまして", options: ["Tôi là học sinh", "Rất vui được gặp bạn", "Bác sĩ", "Chào buổi sáng"], correct: "Rất vui được gặp bạn" },
        { phrase: "がくせい", options: ["Giáo viên", "Bác sĩ", "Học sinh, sinh viên", "Nhân viên công ty"], correct: "Học sinh, sinh viên" },
        { phrase: "いしゃ", options: ["Trường đại học", "Bệnh viện", "Bác sĩ", "Tôi"], correct: "Bác sĩ" }
      ];
      return questions[choukaiIndex] || questions[0];
    } else {
      // Automatic generator based on vocab
      const word = selectedLesson.words[choukaiIndex % selectedLesson.words.length];
      if (!word) return null;

      const otherWords = selectedLesson.words
        .filter(w => w.japanese !== word.japanese)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const options = [word.vietnameseMeaning, ...otherWords.map(o => o.vietnameseMeaning)].sort(() => 0.5 - Math.random());

      return {
        phrase: word.japanese,
        options,
        correct: word.vietnameseMeaning
      };
    }
  }, [choukaiIndex, selectedLesson]);

  // Handle Choukai Selection
  const handleSelectChoukai = (ans: string) => {
    if (choukaiAnswered || !currentChoukaiQuestion) return;
    const isCorrect = ans === currentChoukaiQuestion.correct;
    setChoukaiSelectedAns(ans);
    setChoukaiAnswered(true);
    setChoukaiIsCorrect(isCorrect);
    if (isCorrect) {
      sounds.playSuccess();
      setChoukaiScore(prev => prev + 1);
    } else {
      sounds.playFailure();
    }
  };

  const handleNextChoukai = () => {
    sounds.playClick();
    setChoukaiAnswered(false);
    setChoukaiSelectedAns(null);
    if (choukaiIndex < 2) {
      setChoukaiIndex(prev => prev + 1);
    } else {
      // Completed, loop back or reset
      setChoukaiIndex(0);
      setChoukaiScore(0);
    }
  };

  // Dialogue lines mapping
  const currentDialogueLines = useMemo(() => {
    if (!selectedLesson) return [];
    if (selectedLesson.id === 0) {
      return [
        { speaker: "Tanaka", voice: "こんにちは！", romaji: "Konnichiwa!", meaning: "Xin chào!" },
        { speaker: "Miller", voice: "こんにちは！おげんきですか。", romaji: "Konnichiwa! Ogenki desu ka.", meaning: "Xin chào! Bạn khỏe không?" },
        { speaker: "Tanaka", voice: "はい、げんきです。ありがとう。", romaji: "Hai, genki desu. Arigatou.", meaning: "Vâng, tôi khỏe. Xin cảm ơn." }
      ];
    } else if (selectedLesson.id === 1) {
      return [
        { speaker: "Miller", voice: "はじめまして。ミラー です。アメリカから きました。", romaji: "Hajimemashite. Miraa desu. Amerika kara kimashita.", meaning: "Rất vui được gặp anh/chị. Tôi là Miller. Tôi đến từ Mỹ." },
        { speaker: "Santos", voice: "はじめまして。サントス です。がくせい です。", romaji: "Hajimemashite. Santosu desu. Gakusei desu.", meaning: "Rất vui được gặp anh/chị. Tôi là Santos. Tôi là học sinh." },
        { speaker: "Miller", voice: "どうぞ よろしく おねがいします。", romaji: "Douzo yoroshiku onegaishimasu.", meaning: "Rất mong được anh/chị giúp đỡ." },
        { speaker: "Santos", voice: "こちらこそ よろしく おねがいします。", romaji: "Kochirakoso yoroshiku onegaishimasu.", meaning: "Chính tôi mới là người mong được giúp đỡ." }
      ];
    } else {
      // Dynamically generate conversations for other lessons
      const w1 = selectedLesson.words[0] || { japanese: "これ", vietnameseMeaning: "Cái này" };
      const w2 = selectedLesson.words[1] || { japanese: "それ", vietnameseMeaning: "Cái đó" };
      return [
        { speaker: "Người A", voice: `これは ${w1.japanese} ですか。`, romaji: `Kore wa ${w1.romaji || w1.japanese} desu ka.`, meaning: `Đây là ${w1.vietnameseMeaning.toLowerCase()} phải không?` },
        { speaker: "Người B", voice: `いいえ、${w1.japanese} では ありません。${w2.japanese} です。`, romaji: `Iie, ${w1.romaji || w1.japanese} dewa arimasen. ${w2.romaji || w2.japanese} desu.`, meaning: `Không, không phải là ${w1.vietnameseMeaning.toLowerCase()}. Là ${w2.vietnameseMeaning.toLowerCase()} đấy.` },
        { speaker: "Người A", voice: "あ、そうですか。ありがとうございます。", romaji: "A, sou desu ka. Arigatou gozaimasu.", meaning: "À, ra vậy ạ. Xin chân thành cảm ơn." }
      ];
    }
  }, [selectedLesson]);

  // Auto Conversation playback simulation
  useEffect(() => {
    if (!isDialoguePlayingAll || currentDialogueIndex >= currentDialogueLines.length) {
      setIsDialoguePlayingAll(false);
      return;
    }

    const currentLine = currentDialogueLines[currentDialogueIndex];
    const isUserTurn = (rolePlayMode === "A" && currentLine.speaker.includes("A") || currentLine.speaker === "Tanaka" && rolePlayMode === "A" || currentLine.speaker === "Miller" && rolePlayMode === "A") ||
                     (rolePlayMode === "B" && currentLine.speaker.includes("B") || currentLine.speaker === "Santos" && rolePlayMode === "B" || currentLine.speaker === "Miller" && rolePlayMode === "B");

    if (isUserTurn) {
      // Pause automatic stream for user speaking practice
      return;
    }

    // Speak line automatically
    speakJapanese(currentLine.voice);

    const timer = setTimeout(() => {
      setCurrentDialogueIndex(prev => prev + 1);
    }, 4500);

    return () => clearTimeout(timer);
  }, [currentDialogueIndex, isDialoguePlayingAll, rolePlayMode, currentDialogueLines]);

  const handleDialogueNextStep = () => {
    sounds.playClick();
    if (currentDialogueIndex < currentDialogueLines.length - 1) {
      const nextLine = currentDialogueLines[currentDialogueIndex + 1];
      setCurrentDialogueIndex(prev => prev + 1);
      
      const isNextUserTurn = (rolePlayMode === "A" && nextLine.speaker.includes("A") || nextLine.speaker === "Tanaka" && rolePlayMode === "A" || nextLine.speaker === "Miller" && rolePlayMode === "A") ||
                             (rolePlayMode === "B" && nextLine.speaker.includes("B") || nextLine.speaker === "Santos" && rolePlayMode === "B" || nextLine.speaker === "Miller" && rolePlayMode === "B");
      
      if (!isNextUserTurn) {
        speakJapanese(nextLine.voice);
      }
    } else {
      // Finished conversation, wrap back to start
      setCurrentDialogueIndex(0);
      setIsDialoguePlayingAll(false);
    }
  };

  // Reading Topic Mapping
  const currentReadingTopic = useMemo(() => {
    if (!selectedLesson) return null;
    if (selectedLesson.id === 0) {
      return {
        title: "わたしの ねこ",
        content: "おはようございます。これは わたし の うち です。うちに いぬ と ねこ が あります。いぬ は げんき です。ねこ は とても かわいい です。ありがとう。",
        vietnamese: "Chào buổi sáng. Đây là nhà của tôi. Trong nhà có nuôi chó và mèo. Chú chó thì vô cùng khỏe mạnh. Còn chú mèo thì cực kì đáng yêu. Xin cảm ơn.",
        question: "うちに なに が ありますか。(Trong nhà nuôi con gì?)",
        options: ["いぬ と ねこ", "さかな", "すし", "ともだち"],
        correct: "いぬ と ねこ",
        explanation: "Trong bài viết có câu: うちに いぬ と ねこ が あります (Trong nhà có nuôi chó và mèo)."
      };
    } else if (selectedLesson.id === 1) {
      return {
        title: "はじめまして (Lần đầu gặp gỡ)",
        content: "はじめまして。わたしは ヌエン です。ベトナムから きました。がくせい です。２2さい です。あのひとは ミラーさん です。ミラーさんは アメリカじん です。かいしゃいん です。よろしく おねがいします。",
        vietnamese: "Rất vui được gặp các bạn. Tôi tên là Nguyen. Tôi đến từ Việt Nam. Tôi là học sinh. Tôi 22 tuổi. Người đằng kia là anh Miller. Anh Miller là người Mỹ. Anh ấy là nhân viên văn phòng. Rất mong được giúp đỡ.",
        question: "ヌエンさんは なんさい ですか。(Nguyen bao nhiêu tuổi?)",
        options: ["２０さい", "２２さい", "２５さい", "３０さい"],
        correct: "２２さい",
        explanation: "Trong bài viết, Nguyen tự giới thiệu: ２2さい です (Tôi 22 tuổi)."
      };
    } else {
      // Dynamic fallback reading logic
      const w1 = selectedLesson.words[0] || { japanese: "これ", vietnameseMeaning: "Cái này" };
      const w2 = selectedLesson.words[1] || { japanese: "それ", vietnameseMeaning: "Cái đó" };
      return {
        title: `Học nói về ${w1.vietnameseMeaning}`,
        content: `わたしは ${w1.japanese} が すきです。これは ${w1.japanese} です。とても おもしろい です。あなたは ${w2.japanese} です。よろしく。`,
        vietnamese: `Tôi vô cùng thích ${w1.vietnameseMeaning.toLowerCase()}. Đây chính là ${w1.vietnameseMeaning.toLowerCase()}. Thật sự rất thú vị phải không. Còn bạn chính là ${w2.vietnameseMeaning.toLowerCase()}. Xin giúp đỡ.`,
        question: `Tác giả yêu thích cái gì?`,
        options: [w1.vietnameseMeaning, w2.vietnameseMeaning, "Cả hai", "Không có cái nào"],
        correct: w1.vietnameseMeaning,
        explanation: `Dòng đầu tiên ghi rõ tác giả thích ${w1.japanese} (${w1.vietnameseMeaning.toLowerCase()}).`
      };
    }
  }, [selectedLesson]);

  const handleSelectReadingOption = (ans: string) => {
    if (readingAnswered || !currentReadingTopic) return;
    const isCorrect = ans === currentReadingTopic.correct;
    setReadingSelectedAns(ans);
    setReadingAnswered(true);
    setReadingIsCorrect(isCorrect);
    sounds.playClick();
    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playFailure();
    }
  };

  // --- Exam Unlocking Actions ---
  const handlePassLessonExam = () => {
    if (!selectedLesson) return;
    const nextLevelUnlockId = selectedLesson.id + 1;
    const updatedUnlocked = saveUnlockLesson(nextLevelUnlockId);
    const updatedCompleted = saveCompleteLesson(selectedLesson.id);
    setUnlockedLessons(updatedUnlocked);
    setCompletedLessons(updatedCompleted);

    if (isLoggedIn && username) {
      setSyncStatus("syncing");
      saveProgressToCloud("user_" + username.toLowerCase(), updatedUnlocked, updatedCompleted)
        .then((success) => {
          setSyncStatus(success ? "synced" : "failed");
        })
        .catch(() => setSyncStatus("failed"));
    }
  };

  // 1. Vocabulary MCQ Exam Handlers
  const startVocabExam = () => {
    if (!selectedLesson) return;
    sounds.playClick();
    
    const shuffledWords = [...selectedLesson.words].sort(() => Math.random() - 0.5);
    const craftedQuestions = shuffledWords.map((word) => {
      const type = Math.random() > 0.5 ? "vn-to-jp" : "jp-to-vn";
      let options: string[] = [];
      let correctStr = "";

      if (type === "vn-to-jp") {
        correctStr = word.japanese;
        const fakeAnswers = generateConfusableAnswers(word.japanese, selectedLesson.words);
        options = [word.japanese, ...fakeAnswers].sort(() => Math.random() - 0.5);
      } else {
        correctStr = word.vietnameseMeaning;
        const otherMeanings = selectedLesson.words
          .filter(w => w.vietnameseMeaning !== word.vietnameseMeaning)
          .map(w => w.vietnameseMeaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        options = [word.vietnameseMeaning, ...otherMeanings].sort(() => Math.random() - 0.5);
      }

      return { word, options, correctStr, type };
    });

    setExamQuestions(craftedQuestions);
    setExamIndex(0);
    setExamSelectedAns(null);
    setExamAnswered(false);
    setExamScore(0);
    setExamFinished(false);
    setPracticeType("vocab-exam");
  };

  const handleSelectVocabOption = (option: string) => {
    if (examAnswered) return;
    const currentQuestion = examQuestions[examIndex];
    const checkIsCorrect = option === currentQuestion.correctStr;

    setExamSelectedAns(option);
    setExamAnswered(true);
    setExamIsCorrect(checkIsCorrect);

    if (checkIsCorrect) {
      sounds.playSuccess();
      setExamScore(prev => prev + 1);
    } else {
      sounds.playFailure();
    }
  };

  const handleNextVocabQuestion = () => {
    sounds.playClick();
    setExamAnswered(false);
    setExamSelectedAns(null);

    if (examIndex < examQuestions.length - 1) {
      setExamIndex(prev => prev + 1);
    } else {
      setExamFinished(true);
      const passingScore = Math.ceil(examQuestions.length * 0.8);
      if (examScore >= passingScore) {
        handlePassLessonExam();
      }
    }
  };

  // 2. Essay Exam Handlers
  const startEssayExam = () => {
    if (!selectedLesson) return;
    sounds.playClick();
    const questions = generateEssayQuestions(selectedLesson);
    setEssayQuestions(questions);
    setEssayIndex(0);
    setEssayInput("");
    setEssayAnswered(false);
    setEssayIsCorrect(false);
    setEssayScore(0);
    setEssayFinished(false);
    setPracticeType("essay-exam");
  };

  const handleSubmitEssay = () => {
    if (essayAnswered) return;
    sounds.playClick();
    
    const currentQuestion = essayQuestions[essayIndex];
    const cleanStr = (s: string) => 
      s.replace(/[\s。、.,?？・]+/g, "")
       .toLowerCase()
       .trim();

    const userAns = cleanStr(essayInput);
    const checkIsCorrect = currentQuestion.answers.some(ans => cleanStr(ans) === userAns);

    setEssayIsCorrect(checkIsCorrect);
    setEssayAnswered(true);

    if (checkIsCorrect) {
      sounds.playSuccess();
      setEssayScore(prev => prev + 1);
    } else {
      sounds.playFailure();
    }
  };

  const handleNextEssayQuestion = () => {
    sounds.playClick();
    setEssayAnswered(false);
    setEssayInput("");

    if (essayIndex < essayQuestions.length - 1) {
      setEssayIndex(prev => prev + 1);
    } else {
      setEssayFinished(true);
      if (essayScore >= 4) {
        handlePassLessonExam();
      }
    }
  };

  // 3. JLPT N5 Lesson Exam Handlers
  const startJlptExam = () => {
    if (!selectedLesson) return;
    sounds.playClick();
    const questions = generateJLPTQuestions(selectedLesson);
    setJlptQuestions(questions);
    setJlptIndex(0);
    setJlptSelectedAns(null);
    setJlptAnswered(false);
    setJlptIsCorrect(false);
    setJlptScore(0);
    setJlptFinished(false);
    setPracticeType("jlpt-exam");
  };

  const handleSelectJlptOption = (option: string) => {
    if (jlptAnswered) return;
    const currentQuestion = jlptQuestions[jlptIndex];
    const checkIsCorrect = option === currentQuestion.correctStr;

    setJlptSelectedAns(option);
    setJlptAnswered(true);
    setJlptIsCorrect(checkIsCorrect);

    if (checkIsCorrect) {
      sounds.playSuccess();
      setJlptScore(prev => prev + 1);
    } else {
      sounds.playFailure();
    }
  };

  const handleNextJlptQuestion = () => {
    sounds.playClick();
    setJlptAnswered(false);
    setJlptSelectedAns(null);

    if (jlptIndex < jlptQuestions.length - 1) {
      setJlptIndex(prev => prev + 1);
    } else {
      setJlptFinished(true);
      const passingScore = Math.ceil(jlptQuestions.length * 0.75);
      if (jlptScore >= passingScore) {
        handlePassLessonExam();
      }
    }
  };

  const exitExam = () => {
    sounds.playClick();
    setExamQuestions([]);
    setEssayQuestions([]);
    setJlptQuestions([]);
    setExamFinished(false);
    setEssayFinished(false);
    setJlptFinished(false);
  };



  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-xs min-h-[500px] w-full max-w-full min-w-0 overflow-hidden mobile-card-constraint">
      
      {/* Course Top Title & Actions Header */}
      {!lessonsLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-4xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">Khóa học của bạn</h3>
              <p className="text-sm font-black text-stone-850">Chương trình Sơ cấp Minna {activeLevel}</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* User Auth Info Indicator */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[9px] text-stone-400 font-bold font-mono uppercase tracking-wider leading-none">HỌC VIÊN</p>
                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1 justify-end mt-0.5">
                      <User className="w-3 h-3" /> @{username}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-rose-600 border border-stone-200 hover:border-rose-100 bg-stone-50 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-all"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setAuthModalError(null);
                    setAuthModalSuccess(null);
                    setIsLoginModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-xl transition-all shadow-4xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>

            {/* Three Dots Menu Container */}
            <div className="relative">
              <button
                onClick={() => { sounds.playClick(); setIsActionsMenuOpen(!isActionsMenuOpen); }}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-all shadow-4xs flex items-center justify-center"
                title="Thêm thao tác"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isActionsMenuOpen && (
                <>
                  {/* Overlay to close menu */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsActionsMenuOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-stone-200 rounded-xl shadow-md p-1.5 z-40 animate-fadeIn">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2.5 py-1.5 border-b border-stone-100 font-mono">Tùy chọn giáo trình</p>
                    
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsActionsMenuOpen(false);
                        setImportTargetLessonId(selectedLesson?.id ?? lessons[0]?.id ?? 0);
                        setImportSuccess(null);
                        setImportError(null);
                        setIsImportModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-all flex items-center gap-2"
                    >
                      <FileJson className="w-4 h-4 text-rose-500" />
                      <span>Import JSON từ vựng</span>
                    </button>

                    {selectedLesson && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsActionsMenuOpen(false);
                          setIsEditingVocab(!isEditingVocab);
                          setStudySubMode("vocab"); // Switch to vocab tab to edit
                          setEditingWordIndex(null);
                          setMovingWordIndex(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          isEditingVocab 
                            ? "bg-rose-50 text-rose-600 font-extrabold" 
                            : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                      >
                        <Edit3 className="w-4 h-4 text-rose-500" />
                        <span>{isEditingVocab ? "Hủy chỉnh sửa từ vựng" : "Chỉnh sửa từ vựng"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsActionsMenuOpen(false);
                        if (window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ học tập không? Thao tác này không thể hoàn tác.")) {
                          localStorage.removeItem("japanese_course_unlocked_lessons");
                          localStorage.removeItem("japanese_course_completed_lessons");
                          setUnlockedLessons([0]);
                          setCompletedLessons([]);
                          setSelectedLesson(null);
                          window.location.reload();
                        }
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>Đặt lại toàn bộ tiến trình</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {lessonsLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-stone-500 font-mono">Đang tải giáo trình từ Cloud...</p>
        </div>
      ) : !selectedLesson ? (
        <div className="py-6 space-y-6">
          {activeLevel !== "N5" ? (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <Lock className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-extrabold text-stone-850">Chương trình {activeLevel} đang phát triển</h3>
              <p className="text-xs text-stone-400 mt-2">
                Hãy thi đỗ các bài học trình độ <strong className="text-stone-700">JLPT N5</strong> bên dưới để chuẩn bị sẵn sàng mở khóa nội dung {activeLevel} nâng cao!
              </p>
              <button
                onClick={() => handleLevelChange("N5")}
                className="mt-5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-3xs flex items-center gap-1.5 mx-auto"
              >
                Học N5 Học phần Sơ cấp <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => {
                  const isUnlocked = unlockedLessons.includes(lesson.id);
                  const isStudying = unlockedLessons[unlockedLessons.length - 1] === lesson.id || (lesson.id === 0 && unlockedLessons.length === 1);
                  
                  return (
                    <motion.div
                      id={`lesson-card-${lesson.id}`}
                      key={lesson.id}
                      whileHover={isUnlocked ? { scale: 1.015, y: -2 } : {}}
                      className={`border rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                        isUnlocked 
                          ? "bg-white border-stone-200 hover:border-stone-350 shadow-3xs cursor-pointer" 
                          : "bg-stone-50 border-stone-200 opacity-75"
                      }`}
                      onClick={() => isUnlocked && enterLesson(lesson)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 font-mono font-bold">
                          {lesson.category}
                        </span>
                        
                        {isUnlocked ? (
                          completedLessons.includes(lesson.id) ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã xong
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                              <Unlock className="w-3.5 h-3.5" /> Học ngay
                            </span>
                          )
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-stone-400">
                            <Lock className="w-3.5 h-3.5" /> Đang khóa
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h3 className={`text-sm font-extrabold ${isUnlocked ? "text-stone-850" : "text-stone-500"}`}>
                          {lesson.title}
                        </h3>
                        <p className="text-[11.5px] text-stone-400 line-clamp-2 leading-relaxed">
                          {lesson.description}
                        </p>
                      </div>

                      <div className="border-t border-stone-100 mt-4 pt-3 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400 font-medium font-mono">
                          📚 {lesson.words.length} Từ vựng
                        </span>
                        
                        {isUnlocked ? (
                          completedLessons.includes(lesson.id) ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 hover:underline">
                              Học lại <ArrowRight className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5 hover:underline">
                              Vào học <ArrowRight className="w-3 h-3" />
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">
                            Vượt ải bài {lesson.id - 1} để mở
                          </span>
                        )}
                      </div>

                      {isStudying && isUnlocked && (
                        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-rose-500 rounded-l-2xl"></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Syllabus Progress Banner */}
              <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-500">
                    <Trophy className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-850">Lộ trình học tập Minna N5</h4>
                    <p className="text-[11px] text-stone-400">
                      Đã hoàn thành <strong className="text-emerald-600 font-extrabold">{completedLessons.length}</strong> / {lessons.length} bài học. (Đã mở {unlockedLessons.length})
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-48 bg-stone-200 h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* STUDY CLASSROOM (Sảnh học bài được chọn) */
        <div className="py-4 space-y-6 w-full max-w-full min-w-0 overflow-hidden">
          
          {/* Breadcrumb controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-150">
            <button
              id="back-to-syllabus-btn"
              onClick={handleBackToSyllabus}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              ← Trở về danh sách bài học
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-stone-400">Đang học:</span>
              <span className="text-xs font-extrabold text-stone-800 bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-4xs">
                {selectedLesson.title}
              </span>
            </div>
          </div>

          {/* Sub-modes Study Tab controls (Mỗi bài gồm 7 phần) */}
          <div className="w-full min-w-0 overflow-hidden border-b border-stone-200 layout-constraint">
            <div className="flex gap-1 overflow-x-auto shrink-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-stone-200 pb-1.5 snap-x snap-mandatory w-full max-w-full min-w-0 tabs-scroll-constraint">
              {[
                { id: "vocab", label: "Từ vựng", icon: BookMarked },
                { id: "flashcard", label: "Flashcard", icon: Sparkles },
                { id: "grammar", label: "Ngữ pháp", icon: Lightbulb },
                { id: "practice", label: "Bài tập & Thi", icon: Award },
                { id: "choukai", label: "Nghe Choukai", icon: Volume2 },
                { id: "kaiwa", label: "Hội thoại Kaiwa", icon: MessageSquare },
                { id: "reading", label: "Đọc topic", icon: BookOpenCheck },
              ].map((tab) => {
                const isActive = studySubMode === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { sounds.playClick(); setStudySubMode(tab.id as any); }}
                    className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 snap-start ${
                      isActive
                        ? "border-rose-600 text-rose-600 font-extrabold bg-rose-50/20"
                        : "border-transparent text-stone-400 hover:text-stone-700 hover:border-stone-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. TAB: TỪ VỰNG */}
          {studySubMode === "vocab" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-150">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-850 flex items-center gap-2 flex-wrap">
                    <span>Từ vựng chính của bài ({selectedLesson.words.length} từ)</span>
                    {isEditingVocab && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Chế độ chỉnh sửa</span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isEditingVocab 
                      ? "Nhấn vào các nút chức năng bên phải mỗi từ để sửa, xóa hoặc di chuyển sang bài khác." 
                      : "Bấm biểu tượng loa để nghe giọng đọc bản xứ."}
                  </p>
                </div>
                {isEditingVocab ? (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsEditingVocab(false);
                      setEditingWordIndex(null);
                      setMovingWordIndex(null);
                    }}
                    className="text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 shadow-4xs shrink-0 self-start sm:self-auto"
                  >
                    Hoàn thành
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 shadow-4xs shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setVocabViewMode("list");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        vocabViewMode === "list"
                          ? "bg-white text-rose-600 shadow-5xs font-extrabold"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" /> Danh sách gốc
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setVocabViewMode("ai");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        vocabViewMode === "ai"
                          ? "bg-white text-rose-600 shadow-5xs font-extrabold"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> AI Phân loại
                    </button>
                  </div>
                )}
              </div>

              {/* AI English Translation Quick Banner */}
              {!isEditingVocab && (
                <div className="bg-gradient-to-r from-indigo-50/40 to-blue-50/20 border border-indigo-100 rounded-2xl p-4 shadow-4xs space-y-3">
                  {isTranslatingEn ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3 py-2 text-center sm:text-left">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full border-3 border-stone-200 border-t-indigo-600 animate-spin"></div>
                        <Languages className="w-4 h-4 text-indigo-600 absolute top-2.5 left-2.5 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-stone-850">Gemini đang dịch thuật từ vựng...</h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">Bổ sung nghĩa tiếng Anh thiếu cho các từ vựng sử dụng mô hình {selectedAiModel}. Vui lòng chờ giây lát.</p>
                      </div>
                    </div>
                  ) : translationError ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-2.5 text-center sm:text-left">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <X className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-850">Lỗi dịch thuật bằng AI</h4>
                          <p className="text-[11px] text-rose-600 leading-snug">{translationError}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setTranslationError(null)}
                          className="px-2.5 py-1 text-[11px] font-bold text-stone-500 hover:text-stone-700 bg-white border border-stone-200 rounded-lg transition-all"
                        >
                          Đóng
                        </button>
                        <button
                          onClick={handleTranslateEnglishByAi}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-4xs"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin" /> Thử lại
                        </button>
                      </div>
                    </div>
                  ) : translationSuccess ? (
                    <div className="flex items-center justify-between gap-3 py-1 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-emerald-800">{translationSuccess}</p>
                      </div>
                      <button
                        onClick={() => setTranslationSuccess(null)}
                        className="text-emerald-700 hover:text-emerald-950 text-xs font-bold shrink-0 px-2 py-1"
                      >
                        Đóng
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Languages className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                            <span>Bổ sung nghĩa tiếng Anh bằng AI</span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-mono font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">Trợ lý dịch thuật</span>
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal max-w-xl">
                            {selectedLesson.words.filter(w => !w.englishMeaning || w.englishMeaning.trim() === "").length > 0 ? (
                              <span>Phát hiện có <strong>{selectedLesson.words.filter(w => !w.englishMeaning || w.englishMeaning.trim() === "").length} từ vựng</strong> chưa có nghĩa tiếng Anh trong bài học này. Sử dụng AI để tự động dịch và bổ sung ngay giúp bài học đầy đủ ngữ liệu.</span>
                            ) : (
                              <span>✨ Tuyệt vời! Toàn bộ <strong>{selectedLesson.words.length} từ vựng</strong> trong bài học này đều đã được trang bị nghĩa tiếng Anh đầy đủ và chuẩn xác.</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                        {selectedLesson.words.filter(w => !w.englishMeaning || w.englishMeaning.trim() === "").length > 0 ? (
                          <button
                            onClick={handleTranslateEnglishByAi}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs flex items-center gap-1.5 transform active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> Bổ sung nghĩa tiếng Anh (AI)
                          </button>
                        ) : (
                          <button
                            onClick={handleTranslateEnglishByAi}
                            className="px-3.5 py-1.5 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            title="Dịch lại toàn bộ để cập nhật hoặc sửa chữa"
                          >
                            <RefreshCw className="w-3 h-3" /> Dịch lại bằng AI
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {vocabViewMode === "ai" && !isEditingVocab ? (
                <div className="space-y-4">
                  {/* AI Model Selector */}
                  <div className="bg-stone-50/75 border border-stone-200/80 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-4xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 font-mono bg-rose-50 px-1.5 py-0.5 rounded">Cấu hình AI Agent</span>
                        {isCategorizingByAi && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse">Đang hoạt động</span>
                        )}
                      </div>
                      <h4 className="text-xs font-extrabold text-stone-850">Chọn Trợ lý Trí tuệ Nhân tạo phục vụ</h4>
                      <p className="text-[11px] text-stone-500 leading-normal max-w-md">Các mô hình khác nhau mang lại độ chi tiết, tốc độ phản hồi và sự phân loại bối cảnh ngữ cảnh khác nhau cho bài học này.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
                      {[
                        { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Mặc định, cân bằng nhất", badges: "Nhanh & Tối ưu" },
                        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Tối ưu hóa phân loại nhanh", badges: "Mới nhất" },
                        { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Phân tích ngữ cảnh sâu sắc", badges: "Cực kỳ thông minh" },
                        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "Phản hồi chuẩn học thuật", badges: "Tin cậy" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedAiModel(m.id);
                          }}
                          disabled={isCategorizingByAi}
                          className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-left relative flex flex-col justify-between h-[76px] ${
                            selectedAiModel === m.id
                              ? "bg-white border-rose-500 shadow-3xs ring-2 ring-rose-500/10 cursor-default"
                              : isCategorizingByAi 
                                ? "bg-stone-50 border-stone-200/50 opacity-50 cursor-not-allowed text-stone-400"
                                : "bg-white/40 border-stone-200/80 hover:border-stone-300 hover:bg-white text-stone-600"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 justify-between">
                              <span className={`text-[11px] font-black ${selectedAiModel === m.id ? "text-rose-600" : "text-stone-800"}`}>{m.name}</span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-medium ${selectedAiModel === m.id ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-500"}`}>{m.badges}</span>
                            </div>
                            <p className="text-[9px] text-stone-400 font-medium leading-snug">{m.desc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-auto pt-1 border-t border-stone-50 w-full">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedAiModel === m.id ? "bg-rose-500 animate-pulse" : "bg-stone-300"}`}></span>
                            <span className="text-[8px] uppercase tracking-wider text-stone-400 font-semibold">{selectedAiModel === m.id ? "Đang chọn" : "Bấm để chọn"}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Loading State */}
                  {isCategorizingByAi && (
                    <div className="p-8 rounded-2xl border border-rose-100 bg-rose-50/10 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-rose-600 animate-spin"></div>
                        <Sparkles className="w-5 h-5 text-amber-500 absolute top-3.5 left-3.5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-stone-850 animate-pulse">Gemini đang phân tích và sắp xếp từ vựng...</h4>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm">
                          AI đang phân loại nghĩa tiếng Nhật, tiếng Anh và tiếng Việt để gán vào các chủ đề bài học phù hợp nhất.
                        </p>
                      </div>
                      <div className="text-[11px] font-mono text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                        Mô hình đang chạy: {selectedAiModel}
                      </div>
                    </div>
                  )}

                  {/* AI Error State */}
                  {aiCategorizeError && !isCategorizingByAi && (
                    <div className="p-6 rounded-2xl border border-rose-100 bg-rose-50/35 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                        <X className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-850">Không thể phân loại bằng trí tuệ nhân tạo</h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{aiCategorizeError}</p>
                      </div>
                      <button
                        onClick={handleCategorizeByAi}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs inline-flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thử lại bằng AI
                      </button>
                    </div>
                  )}

                  {/* AI Empty Cache State - Intro & Prompt */}
                  {!selectedLesson.categorizedVocab && !isCategorizingByAi && !aiCategorizeError && (
                    <div className="p-8 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md animate-bounce">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-base font-black text-stone-850">Phân loại từ vựng tự động bằng AI</h4>
                        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                          Nhờ sức mạnh của trí tuệ nhân tạo Gemini, toàn bộ <strong>{selectedLesson.words.length} từ vựng</strong> trong bài học này sẽ được phân tích, sắp xếp logic thành các nhóm chủ đề hoặc bối cảnh sử dụng thực tế giúp bạn học nhanh gấp đôi!
                        </p>
                      </div>
                      <button
                        onClick={handleCategorizeByAi}
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform active:scale-95 mx-auto"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> Sắp xếp từ vựng ngay
                      </button>
                    </div>
                  )}

                  {/* AI Categorized Success State */}
                  {selectedLesson.categorizedVocab && !isCategorizingByAi && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-amber-50/30 border border-amber-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Đã sắp xếp thành công {selectedLesson.categorizedVocab.length} chủ đề bằng AI
                        </span>
                        <button
                          onClick={handleCategorizeByAi}
                          className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white transition-all hover:bg-stone-50"
                          title="Phân loại lại từ vựng"
                        >
                          <RefreshCw className="w-3 h-3" /> Phân loại lại
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLesson.categorizedVocab.map((group, gIdx) => (
                          <div 
                            key={gIdx}
                            className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all shadow-4xs space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                  {group.context || "Chủ đề thực tế"}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-stone-850 mt-1 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                                {group.categoryName}
                              </h4>
                              <p className="text-xs text-stone-500 leading-relaxed">
                                {group.categoryDescription}
                              </p>
                            </div>

                            <div className="border-t border-stone-100 pt-3 space-y-2">
                              {group.words.map((word: any, wIdx: number) => (
                                <div 
                                  key={wIdx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 hover:bg-stone-100/75 transition-all text-stone-800"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      onClick={() => speakJapanese(word.japanese)}
                                      className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center border border-rose-100 shrink-0 transition-all"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="min-w-0">
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="font-serif-jp font-bold text-stone-850 text-sm">
                                          {word.japanese}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-mono font-medium lowercase">
                                          /{word.romaji}/
                                        </span>
                                      </div>
                                      <span className="text-xs text-stone-600 block leading-tight">
                                        {word.vietnameseMeaning}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {selectedLesson.words.map((word, wIdx) => {
                  const isEditingThis = editingWordIndex === wIdx;
                  const isMovingThis = movingWordIndex === wIdx;
                  const isDeletingThis = deletingWordIndex === wIdx;

                  if (isEditingThis) {
                    return (
                      <div 
                        key={wIdx}
                        className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50/5 flex flex-col gap-3 transition-all shadow-3xs"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase font-mono block mb-1">Tiếng Nhật (JP)</label>
                            <input 
                              type="text" 
                              value={editJp}
                              onChange={(e) => setEditJp(e.target.value)}
                              className="w-full text-xs border border-stone-200 rounded-lg p-2 font-serif-jp bg-white text-stone-850 focus:outline-none focus:border-rose-500"
                              placeholder="Ví dụ: わたし"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase font-mono block mb-1">Romaji</label>
                            <input 
                              type="text" 
                              value={editRomaji}
                              onChange={(e) => setEditRomaji(e.target.value)}
                              className="w-full text-xs border border-stone-200 rounded-lg p-2 font-mono bg-white text-stone-850 focus:outline-none focus:border-rose-500"
                              placeholder="Ví dụ: watashi"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase font-mono block mb-1">Nghĩa tiếng Việt</label>
                            <input 
                              type="text" 
                              value={editVn}
                              onChange={(e) => setEditVn(e.target.value)}
                              className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-white text-stone-850 focus:outline-none focus:border-rose-500"
                              placeholder="Ví dụ: Tôi"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase font-mono block mb-1">Nghĩa tiếng Anh (English)</label>
                            <input 
                              type="text" 
                              value={editEn}
                              onChange={(e) => setEditEn(e.target.value)}
                              className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-white text-stone-850 focus:outline-none focus:border-rose-500"
                              placeholder="Để trống nếu không có"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-100">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setEditingWordIndex(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Hủy
                          </button>
                          <button
                            onClick={() => handleUpdateVocabWord(wIdx)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Lưu lại
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isMovingThis) {
                    return (
                      <div 
                        key={wIdx}
                        className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/5 flex flex-col gap-3 transition-all shadow-3xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-850">
                            Di chuyển từ <strong className="font-serif-jp text-rose-600 font-extrabold">{word.japanese}</strong> sang bài học khác:
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">Từ vựng sẽ được chuyển khỏi bài này sang bài mới chọn.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <select 
                            value={moveTargetLessonId ?? ""}
                            onChange={(e) => setMoveTargetLessonId(e.target.value === "" ? null : Number(e.target.value))}
                            className="w-full text-xs border border-stone-200 rounded-lg p-2 bg-white text-stone-850 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Chọn bài học đích --</option>
                            {lessons.filter(l => l.id !== selectedLesson.id).map(l => (
                              <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-100">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setMovingWordIndex(null);
                              setMoveTargetLessonId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Hủy
                          </button>
                          <button
                            onClick={() => handleMoveVocabWord(wIdx)}
                            disabled={moveTargetLessonId === null}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Di chuyển
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isDeletingThis) {
                    return (
                      <div 
                        key={wIdx}
                        className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50/5 flex flex-col gap-3 transition-all shadow-3xs animate-fadeIn"
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-850">
                            Bạn có chắc chắn muốn xóa từ vựng <strong className="font-serif-jp text-rose-600 font-extrabold">{word.japanese}</strong> khỏi bài học này không?
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">Thao tác này sẽ đồng bộ ngay lên đám mây Firestore.</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-100">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setDeletingWordIndex(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Hủy
                          </button>
                          <button
                            onClick={() => handleDeleteVocabWord(wIdx)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Đồng ý xóa
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={wIdx}
                      className="p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50/50 flex items-center gap-4 transition-all shadow-4xs"
                    >
                      <button
                        onClick={() => speakJapanese(word.japanese)}
                        className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100 shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4.5 h-4.5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-serif-jp font-black text-stone-850 text-base">
                            {word.japanese}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono font-medium lowercase">
                            /{word.romaji}/
                          </span>
                        </div>
                        <span className="text-xs text-stone-600 font-semibold block mt-0.5">
                          {word.vietnameseMeaning}
                        </span>
                        {word.englishMeaning && (
                          <span className="text-[11px] text-stone-400 font-medium block mt-0.5">
                            🇬🇧 English: {word.englishMeaning}
                          </span>
                        )}
                      </div>

                      {isEditingVocab && (
                        <div className="flex items-center gap-1 shrink-0 ml-auto border-l border-stone-150 pl-3">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setEditingWordIndex(wIdx);
                              setMovingWordIndex(null);
                              setDeletingWordIndex(null);
                              setEditJp(word.japanese);
                              setEditRomaji(word.romaji || "");
                              setEditVn(word.vietnameseMeaning);
                              setEditEn(word.englishMeaning || "");
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all"
                            title="Sửa từ vựng"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setMovingWordIndex(wIdx);
                              setEditingWordIndex(null);
                              setDeletingWordIndex(null);
                              setMoveTargetLessonId(null);
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition-all"
                            title="Di chuyển sang bài học khác"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              sounds.playClick();
                              setDeletingWordIndex(wIdx);
                              setEditingWordIndex(null);
                              setMovingWordIndex(null);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-all"
                            title="Xóa từ vựng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </motion.div>
          )}

          {/* 2. TAB: FLASHCARD (Không có nét vẽ) */}
          {studySubMode === "flashcard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-6 py-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold font-mono text-stone-400">
                  THẺ FLASHCARD: {flashcardIndex + 1} / {selectedLesson.words.length}
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  Nhấp vào thẻ để lật mặt sau
                </span>
              </div>

              <div 
                onClick={() => {
                  sounds.playClick();
                  setIsCardFlipped(!isCardFlipped);
                }}
                className="h-64 w-full [perspective:1000px] cursor-pointer"
              >
                <div className={`relative w-full h-full text-center transition-all duration-500 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  {/* Front Face */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col justify-center items-center p-6 [backface-visibility:hidden]">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-4xl sm:text-5xl font-black text-rose-600 font-serif-jp tracking-tight mb-2">
                      {selectedLesson.words[flashcardIndex].japanese}
                    </h3>
                    <span className="font-mono text-xs text-stone-400 lowercase font-medium">
                      /{selectedLesson.words[flashcardIndex].romaji}/
                    </span>
                    <span className="text-[10px] text-stone-400 mt-4 uppercase tracking-widest font-mono">Chạm để xem ý nghĩa</span>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl border border-stone-200 bg-stone-900 text-white shadow-xs flex flex-col justify-center items-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider font-mono block mb-2">
                      Ý nghĩa từ vựng
                    </span>
                    <h3 className="text-2xl font-extrabold text-white text-center px-4 mb-2">
                      {selectedLesson.words[flashcardIndex].vietnameseMeaning}
                    </h3>
                    {selectedLesson.words[flashcardIndex].englishMeaning && (
                      <h4 className="text-sm font-bold text-stone-300 text-center px-4 mb-4">
                        🇬🇧 {selectedLesson.words[flashcardIndex].englishMeaning}
                      </h4>
                    )}
                    {selectedLesson.words[flashcardIndex].mnemonic && (
                      <p className="text-xs text-stone-400 italic text-center px-6 max-w-xs leading-relaxed mt-2">
                        💡 Mẹo nhớ: {selectedLesson.words[flashcardIndex].mnemonic}
                      </p>
                    )}
                    <span className="text-[10px] text-stone-500 mt-6 uppercase tracking-widest font-mono">Chạm để lật lại</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    setIsCardFlipped(false);
                    setFlashcardIndex((prev) => (prev - 1 + selectedLesson.words.length) % selectedLesson.words.length);
                  }}
                  className="px-3 sm:px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  <span>←</span>
                  <span className="hidden xs:inline">Từ trước</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    speakJapanese(selectedLesson.words[flashcardIndex].japanese);
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 flex items-center justify-center transition-all shrink-0"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    setIsCardFlipped(false);
                    setFlashcardIndex((prev) => (prev + 1) % selectedLesson.words.length);
                  }}
                  className="px-3 sm:px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  <span className="hidden xs:inline">Từ tiếp theo</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. TAB: NGỮ PHÁP */}
          {studySubMode === "grammar" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-full min-w-0 overflow-hidden">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-3xs">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-850 flex items-center gap-1.5 flex-wrap">
                  <Lightbulb className="w-4.5 h-4.5 text-amber-500 fill-amber-100 shrink-0" /> Cấu trúc Ngữ pháp chính thức của bài học
                </h3>
                
                <div className="bg-white border border-stone-150 rounded-xl p-4 shadow-4xs">
                  <span className="block font-mono text-stone-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                    Mẫu câu cốt lõi
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-rose-600 font-serif-jp break-all">
                    {selectedLesson.grammar.pattern}
                  </h4>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 block">Ý nghĩa & Cách dùng chi tiết:</span>
                  <p className="text-xs text-stone-500 leading-relaxed font-semibold break-words">
                    {selectedLesson.grammar.explanation}
                  </p>
                </div>

                <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-100 flex items-start gap-3">
                  <CornerDownRight className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-rose-800 block">Ví dụ trực quan:</span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-base font-black text-stone-800 font-serif-jp break-all">
                        {selectedLesson.grammar.example}
                      </p>
                      <button
                        onClick={() => speakJapanese(selectedLesson.grammar.example)}
                        className="p-1 rounded-full text-rose-500 hover:bg-rose-100 transition-all border border-transparent hover:border-rose-200 shrink-0"
                        title="Nghe phát âm ví dụ"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 italic mt-0.5 break-words">
                      Dịch nghĩa: {selectedLesson.grammar.exampleMeaning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extra Practice Generation */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-4xs">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Ví dụ giao tiếp mở rộng thực hành</h4>
                <div className="space-y-3 divide-y divide-stone-100">
                  {selectedLesson.words.slice(0, 3).map((word, index) => {
                    const customPattern = selectedLesson.id === 1 
                      ? `わたしは ${word.japanese} です。`
                      : `${word.japanese} です。`;
                    const customMeaning = selectedLesson.id === 1
                      ? `Tôi là ${word.vietnameseMeaning.toLowerCase()}.`
                      : `Là ${word.vietnameseMeaning.toLowerCase()}.`;

                    return (
                      <div key={index} className={`pt-3 ${index === 0 ? "pt-0" : ""} flex items-center justify-between gap-4`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif-jp font-black text-stone-850 text-sm break-all">{customPattern}</span>
                            <button
                              onClick={() => speakJapanese(customPattern)}
                              className="p-1 rounded-full text-stone-400 hover:text-rose-600 hover:bg-stone-100 shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-xs text-stone-400 font-medium block mt-0.5 break-words">{customMeaning}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. TAB: BÀI TẬP & THI VƯỢT ẢI (Gồm 3 kì thi chuyên nghiệp & chuẩn hóa) */}
          {studySubMode === "practice" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* IF NO EXAM IS ACTIVE -> SHOW SELECTION DASHBOARD */}
              {examQuestions.length === 0 && essayQuestions.length === 0 && jlptQuestions.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2 max-w-xl mx-auto py-4">
                    <h3 className="text-lg font-black text-stone-850">Hệ thống Kì thi & Đánh giá năng lực</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Để hoàn thành bài học <strong>{selectedLesson.title}</strong> và tiếp tục mở khóa nội dung mới, bạn hãy hoàn thành tối thiểu một trong ba kì thi chuẩn hóa dưới đây.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Trắc nghiệm Từ vựng */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between hover:border-stone-350 hover:shadow-2xs transition-all relative">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500 shadow-4xs">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-extrabold text-stone-850">1. Trắc nghiệm từ vựng</h4>
                          <p className="text-[11.5px] text-stone-400 leading-relaxed font-semibold">
                            Gồm {selectedLesson.words.length} câu trắc nghiệm ngẫu nhiên kiểm tra nghĩa hai chiều Nhật - Việt. Yêu cầu đạt tối thiểu <strong>{Math.ceil(selectedLesson.words.length * 0.8)}/{selectedLesson.words.length}</strong> câu đúng để vượt ải.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={startVocabExam}
                        className="mt-6 w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-3xs"
                      >
                        Bắt đầu thi
                      </button>
                    </div>

                    {/* Card 2: Thi tự luận Hiragana/Katakana */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between hover:border-stone-350 hover:shadow-2xs transition-all relative">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-500 shadow-4xs">
                          <Edit3 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-extrabold text-stone-850">2. Tự luận ngữ pháp</h4>
                          <p className="text-[11.5px] text-stone-400 leading-relaxed font-semibold">
                            Thực hành dịch câu hoặc điền trợ từ theo ngữ pháp bài học. Yêu cầu nhập câu trả lời bằng chữ <strong>Hiragana/Katakana</strong>. Đạt tối thiểu <strong>4/5</strong> câu để đỗ.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={startEssayExam}
                        className="mt-6 w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-3xs"
                      >
                        Bắt đầu thi
                      </button>
                    </div>

                    {/* Card 3: Đề thi N5 JLPT */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between hover:border-stone-350 hover:shadow-2xs transition-all relative">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 shadow-4xs">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-extrabold text-stone-850">3. Đề thi mẫu N5 JLPT</h4>
                          <p className="text-[11.5px] text-stone-400 leading-relaxed font-semibold">
                            Đề thi rút gọn cấu trúc chuẩn JLPT gồm 3 phần: Chữ viết & Từ vựng (Moji-Goi), Ngữ pháp (Bunpou) và Đọc hiểu (Dokkai). Đạt tối thiểu <strong>75%</strong> để vượt ải.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={startJlptExam}
                        className="mt-6 w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-3xs"
                      >
                        Bắt đầu thi
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ACTIVE EXAM CONTAINER */
                <div className="space-y-6">
                  {/* Active Exam Header Bar */}
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span className="text-xs font-extrabold text-stone-700 font-mono">
                        {practiceType === "vocab-exam" && `BÀI THI TRẮC NGHIỆM TỪ VỰNG: CÂU ${examIndex + 1} / ${examQuestions.length}`}
                        {practiceType === "essay-exam" && `BÀI THI TỰ LUẬN NGỮ PHÁP: CÂU ${essayIndex + 1} / 5`}
                        {practiceType === "jlpt-exam" && `ĐỀ THI MẪU JLPT N5: CÂU ${jlptIndex + 1} / ${jlptQuestions.length}`}
                      </span>
                    </div>
                    
                    <button
                      onClick={exitExam}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-800 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-4xs transition-all"
                    >
                      Thoát kì thi
                    </button>
                  </div>

                  {/* 1. VOCABULARY MCQ EXAM RENDER */}
                  {practiceType === "vocab-exam" && (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-stone-400 font-mono font-bold uppercase tracking-wider">Tiến trình bài thi</span>
                        <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
                          ⭐ Điểm số: {examScore} / {examQuestions.length}
                        </span>
                      </div>

                      {examFinished ? (
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center space-y-5 shadow-3xs">
                          {examScore >= Math.ceil(examQuestions.length * 0.8) ? (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-500">
                                <Award className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Chúc mừng! Bạn đã ĐẠT bài thi trắc nghiệm từ vựng!</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả chính xác: <strong className="text-stone-700">{examScore} / {examQuestions.length}</strong> câu. Lộ trình bài tiếp theo đã được mở khóa thăng tiến!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-stone-200/50 rounded-full flex items-center justify-center mx-auto text-stone-500">
                                <HelpCircle className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Chưa đạt điểm đỗ yêu cầu</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả đạt được <strong className="text-stone-700">{examScore} / {examQuestions.length}</strong> câu. Cần tối thiểu <strong className="text-stone-700">{Math.ceil(examQuestions.length * 0.8)} / {examQuestions.length}</strong> câu để thông qua bài học này.
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={startVocabExam}
                              className="flex-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-4xs"
                            >
                              <RotateCcw className="w-4 h-4" /> Thi lại ngay
                            </button>
                            <button
                              onClick={exitExam}
                              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-3xs"
                            >
                              Quay lại danh sách thi
                            </button>
                          </div>
                        </div>
                      ) : (
                        examQuestions.length > 0 && (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-4xs">
                            <div className="text-center space-y-2">
                              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono block">
                                {examQuestions[examIndex].type === "vn-to-jp" 
                                  ? "Chọn từ tiếng Nhật tương đương với nghĩa Việt sau:"
                                  : "Từ vựng tiếng Nhật dưới đây mang ý nghĩa gì?"}
                              </span>
                              <h3 className="text-xl sm:text-2xl font-black text-rose-600 font-serif-jp">
                                {examQuestions[examIndex].type === "vn-to-jp"
                                  ? `"${examQuestions[examIndex].word.vietnameseMeaning}"`
                                  : examQuestions[examIndex].word.japanese}
                              </h3>
                              {examQuestions[examIndex].type === "jp-to-vn" && (
                                <span className="block font-mono text-[11px] text-stone-400 lowercase font-semibold">
                                  /{examQuestions[examIndex].word.romaji}/
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                              {examQuestions[examIndex].options.map((option, idx) => {
                                const isSelected = examSelectedAns === option;
                                const isCorrectOption = option === examQuestions[examIndex].correctStr;

                                let optStyle = "border-stone-200 bg-white hover:border-stone-300 text-stone-800 hover:bg-stone-50/50";
                                if (examAnswered) {
                                  if (isCorrectOption) {
                                    optStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold";
                                  } else if (isSelected) {
                                    optStyle = "bg-rose-50 border-rose-500 text-rose-800 font-extrabold";
                                  } else {
                                    optStyle = "opacity-50 bg-stone-50 border-stone-200";
                                  }
                                }

                                return (
                                  <button
                                    key={idx}
                                    disabled={examAnswered}
                                    onClick={() => handleSelectVocabOption(option)}
                                    className={`p-4 rounded-xl border-2 text-center text-sm sm:text-base font-serif-jp transition-all shadow-4xs ${optStyle}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            {examAnswered && (
                              <div className="space-y-4">
                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                  examIsCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                                }`}>
                                  {examIsCorrect ? <CheckCircle className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                                  <div>
                                    <span className="text-xs font-black block">
                                      {examIsCorrect ? "Chính xác, làm tốt lắm!" : "Tiếc quá, chưa chính xác!"}
                                    </span>
                                    <p className="text-xs opacity-90 mt-0.5">
                                      Đáp án đúng: "{examQuestions[examIndex].correctStr}"
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={handleNextVocabQuestion}
                                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                                >
                                  {examIndex < examQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả bài thi"} <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* 2. ESSAY / WRITTEN EXAM RENDER */}
                  {practiceType === "essay-exam" && (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-stone-400 font-mono font-bold uppercase tracking-wider">Đáp án bằng Hiragana/Katakana</span>
                        <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
                          ⭐ Đúng: {essayScore} / 5
                        </span>
                      </div>

                      {essayFinished ? (
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center space-y-5 shadow-3xs">
                          {essayScore >= 4 ? (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-500">
                                <Award className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Tuyệt hảo! Bạn đã THÔNG QUA bài thi tự luận!</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả xuất sắc: <strong className="text-stone-700">{essayScore} / 5</strong> câu đúng. Trình độ viết câu và ứng dụng ngữ pháp của bạn rất vững vàng!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-stone-200/50 rounded-full flex items-center justify-center mx-auto text-stone-500">
                                <HelpCircle className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Chưa đạt điểm đỗ yêu cầu</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả đạt được <strong className="text-stone-700">{essayScore} / 5</strong> câu. Cần đạt tối thiểu <strong className="text-stone-700">4 / 5</strong> câu đúng để hoàn thành tự luận bài này.
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={startEssayExam}
                              className="flex-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-4xs"
                            >
                              <RotateCcw className="w-4 h-4" /> Thi lại ngay
                            </button>
                            <button
                              onClick={exitExam}
                              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-3xs"
                            >
                              Quay lại danh sách thi
                            </button>
                          </div>
                        </div>
                      ) : (
                        essayQuestions.length > 0 && (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-4xs">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono block">
                                Đề bài tự luận:
                              </span>
                              <h3 className="text-base sm:text-lg font-bold text-stone-800 leading-relaxed">
                                {essayQuestions[essayIndex].question}
                              </h3>
                              <div className="bg-white/80 border border-stone-150 rounded-xl p-3 text-[11px] text-stone-500 italic font-semibold leading-relaxed flex gap-1.5">
                                <span className="text-rose-500 shrink-0">💡 Gợi ý:</span>
                                <span>{essayQuestions[essayIndex].hint}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-stone-400 font-mono block">Câu trả lời của bạn:</label>
                              <input
                                type="text"
                                value={essayInput}
                                disabled={essayAnswered}
                                onChange={(e) => setEssayInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !essayAnswered && essayInput.trim()) {
                                    handleSubmitEssay();
                                  }
                                }}
                                placeholder="Nhập chữ Hiragana / Katakana tương ứng..."
                                className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-base font-serif-jp tracking-tight focus:outline-none focus:border-rose-500 bg-white transition-all disabled:bg-stone-100 disabled:text-stone-500"
                              />
                            </div>

                            {!essayAnswered ? (
                              <button
                                onClick={handleSubmitEssay}
                                disabled={!essayInput.trim()}
                                className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-3xs transition-all flex items-center justify-center gap-1"
                              >
                                Nộp bài tự luận
                              </button>
                            ) : (
                              <div className="space-y-4">
                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                  essayIsCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                                }`}>
                                  {essayIsCorrect ? <CheckCircle className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                                  <div>
                                    <span className="text-xs font-black block">
                                      {essayIsCorrect ? "Chính xác tuyệt đối!" : "Chưa chính xác rồi!"}
                                    </span>
                                    <p className="text-xs opacity-95 mt-1">
                                      Đáp án tham khảo: <strong className="font-serif-jp text-sm text-stone-850">"{essayQuestions[essayIndex].answers[0]}"</strong>
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={handleNextEssayQuestion}
                                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                                >
                                  {essayIndex < essayQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả tự luận"} <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* 3. JLPT N5 MOCK EXAM RENDER */}
                  {practiceType === "jlpt-exam" && (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-stone-400 font-mono font-bold uppercase tracking-wider">Đề thi chuẩn hóa rút gọn</span>
                        <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
                          ⭐ Điểm số: {jlptScore} / {jlptQuestions.length}
                        </span>
                      </div>

                      {jlptFinished ? (
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center space-y-5 shadow-3xs">
                          {jlptScore >= Math.ceil(jlptQuestions.length * 0.75) ? (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-500">
                                <Award className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Xuất sắc! Bạn ĐÃ THÔNG QUA đề thi mẫu JLPT N5!</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả tuyệt hảo: <strong className="text-stone-700">{jlptScore} / {jlptQuestions.length}</strong> câu đúng (đạt tỷ lệ {(jlptScore / jlptQuestions.length * 100).toFixed(0)}%). Bạn đã sẵn sàng cho kì thi thực tế!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="w-16 h-16 bg-stone-200/50 rounded-full flex items-center justify-center mx-auto text-stone-500">
                                <HelpCircle className="w-8 h-8" />
                              </div>
                              <h3 className="text-base font-extrabold text-stone-850">Chưa đạt yêu cầu tối thiểu (75%)</h3>
                              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                                Kết quả đạt được <strong className="text-stone-700">{jlptScore} / {jlptQuestions.length}</strong> câu. Hãy tiếp tục ôn tập từ vựng & ngữ pháp của bài để đạt điểm đỗ nhé.
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={startJlptExam}
                              className="flex-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-4xs"
                            >
                              <RotateCcw className="w-4 h-4" /> Thi lại ngay
                            </button>
                            <button
                              onClick={exitExam}
                              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-3xs"
                            >
                              Quay lại danh sách thi
                            </button>
                          </div>
                        </div>
                      ) : (
                        jlptQuestions.length > 0 && (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-4xs">
                            {/* Question Section / Category Badge */}
                            <div className="flex items-center gap-2">
                              {jlptQuestions[jlptIndex].type === "moji-goi" && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-mono font-bold">
                                  Phần 1: Chữ viết & Từ vựng (Moji-Goi)
                                </span>
                              )}
                              {jlptQuestions[jlptIndex].type === "bunpou" && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-mono font-bold">
                                  Phần 2: Ngữ pháp (Bunpou)
                                </span>
                              )}
                              {jlptQuestions[jlptIndex].type === "dokkai" && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-mono font-bold">
                                  Phần 3: Đọc hiểu rút gọn (Dokkai)
                                </span>
                              )}
                            </div>

                            {/* Dokkai Passage display if available */}
                            {jlptQuestions[jlptIndex].type === "dokkai" && jlptQuestions[jlptIndex].passage && (
                              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-4xs">
                                <span className="text-[10px] uppercase font-bold text-stone-400 font-mono tracking-widest block">Đoạn văn đọc hiểu:</span>
                                <p className="text-sm font-serif-jp leading-relaxed text-stone-800 whitespace-pre-wrap font-medium">
                                  {jlptQuestions[jlptIndex].passage}
                                </p>
                                
                                {jlptAnswered && (
                                  <div className="pt-2 border-t border-stone-100 mt-2">
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 font-mono tracking-widest block mb-1">Dịch nghĩa tham khảo:</span>
                                    <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                                      {jlptQuestions[jlptIndex].passageTranslation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Question content */}
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono block">Câu hỏi:</span>
                              <h3 className="text-base sm:text-lg font-bold text-stone-850 leading-relaxed">
                                {jlptQuestions[jlptIndex].questionText}
                              </h3>
                            </div>

                            {/* Options grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                              {jlptQuestions[jlptIndex].options.map((option, idx) => {
                                const isSelected = jlptSelectedAns === option;
                                const isCorrectOption = option === jlptQuestions[jlptIndex].correctStr;

                                let optStyle = "border-stone-200 bg-white hover:border-stone-300 text-stone-800 hover:bg-stone-50/50";
                                if (jlptAnswered) {
                                  if (isCorrectOption) {
                                    optStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold";
                                  } else if (isSelected) {
                                    optStyle = "bg-rose-50 border-rose-500 text-rose-800 font-extrabold";
                                  } else {
                                    optStyle = "opacity-50 bg-stone-50 border-stone-200";
                                  }
                                }

                                return (
                                  <button
                                    key={idx}
                                    disabled={jlptAnswered}
                                    onClick={() => handleSelectJlptOption(option)}
                                    className={`p-4 rounded-xl border-2 text-center text-sm sm:text-base font-serif-jp transition-all shadow-4xs ${optStyle}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Answer response feedback with explanation */}
                            {jlptAnswered && (
                              <div className="space-y-4">
                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                  jlptIsCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                                }`}>
                                  {jlptIsCorrect ? <CheckCircle className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                                  <div>
                                    <span className="text-xs font-black block">
                                      {jlptIsCorrect ? "Tuyệt vời, chính xác!" : "Nhầm một chút rồi!"}
                                    </span>
                                    <p className="text-xs opacity-95 mt-1 leading-relaxed">
                                      <strong>Đáp án đúng:</strong> {jlptQuestions[jlptIndex].correctStr}
                                    </p>
                                    <p className="text-[11px] opacity-85 mt-2 leading-relaxed italic bg-white/40 rounded-lg p-2.5 border border-stone-200/50">
                                      {jlptQuestions[jlptIndex].explanation}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={handleNextJlptQuestion}
                                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                                >
                                  {jlptIndex < jlptQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả đề thi"} <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 5. TAB: NGHE CHOUKAI (Interactive listening simulation) */}
          {studySubMode === "choukai" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-mono text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  🎧 LUYỆN NGHE CHOUKAI: CÂU {choukaiIndex + 1} / 3
                </span>
                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                  Chuẩn: {choukaiScore} / 3
                </span>
              </div>

              {currentChoukaiQuestion && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-4xs">
                  
                  {/* Listening player controller */}
                  <div className="text-center space-y-4">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono block">
                      Bấm nút dưới để phát âm thanh và nghe kỹ:
                    </span>
                    
                    <button
                      onClick={() => {
                        sounds.playClick();
                        speakJapanese(currentChoukaiQuestion.phrase);
                      }}
                      className="w-20 h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto transition-all shadow-md shadow-rose-250 border-4 border-white active:scale-95"
                      title="Phát âm thanh câu hỏi"
                    >
                      <Volume2 className="w-9 h-9 animate-pulse" />
                    </button>
                    
                    <p className="text-xs text-stone-400 font-medium">Bấm lại nút tròn đỏ bất kì lúc nào để nghe lại phát âm.</p>
                  </div>

                  {/* Multiple Choice options */}
                  <div className="space-y-2 mt-6">
                    <span className="text-xs font-bold text-stone-500 block">Lựa chọn ý nghĩa tiếng Việt hoặc chữ Nhật đúng nhất:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentChoukaiQuestion.options.map((option, idx) => {
                        const isSelected = choukaiSelectedAns === option;
                        const isCorrectOption = option === currentChoukaiQuestion.correct;

                        let optStyle = "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50 text-stone-700";
                        if (choukaiAnswered) {
                          if (isCorrectOption) {
                            optStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                          } else if (isSelected) {
                            optStyle = "bg-rose-50 border-rose-500 text-rose-800 font-bold";
                          } else {
                            optStyle = "opacity-50 bg-stone-50 border-stone-200";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={choukaiAnswered}
                            onClick={() => handleSelectChoukai(option)}
                            className={`p-3.5 rounded-xl border text-center text-xs sm:text-sm font-semibold transition-all shadow-4xs ${optStyle}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {choukaiAnswered && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                        choukaiIsCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                      }`}>
                        {choukaiIsCorrect ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <X className="w-5 h-5 shrink-0 text-rose-600" />}
                        <div>
                          <span className="text-xs font-black block">
                            {choukaiIsCorrect ? "Tuyệt vời! Tai nghe cực chuẩn!" : "Cần rèn luyện thêm thính lực!"}
                          </span>
                          <p className="text-xs opacity-90 mt-0.5 font-mono">
                            Ký tự phát âm là: <strong className="text-stone-800">{currentChoukaiQuestion.phrase}</strong> (Được hiểu là: {currentChoukaiQuestion.correct})
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleNextChoukai}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                      >
                        {choukaiIndex < 2 ? "Câu tiếp theo" : "Thi lại loạt nghe mới"} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          )}

          {/* 6. TAB: HỘI THOẠI KAIWA (Conversational bubble role-play) */}
          {studySubMode === "kaiwa" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50 border border-stone-200 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-850">Cuộc hội thoại giao tiếp mẫu sinh động</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">Luyện phản xạ đóng vai (Role-play) và nhại âm theo chuẩn tiếng Nhật giao tiếp.</p>
                </div>
                
                {/* Role play picker */}
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-stone-200 shrink-0 max-w-full justify-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pl-1.5">Vai của bạn:</span>
                  {(["none", "A", "B"] as const).map((role) => {
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          sounds.playClick();
                          setRolePlayMode(role);
                          setCurrentDialogueIndex(0);
                          setIsDialoguePlayingAll(false);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          rolePlayMode === role ? "bg-rose-600 text-white" : "text-stone-500 hover:text-stone-700"
                        }`}
                      >
                        {role === "none" ? "Nghe cả hai" : role === "A" ? "Vai A" : "Vai B"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dialgoue Chat Interface */}
              <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-6 space-y-4 max-h-[450px] overflow-y-auto shadow-4xs scrollbar-thin">
                {currentDialogueLines.map((line, idx) => {
                  const isA = line.speaker.includes("A") || line.speaker === "Tanaka" || line.speaker === "Miller" && idx === 0 || line.speaker === "Miller" && idx === 2;
                  const isUserTurn = (rolePlayMode === "A" && isA) || (rolePlayMode === "B" && !isA);
                  const isPast = idx < currentDialogueIndex;
                  const isCurrent = idx === currentDialogueIndex;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${isA ? "items-start" : "items-end"} space-y-1 ${
                        isCurrent ? "opacity-100 scale-100" : isPast ? "opacity-60" : "opacity-30 pointer-events-none"
                      } transition-all duration-300`}
                    >
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
                        {line.speaker} {isUserTurn && "👉 (Đến lượt BẠN đọc)"}
                      </span>
                      
                      <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 shadow-4xs border ${
                        isA 
                          ? "bg-stone-50 border-stone-150 text-stone-800 rounded-tl-sm" 
                          : "bg-rose-50 border-rose-100 text-rose-950 rounded-tr-sm"
                      }`}>
                        
                        {/* Audio play button for single dialogue line */}
                        <button
                          disabled={isUserTurn && rolePlayMode !== "none"}
                          onClick={() => speakJapanese(line.voice)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            isA ? "bg-white text-stone-600 border-stone-200" : "bg-white text-rose-500 border-rose-200"
                          }`}
                          title="Bấm để nghe phát âm câu thoại"
                        >
                          {isUserTurn && rolePlayMode !== "none" ? <VolumeX className="w-4 h-4 text-stone-300" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="font-serif-jp font-black text-sm sm:text-base leading-relaxed break-words">{line.voice}</p>
                          <p className="text-[10px] font-mono text-stone-400 lowercase mt-0.5 break-words">/{line.romaji}/</p>
                          <p className="text-xs text-stone-500 mt-1.5 border-t border-stone-100/50 pt-1 font-medium break-words">{line.meaning}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kaiwa Control Bar */}
              <div className="flex justify-center items-center gap-3">
                {rolePlayMode === "none" ? (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (isDialoguePlayingAll) {
                        setIsDialoguePlayingAll(false);
                      } else {
                        setCurrentDialogueIndex(0);
                        setIsDialoguePlayingAll(true);
                      }
                    }}
                    className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-3xs ${
                      isDialoguePlayingAll ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    <PlayCircle className="w-4.5 h-4.5" />
                    <span>{isDialoguePlayingAll ? "Tạm dừng phát tất cả" : <><span className="hidden xs:inline">Tự động phát </span>toàn bộ</>}</span>
                  </button>
                ) : (
                  <div className="flex gap-2 items-center w-full sm:w-max">
                    <button
                      onClick={() => { sounds.playClick(); setCurrentDialogueIndex(0); setIsDialoguePlayingAll(false); }}
                      className="px-3 sm:px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition-all shadow-4xs"
                    >
                      Bắt đầu lại
                    </button>
                    <button
                      onClick={handleDialogueNextStep}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs flex items-center justify-center gap-1.5"
                    >
                      <span><span className="hidden xs:inline">Đã nói xong - </span>Câu tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 7. TAB: ĐỌC TOPIC (Reading comprehend) */}
          {studySubMode === "reading" && currentReadingTopic && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Document Topic reading text box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-4xs">
                <div className="flex justify-between items-center border-b border-stone-200 pb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-sm text-stone-850 flex items-center gap-1.5">
                    <BookOpenCheck className="w-4.5 h-4.5 text-rose-500" /> Bài đọc: {currentReadingTopic.title}
                  </h3>
                  
                  <div className="flex gap-1.5 items-center">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        speakJapanese(currentReadingTopic.content);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 bg-white border border-stone-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-4xs shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        <span className="hidden sm:inline">Nghe toàn bài đọc</span>
                        <span className="sm:hidden">Nghe bài</span>
                      </span>
                    </button>
                    
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setShowReadingTranslation(!showReadingTranslation);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg text-xs font-bold transition-all shadow-4xs shrink-0"
                    >
                      {showReadingTranslation ? "Ẩn dịch" : (
                        <>
                          <span className="hidden sm:inline">Xem bản dịch tiếng Việt</span>
                          <span className="sm:hidden">Xem dịch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="font-serif-jp font-black text-sm sm:text-base md:text-lg leading-loose text-stone-800 tracking-wide text-justify select-text bg-white p-4 sm:p-5 rounded-xl border border-stone-150 shadow-4xs break-words">
                  {currentReadingTopic.content}
                </p>

                {showReadingTranslation && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl text-xs sm:text-sm text-stone-600 leading-relaxed font-semibold break-words"
                  >
                    {currentReadingTopic.vietnamese}
                  </motion.div>
                )}
              </div>

              {/* Simple Reading comprehension check */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-4xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-mono">Đọc hiểu câu hỏi dưới đây:</span>
                  <h4 className="font-extrabold text-stone-850 text-sm sm:text-base font-serif-jp">{currentReadingTopic.question}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {currentReadingTopic.options.map((option, idx) => {
                    const isSelected = readingSelectedAns === option;
                    const isCorrectOption = option === currentReadingTopic.correct;

                    let optStyle = "border-stone-200 bg-white hover:border-stone-400 text-stone-800";
                    if (readingAnswered) {
                      if (isCorrectOption) {
                        optStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                      } else if (isSelected) {
                        optStyle = "bg-rose-50 border-rose-500 text-rose-800 font-bold";
                      } else {
                        optStyle = "opacity-50 bg-stone-50 border-stone-200";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={readingAnswered}
                        onClick={() => handleSelectReadingOption(option)}
                        className={`p-3.5 rounded-xl border text-center text-xs sm:text-sm font-bold transition-all shadow-4xs ${optStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {readingAnswered && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    readingIsCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                  }`}>
                    {readingIsCorrect ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <X className="w-5 h-5 shrink-0 text-rose-600" />}
                    <div>
                      <span className="text-xs font-black block">
                        {readingIsCorrect ? "Giải đáp hoàn hảo! Đọc hiểu cực xuất sắc!" : "Chưa chính xác, xem lại giải thích!"}
                      </span>
                      <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                        {currentReadingTopic.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </div>
      )}

      {/* 8. MODAL: IMPORT JSON VOCABULARY */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-150 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-850 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-rose-500" />
                    <span>Import JSON từ vựng</span>
                  </h3>
                  <p className="text-[10px] text-stone-400 font-medium">Bổ sung thêm từ vựng vào giáo trình</p>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setIsImportModalOpen(false); setImportError(null); setImportSuccess(null); }}
                  className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* 1. Chọn chế độ Import */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 block">Chọn phạm vi Import:</label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setImportScope("existing"); setImportError(null); setImportSuccess(null); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        importScope === "existing"
                          ? "bg-white text-stone-850 shadow-3xs"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      Bài học hiện có
                    </button>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setImportScope("new"); setImportError(null); setImportSuccess(null); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        importScope === "new"
                          ? "bg-white text-rose-600 shadow-3xs"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      Tạo chủ đề mới hoàn toàn
                    </button>
                  </div>
                </div>

                {/* Chế độ: Bài học hiện có */}
                {importScope === "existing" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-bold text-stone-700 block">Chọn bài học đích để import:</label>
                    <select
                      value={importTargetLessonId ?? ""}
                      onChange={(e) => setImportTargetLessonId(Number(e.target.value))}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                    >
                      {lessons.map(les => (
                        <option key={les.id} value={les.id}>
                          Bài {les.id + 1}: {les.title} ({les.words.length} từ vựng)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Chế độ: Tạo chủ đề mới */}
                {importScope === "new" && (
                  <div className="space-y-3 border border-stone-150 p-3.5 rounded-xl bg-stone-50/50 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600 border-b border-stone-200 pb-1.5 mb-2">
                      <PlusCircle className="w-4 h-4" /> Thiết lập thông tin chủ đề mới
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">Tên chủ đề <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          placeholder="Ví dụ: Động vật, Mua sắm..."
                          className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">Danh mục chủ đề</label>
                        <input
                          type="text"
                          value={newLessonCategory}
                          onChange={(e) => setNewLessonCategory(e.target.value)}
                          placeholder="Ví dụ: Đời sống, Từ vựng chuyên ngành"
                          className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">Trình độ JLPT</label>
                        <select
                          value={newLessonLevel}
                          onChange={(e) => setNewLessonLevel(e.target.value as any)}
                          className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                        >
                          <option value="N5">N5 (Sơ cấp 1)</option>
                          <option value="N4">N4 (Sơ cấp 2)</option>
                          <option value="N3">N3 (Trung cấp)</option>
                          <option value="N2">N2 (Thượng cấp 1)</option>
                          <option value="N1">N1 (Thượng cấp 2)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 block">Mô tả ngắn chủ đề</label>
                        <input
                          type="text"
                          value={newLessonDesc}
                          onChange={(e) => setNewLessonDesc(e.target.value)}
                          placeholder="Tóm tắt nội dung học..."
                          className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Grammar block for New Topic */}
                    <div className="border-t border-stone-200 pt-2.5 mt-2 space-y-2">
                      <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">Cấu trúc Ngữ pháp kèm theo:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">Mẫu câu ngữ pháp</label>
                          <input
                            type="text"
                            value={newLessonGrammarPattern}
                            onChange={(e) => setNewLessonGrammarPattern(e.target.value)}
                            placeholder="Ví dụ: ~たい です (Muốn làm gì đó)"
                            className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">Giải thích ý nghĩa</label>
                          <input
                            type="text"
                            value={newLessonGrammarExplanation}
                            onChange={(e) => setNewLessonGrammarExplanation(e.target.value)}
                            placeholder="Ví dụ: Dùng biểu thị mong muốn làm hành động..."
                            className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">Câu ví dụ (Tiếng Nhật)</label>
                          <input
                            type="text"
                            value={newLessonGrammarExample}
                            onChange={(e) => setNewLessonGrammarExample(e.target.value)}
                            placeholder="Ví dụ: 日本へ行きたいです。"
                            className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white font-serif-jp"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">Dịch nghĩa câu ví dụ</label>
                          <input
                            type="text"
                            value={newLessonGrammarExampleMeaning}
                            onChange={(e) => setNewLessonGrammarExampleMeaning(e.target.value)}
                            placeholder="Ví dụ: Tôi muốn đi Nhật Bản."
                            className="w-full border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Import Mode Tabs */}
                <div className="flex border-b border-stone-200 gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setImportMethod("json"); setImportError(null); setImportSuccess(null); }}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 px-1 ${
                      importMethod === "json"
                        ? "border-rose-500 text-rose-600"
                        : "border-transparent text-stone-500 hover:text-stone-850"
                    }`}
                  >
                    Import JSON hàng loạt
                  </button>
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setImportMethod("single"); setImportError(null); setImportSuccess(null); }}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 px-1 ${
                      importMethod === "single"
                        ? "border-rose-500 text-rose-600"
                        : "border-transparent text-stone-500 hover:text-stone-850"
                    }`}
                  >
                    Thêm từng từ thủ công
                  </button>
                </div>

                {/* Tab content: JSON Import */}
                {importMethod === "json" && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide font-mono block">Cấu trúc JSON mẫu ({importScope === "new" ? "Toàn bộ chủ đề & Ngữ pháp" : "Bổ sung từ vựng & Ngữ pháp"}):</label>
                      
                      {importScope === "new" ? (
                        <div className="bg-stone-900 text-stone-300 font-mono text-[9px] p-3 rounded-xl overflow-x-auto border border-stone-800 leading-normal max-h-[140px] select-all">
{`{
  "title": "Chủ đề Thời tiết",
  "description": "Các từ vựng và ngữ pháp về khí hậu, thời tiết",
  "level": "N5",
  "category": "Thời tiết",
  "grammar": {
    "pattern": "~たい です (Muốn làm gì)",
    "explanation": "Dùng biểu thị ý muốn...",
    "example": "日本へ行きたいです。",
    "exampleMeaning": "Tôi muốn đi Nhật."
  },
  "words": [
    { "japanese": "はれ", "romaji": "hare", "vietnameseMeaning": "Nắng", "englishMeaning": "Sunny" },
    { "japanese": "あめ", "romaji": "ame", "vietnameseMeaning": "Mưa", "englishMeaning": "Rain" }
  ]
}`}
                        </div>
                      ) : (
                        <div className="bg-stone-900 text-stone-300 font-mono text-[9px] p-3 rounded-xl overflow-x-auto border border-stone-800 leading-normal max-h-[140px] select-all">
{`{
  "grammar": {
    "pattern": "~たい です (Muốn làm gì)",
    "explanation": "Dùng biểu thị ý muốn...",
    "example": "日本へ行きたいです。",
    "exampleMeaning": "Tôi muốn đi Nhật."
  },
  "words": [
    { "japanese": "わたし", "romaji": "watashi", "vietnameseMeaning": "Tôi", "englishMeaning": "I" },
    { "japanese": "あなた", "romaji": "anata", "vietnameseMeaning": "Bạn", "englishMeaning": "You" }
  ]
}`}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-stone-400 leading-normal">
                        * Bạn có thể dán toàn bộ cấu trúc đầy đủ ở trên, hệ thống sẽ tự phân tích và điền các trường cho bạn.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">Dán nội dung JSON vào đây:</label>
                      <textarea
                        rows={6}
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder={importScope === "new"
                          ? '{"title": "...", "grammar": {...}, "words": []}'
                          : '{"words": [{"japanese": "...", "vietnameseMeaning": "..."}]}'
                        }
                        className="w-full text-xs font-mono p-3 rounded-xl border border-stone-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder:text-stone-300 bg-stone-50/50"
                      />
                    </div>
                  </div>
                )}

                {/* Tab content: Single Word Manual Import */}
                {importMethod === "single" && (
                  <div className="space-y-3 pt-1 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block flex items-center gap-1">
                        Từ tiếng Nhật <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={singleJapanese}
                        onChange={(e) => setSingleJapanese(e.target.value)}
                        placeholder="Ví dụ: ねこ, わたし, 食べる, 日本語..."
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Phiên âm Romaji (Không bắt buộc)</label>
                      <input
                        type="text"
                        value={singleRomaji}
                        onChange={(e) => setSingleRomaji(e.target.value)}
                        placeholder="Ví dụ: neko, watashi, taberu, nihongo..."
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block flex items-center gap-1">
                        Ý nghĩa Tiếng Việt <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={singleVietnamese}
                        onChange={(e) => setSingleVietnamese(e.target.value)}
                        placeholder="Ví dụ: Con mèo, tôi, ăn, tiếng Nhật..."
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 leading-normal">
                    ⚠️ {importError}
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 leading-normal">
                    🎉 {importSuccess}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-stone-150 bg-stone-50/80 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => { sounds.playClick(); setIsImportModalOpen(false); setImportError(null); setImportSuccess(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all border border-transparent"
                >
                  Đóng
                </button>
                <button
                  disabled={isImporting}
                  onClick={importMethod === "json" ? handleImportJson : handleImportSingleWord}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang import & sync...</span>
                    </>
                  ) : (
                    <span>{importMethod === "json" ? "Xác nhận Import" : "Thêm vào bài học"}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. MODAL: USER AUTHENTICATION */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-150 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-850 flex items-center gap-1.5">
                    <User className="w-4.5 h-4.5 text-rose-500" />
                    <span>{isRegisterMode ? "Đăng ký thành viên" : "Đăng nhập học viên"}</span>
                  </h3>
                  <p className="text-[10px] text-stone-400 font-medium">Lưu trữ tiến trình học tập và thi cử của bạn</p>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setIsLoginModalOpen(false); setAuthModalError(null); setAuthModalSuccess(null); }}
                  className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleAuthSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* Alert if blocked lesson entry */}
                {lessonToEnterAfterLogin && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-pulse">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">
                      Bạn chưa đăng nhập! Vui lòng đăng nhập để vào học <strong>Bài {lessonToEnterAfterLogin.id + 1}: {lessonToEnterAfterLogin.title}</strong> và đồng bộ tiến độ.
                    </span>
                  </div>
                )}

                {/* Switch Login/Register Tabs */}
                <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setIsRegisterMode(false); setAuthModalError(null); setAuthModalSuccess(null); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                      !isRegisterMode ? "bg-white text-rose-600 shadow-3xs" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setIsRegisterMode(true); setAuthModalError(null); setAuthModalSuccess(null); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                      isRegisterMode ? "bg-white text-rose-600 shadow-3xs" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Đăng ký mới
                  </button>
                </div>

                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">Tên đăng nhập (Username):</label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập (ví dụ: sinh)"
                    className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">Mật khẩu:</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                  />
                </div>

                {/* Helpful Credentials Suggestion Box */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
                  <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Mẹo học tập
                  </p>
                  {!isRegisterMode ? (
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      Đăng nhập tài khoản ban đầu: <strong className="text-rose-600">sinh</strong> - mật khẩu: <strong className="text-rose-600">123456</strong> để tiếp tục bài học.
                    </p>
                  ) : (
                    <p className="leading-relaxed text-[11px] text-stone-500">
                      Tạo tài khoản học viên mới để bắt đầu theo dõi tiến độ học và điểm thi từ đầu trên cơ sở dữ liệu Cloud.
                    </p>
                  )}
                </div>

                {/* Error and Success Alert lines */}
                {authModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 leading-normal">
                    ⚠️ {authModalError}
                  </div>
                )}

                {authModalSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 leading-normal">
                    🎉 {authModalSuccess}
                  </div>
                )}

                {/* Action buttons footer */}
                <div className="pt-2 border-t border-stone-150 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); setIsLoginModalOpen(false); setAuthModalError(null); setAuthModalSuccess(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all border border-transparent"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs flex items-center gap-1.5"
                  >
                    {isAuthLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <span>{isRegisterMode ? "Xác nhận Đăng ký" : "Đăng nhập học tập"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
