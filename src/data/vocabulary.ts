export interface VocabularyWord {
  japanese: string;       // e.g. "ねこ"
  romaji: string;         // e.g. "neko"
  vietnameseMeaning: string;  // e.g. "Con mèo"
  mnemonic?: string;
}

export const JAPANESE_VOCABULARY: VocabularyWord[] = [
  { japanese: "ねこ", romaji: "neko", vietnameseMeaning: "Con mèo" },
  { japanese: "いぬ", romaji: "inu", vietnameseMeaning: "Con chó" },
  { japanese: "さくら", romaji: "sakura", vietnameseMeaning: "Hoa anh đào" },
  { japanese: "ありがとう", romaji: "arigatou", vietnameseMeaning: "Cảm ơn" },
  { japanese: "おはよう", romaji: "ohayou", vietnameseMeaning: "Chào buổi sáng" },
  { japanese: "すし", romaji: "sushi", vietnameseMeaning: "Món ăn Sushi" },
  { japanese: "さかな", romaji: "sakana", vietnameseMeaning: "Con cá" },
  { japanese: "みず", romaji: "mizu", vietnameseMeaning: "Nước uống" },
  { japanese: "やま", romaji: "yama", vietnameseMeaning: "Ngọn núi" },
  { japanese: "かわ", romaji: "kawa", vietnameseMeaning: "Con sông" },
  { japanese: "ともだち", romaji: "tomodachi", vietnameseMeaning: "Bạn bè" },
  { japanese: "ほん", romaji: "hon", vietnameseMeaning: "Quyển sách" },
  { japanese: "にほん", romaji: "nihon", vietnameseMeaning: "Nước Nhật Bản" },
  { japanese: "せんせい", romaji: "sensei", vietnameseMeaning: "Thầy cô giáo" },
  { japanese: "がくせい", romaji: "gakusei", vietnameseMeaning: "Học sinh, sinh viên" },
  { japanese: "うち", romaji: "uchi", vietnameseMeaning: "Ngôi nhà" },
  { japanese: "あめ", romaji: "ame", vietnameseMeaning: "Cơn mưa / Viên kẹo" },
  { japanese: "くるま", romaji: "kuruma", vietnameseMeaning: "Xe hơi, ô tô" },
  { japanese: "てんぷら", romaji: "tenpura", vietnameseMeaning: "Món chiên Tempura" },
  { japanese: "たべます", romaji: "tabemasu", vietnameseMeaning: "Hành động Ăn" },
  { japanese: "みます", romaji: "mimasu", vietnameseMeaning: "Hành động Nhìn / Xem" },
  { japanese: "はな", romaji: "hana", vietnameseMeaning: "Bông hoa / Cái mũi" },
  { japanese: "とり", romaji: "tori", vietnameseMeaning: "Con chim" },
  { japanese: "くも", romaji: "kumo", vietnameseMeaning: "Đám mây / Con nhện" },
  { japanese: "たいよう", romaji: "taiyou", vietnameseMeaning: "Mặt trời" },
  { japanese: "つき", romaji: "tsuki", vietnameseMeaning: "Mặt trăng" },
  { japanese: "かぜ", romaji: "kaze", vietnameseMeaning: "Cơn gió / Cảm cúm" },
  { japanese: "ゆき", romaji: "yuki", vietnameseMeaning: "Tuyết rơi" },
  { japanese: "あさ", romaji: "asa", vietnameseMeaning: "Buổi sáng" },
  { japanese: "よる", romaji: "yoru", vietnameseMeaning: "Buổi tối, ban đêm" }
];
