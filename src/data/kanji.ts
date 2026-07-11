export interface KanjiWord {
  kanji: string;
  onYomi: string;
  kunYomi: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  category: "numbers" | "time" | "currency";
}

export const BASIC_KANJI: KanjiWord[] = [
  // --- CHỮ SỐ (NUMBERS) ---
  {
    kanji: "一",
    onYomi: "イチ (ichi)",
    kunYomi: "ひと (hito)",
    meaning: "Số một (Nhất)",
    example: "一日 (ついたち)",
    exampleMeaning: "Ngày mùng 1 tháng",
    category: "numbers"
  },
  {
    kanji: "二",
    onYomi: "ニ (ni)",
    kunYomi: "ふた (futa)",
    meaning: "Số hai (Nhị)",
    example: "二日 (ふつか)",
    exampleMeaning: "Ngày mùng 2",
    category: "numbers"
  },
  {
    kanji: "三",
    onYomi: "サン (san)",
    kunYomi: "みっ (mit)",
    meaning: "Số ba (Tam)",
    example: "三日 (みっか)",
    exampleMeaning: "Ngày mùng 3 / Ba ngày",
    category: "numbers"
  },
  {
    kanji: "四",
    onYomi: "シ (shi)",
    kunYomi: "よん / よっ (yon / yot)",
    meaning: "Số bốn (Tứ)",
    example: "四日 (よっか)",
    exampleMeaning: "Ngày mùng 4 / Bốn ngày",
    category: "numbers"
  },
  {
    kanji: "五",
    onYomi: "ゴ (go)",
    kunYomi: "いつ (itsu)",
    meaning: "Số năm (Ngũ)",
    example: "五日 (いつか)",
    exampleMeaning: "Ngày mùng 5 / Năm ngày",
    category: "numbers"
  },
  {
    kanji: "六",
    onYomi: "ロク (roku)",
    kunYomi: "むっ (mut)",
    meaning: "Số sáu (Lục)",
    example: "六日 (むいか)",
    exampleMeaning: "Ngày mùng 6 / Sáu ngày",
    category: "numbers"
  },
  {
    kanji: "七",
    onYomi: "シチ (shichi)",
    kunYomi: "なな (nana)",
    meaning: "Số bảy (Thất)",
    example: "七日 (なのか)",
    exampleMeaning: "Ngày mùng 7 / Bảy ngày",
    category: "numbers"
  },
  {
    kanji: "八",
    onYomi: "ハチ (hachi)",
    kunYomi: "よう (you)",
    meaning: "Số tám (Bát)",
    example: "八日 (ようか)",
    exampleMeaning: "Ngày mùng 8 / Tám ngày",
    category: "numbers"
  },
  {
    kanji: "九",
    onYomi: "キュウ / ク (kyuu / ku)",
    kunYomi: "ここの (kokono)",
    meaning: "Số chín (Cửu)",
    example: "九日 (ここのか)",
    exampleMeaning: "Ngày mùng 9 / Chín ngày",
    category: "numbers"
  },
  {
    kanji: "十",
    onYomi: "ジュウ (juu)",
    kunYomi: "とお (too)",
    meaning: "Số mười (Thập)",
    example: "十日 (とおか)",
    exampleMeaning: "Ngày mùng 10 / Mười ngày",
    category: "numbers"
  },
  {
    kanji: "百",
    onYomi: "ヒャク (hyaku)",
    kunYomi: "もも (momo)",
    meaning: "Một trăm (Bách)",
    example: "三百 (さんびゃく)",
    exampleMeaning: "Ba trăm (300)",
    category: "numbers"
  },
  {
    kanji: "千",
    onYomi: "セン (sen)",
    kunYomi: "ち (chi)",
    meaning: "Một nghìn (Thiên)",
    example: "三千 (さんぜん)",
    exampleMeaning: "Ba nghìn (3000)",
    category: "numbers"
  },
  {
    kanji: "万",
    onYomi: "マン / バン (man / ban)",
    kunYomi: "N/A",
    meaning: "Mười nghìn / Vạn (Vạn)",
    example: "一万 (いちまん)",
    exampleMeaning: "Một vạn (10,000)",
    category: "numbers"
  },

  // --- THỜI GIAN (TIME) ---
  {
    kanji: "日",
    onYomi: "ニチ / ジツ (nichi / jitsu)",
    kunYomi: "ひ / び / か (hi / bi / ka)",
    meaning: "Ngày / Mặt trời (Nhật)",
    example: "日本 (にほん)",
    exampleMeaning: "Nhật Bản",
    category: "time"
  },
  {
    kanji: "月",
    onYomi: "ゲツ / ガツ (getsu / gatsu)",
    kunYomi: "つき (tsuki)",
    meaning: "Tháng / Mặt trăng (Nguyệt)",
    example: "今月 (こんげつ)",
    exampleMeaning: "Tháng này",
    category: "time"
  },
  {
    kanji: "火",
    onYomi: "カ (ka)",
    kunYomi: "ひ (hi)",
    meaning: "Lửa / Thứ Ba (Hỏa)",
    example: "火曜日 (かようび)",
    exampleMeaning: "Thứ Ba",
    category: "time"
  },
  {
    kanji: "水",
    onYomi: "スイ (sui)",
    kunYomi: "みず (mizu)",
    meaning: "Nước / Thứ Tư (Thủy)",
    example: "水曜日 (すいようび)",
    exampleMeaning: "Thứ Tư",
    category: "time"
  },
  {
    kanji: "木",
    onYomi: "モク / ボク (moku / boku)",
    kunYomi: "き (ki)",
    meaning: "Cây / Thứ Năm (Mộc)",
    example: "木曜日 (もくようび)",
    exampleMeaning: "Thứ Năm",
    category: "time"
  },
  {
    kanji: "金",
    onYomi: "キン / コン (kin / kon)",
    kunYomi: "かね (kane)",
    meaning: "Vàng / Tiền / Thứ Sáu (Kim)",
    example: "金曜日 (きんようび)",
    exampleMeaning: "Thứ Sáu",
    category: "time"
  },
  {
    kanji: "土",
    onYomi: "ド / ト (do / to)",
    kunYomi: "つち (tsuchi)",
    meaning: "Đất / Thứ Bảy (Thổ)",
    example: "土曜日 (どようび)",
    exampleMeaning: "Thứ Bảy",
    category: "time"
  },
  {
    kanji: "年",
    onYomi: "ネン (nen)",
    kunYomi: "とし (toshi)",
    meaning: "Năm (Niên)",
    example: "今年 (ことし)",
    exampleMeaning: "Năm nay",
    category: "time"
  },
  {
    kanji: "時",
    onYomi: "ジ (ji)",
    kunYomi: "とき (toki)",
    meaning: "Giờ / Thời gian (Thời)",
    example: "何時 (なんじ)",
    exampleMeaning: "Mấy giờ",
    category: "time"
  },
  {
    kanji: "分",
    onYomi: "フン / プン (fun / pun)",
    kunYomi: "わ・かる (wa-karu)",
    meaning: "Phút / Phân chia (Phân)",
    example: "五分 (ごふん)",
    exampleMeaning: "5 phút",
    category: "time"
  },
  {
    kanji: "半",
    onYomi: "ハン (han)",
    kunYomi: "なか・ば (naka-ba)",
    meaning: "Nửa / Rưỡi (Bán)",
    example: "三時半 (さんじはん)",
    exampleMeaning: "3 giờ rưỡi (3:30)",
    category: "time"
  },
  {
    kanji: "週",
    onYomi: "シュウ (shuu)",
    kunYomi: "N/A",
    meaning: "Tuần (Chu)",
    example: "毎週 (まいしゅう)",
    exampleMeaning: "Hàng tuần",
    category: "time"
  },
  {
    kanji: "間",
    onYomi: "カン (kan)",
    kunYomi: "あいだ / ま (aida / ma)",
    meaning: "Khoảng / Ở giữa (Gian)",
    example: "時間 (じかん)",
    exampleMeaning: "Thời gian / Tiếng đồng hồ",
    category: "time"
  },
  {
    kanji: "今",
    onYomi: "コン (kon)",
    kunYomi: "いま (ima)",
    meaning: "Bây giờ / Hiện tại (Kim)",
    example: "今日 (きょう)",
    exampleMeaning: "Hôm nay",
    category: "time"
  },

  // --- TIỀN TỆ (CURRENCY) ---
  {
    kanji: "円",
    onYomi: "エン (en)",
    kunYomi: "まる・い (maru-i)",
    meaning: "Đồng Yên Nhật / Tròn (Yên)",
    example: "千円 (せんえん)",
    exampleMeaning: "Một nghìn Yên",
    category: "currency"
  },
  {
    kanji: "金",
    onYomi: "キン (kin)",
    kunYomi: "かね (kane)",
    meaning: "Tiền bạc / Vàng (Kim)",
    example: "お金 (おかね)",
    exampleMeaning: "Tiền bạc",
    category: "currency"
  },
  {
    kanji: "銀",
    onYomi: "ギン (gin)",
    kunYomi: "N/A",
    meaning: "Bạc (Ngân)",
    example: "銀行 (ぎんこう)",
    exampleMeaning: "Ngân hàng",
    category: "currency"
  },
  {
    kanji: "札",
    onYomi: "サツ (satsu)",
    kunYomi: "ふだ (fuda)",
    meaning: "Tờ tiền giấy / Thẻ (Trát)",
    example: "一万円札 (いちまんえんさつ)",
    exampleMeaning: "Tờ tiền giấy 1 vạn Yên",
    category: "currency"
  }
];
