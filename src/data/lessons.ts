import { VocabularyWord } from "./vocabulary";

export interface LessonGrammar {
  pattern: string;
  explanation: string;
  example: string;
  exampleMeaning: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  category: string;
  grammar: LessonGrammar;
  words: VocabularyWord[];
}

export const N5_LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Bài 1: Giới thiệu bản thân",
    description: "Học cách tự giới thiệu tên, quốc tịch, nghề nghiệp của bản thân và người khác.",
    level: "N5",
    category: "Minna Bài 1",
    grammar: {
      pattern: "N1 は N2 です / では ありません / ですか",
      explanation: "Dùng để khẳng định, phủ định hoặc nghi vấn về danh tính, nghề nghiệp, quốc tịch.",
      example: "わたし は ミラー です。",
      exampleMeaning: "Tôi là Miller."
    },
    words: [
      { japanese: "わたし", romaji: "watashi", vietnameseMeaning: "Tôi" },
      { japanese: "あなた", romaji: "anata", vietnameseMeaning: "Bạn, anh/chị" },
      { japanese: "あの ひと", romaji: "ano hito", vietnameseMeaning: "Người kia" },
      { japanese: "あの かた", romaji: "ano kata", vietnameseMeaning: "Vị kia (lịch sự)" },
      { japanese: "せんせい", romaji: "sensei", vietnameseMeaning: "Thầy/cô giáo" },
      { japanese: "きょうし", romaji: "kyoushi", vietnameseMeaning: "Giáo viên, nghề giáo" },
      { japanese: "がくせい", romaji: "gakusei", vietnameseMeaning: "Học sinh, sinh viên" },
      { japanese: "かいしゃいん", romaji: "kaishain", vietnameseMeaning: "Nhân viên công ty" },
      { japanese: "しゃいん", romaji: "shain", vietnameseMeaning: "Nhân viên công ty ~" },
      { japanese: "ぎんこういん", romaji: "ginkouin", vietnameseMeaning: "Nhân viên ngân hàng" },
      { japanese: "いしゃ", romaji: "isha", vietnameseMeaning: "Bác sĩ" },
      { japanese: "けんきゅうしゃ", romaji: "kenkyuusha", vietnameseMeaning: "Nhà nghiên cứu" },
      { japanese: "だいがく", romaji: "daigaku", vietnameseMeaning: "Trường đại học" },
      { japanese: "びょういん", romaji: "byouin", vietnameseMeaning: "Bệnh viện" },
      { japanese: "だれ", romaji: "dare", vietnameseMeaning: "Ai (hỏi người)" }
    ]
  },
  {
    id: 2,
    title: "Bài 2: Sở hữu & Đồ vật quanh ta",
    description: "Nhận diện các đồ vật học tập, đồ dùng cá nhân và cấu trúc sở hữu của ai đó.",
    level: "N5",
    category: "Minna Bài 2",
    grammar: {
      pattern: "これ/それ/あれ は N です | この/その/あの N1 は N2 です",
      explanation: "Chỉ thị từ chỉ vật và cấu trúc diễn tả sự sở hữu 'N1 の N2' (N2 của N1).",
      example: "これ は わたし の ほん です。",
      exampleMeaning: "Đây là cuốn sách của tôi."
    },
    words: [
      { japanese: "これ", romaji: "kore", vietnameseMeaning: "Cái này" },
      { japanese: "それ", romaji: "sore", vietnameseMeaning: "Cái đó" },
      { japanese: "あれ", romaji: "are", vietnameseMeaning: "Cái kia" },
      { japanese: "この", romaji: "kono", vietnameseMeaning: "Này (đi kèm danh từ)" },
      { japanese: "その", romaji: "sono", vietnameseMeaning: "Đó (đi kèm danh từ)" },
      { japanese: "あの", romaji: "ano", vietnameseMeaning: "Kia (đi kèm danh từ)" },
      { japanese: "ほん", romaji: "hon", vietnameseMeaning: "Quyển sách" },
      { japanese: "じしょ", romaji: "jisho", vietnameseMeaning: "Cuốn từ điển" },
      { japanese: "ざっし", romaji: "zasshi", vietnameseMeaning: "Cuốn tạp chí" },
      { japanese: "しんぶん", romaji: "shinbun", vietnameseMeaning: "Tờ báo" },
      { japanese: "のーと", romaji: "nooto", vietnameseMeaning: "Cuốn vở, tập ghi chép" },
      { japanese: "てちょう", romaji: "techou", vietnameseMeaning: "Sổ tay cá nhân" },
      { japanese: "めいし", romaji: "meishi", vietnameseMeaning: "Danh thiếp" },
      { japanese: "かーど", romaji: "kaado", vietnameseMeaning: "Thẻ, Card" },
      { japanese: "かばん", romaji: "kaban", vietnameseMeaning: "Cái cặp, túi xách" }
    ]
  },
  {
    id: 3,
    title: "Bài 3: Địa điểm & Hỏi đường",
    description: "Cách hỏi và chỉ đường đến văn phòng, nhà ăn, nhà vệ sinh hay địa danh công cộng.",
    level: "N5",
    category: "Minna Bài 3",
    grammar: {
      pattern: "ここ/そこ/あそこ は Địa điểm です | N は Địa điểm です",
      explanation: "Chỉ thị vị trí nơi chốn, hỏi địa điểm ở đâu, nguồn gốc xuất xứ của sản phẩm.",
      example: "じむしょ は あそこ です。",
      exampleMeaning: "Văn phòng ở đằng kia."
    },
    words: [
      { japanese: "ここ", romaji: "koko", vietnameseMeaning: "Chỗ này" },
      { japanese: "そこ", romaji: "soko", vietnameseMeaning: "Chỗ đó" },
      { japanese: "あそこ", romaji: "asoko", vietnameseMeaning: "Chỗ kia" },
      { japanese: "どこ", romaji: "doko", vietnameseMeaning: "Chỗ nào" },
      { japanese: "こちら", romaji: "kochira", vietnameseMeaning: "Phía này (lịch sự)" },
      { japanese: "そちら", romaji: "sochira", vietnameseMeaning: "Phía đó (lịch sự)" },
      { japanese: "あちら", romaji: "achira", vietnameseMeaning: "Phía kia (lịch sự)" },
      { japanese: "きょうしつ", romaji: "kyoushitsu", vietnameseMeaning: "Lớp học, phòng học" },
      { japanese: "しょくどう", romaji: "shokudou", vietnameseMeaning: "Nhà ăn, phòng ăn" },
      { japanese: "じむしょ", romaji: "jimusho", vietnameseMeaning: "Văn phòng" },
      { japanese: "かいぎしつ", romaji: "kaigishitsu", vietnameseMeaning: "Phòng họp" },
      { japanese: "うけつけ", romaji: "uketsuke", vietnameseMeaning: "Quầy tiếp tân" },
      { japanese: "といれ", romaji: "toire", vietnameseMeaning: "Nhà vệ sinh" },
      { japanese: "おてあらい", romaji: "otearai", vietnameseMeaning: "Phòng vệ sinh (lịch sự)" },
      { japanese: "うち", romaji: "uchi", vietnameseMeaning: "Ngôi nhà" }
    ]
  },
  {
    id: 4,
    title: "Bài 4: Giờ giấc & Ngày làm việc",
    description: "Học cách đọc giờ, phút, các ngày trong tuần và các động từ cơ bản thời hiện tại/quá khứ.",
    level: "N5",
    category: "Minna Bài 4",
    grammar: {
      pattern: "いま ～じ ～ぷん です | Vます / Vました / Vません | Nから Nまで",
      explanation: "Nói giờ giấc, diễn đạt khoảng thời gian làm việc và chia động từ ở các thời.",
      example: "ぎんこう は ９じ から ３じ まで です。",
      exampleMeaning: "Ngân hàng mở cửa từ 9 giờ đến 3 giờ."
    },
    words: [
      { japanese: "いま", romaji: "ima", vietnameseMeaning: "Bây giờ" },
      { japanese: "おきます", romaji: "okimasu", vietnameseMeaning: "Thức dậy" },
      { japanese: "ねます", romaji: "nemasu", vietnameseMeaning: "Đi ngủ" },
      { japanese: "はたらきます", romaji: "hatarakimasu", vietnameseMeaning: "Làm việc" },
      { japanese: "やすみます", romaji: "yasumimasu", vietnameseMeaning: "Nghỉ ngơi" },
      { japanese: "べんきょうします", romaji: "benkyou shimasu", vietnameseMeaning: "Học tập" },
      { japanese: "おわります", romaji: "owarimasu", vietnameseMeaning: "Kết thúc" },
      { japanese: "あさ", romaji: "asa", vietnameseMeaning: "Buổi sáng" },
      { japanese: "ひる", romaji: "hiru", vietnameseMeaning: "Buổi trưa" },
      { japanese: "ばん", romaji: "ban", vietnameseMeaning: "Buổi tối" },
      { japanese: "きょう", romaji: "kyou", vietnameseMeaning: "Hôm nay" },
      { japanese: "あした", romaji: "ashita", vietnameseMeaning: "Ngày mai" },
      { japanese: "げつようび", romaji: "getsuyoubi", vietnameseMeaning: "Thứ Hai" },
      { japanese: "すいようび", romaji: "suiyoubi", vietnameseMeaning: "Thứ Tư" },
      { japanese: "きんようび", romaji: "kinyoubi", vietnameseMeaning: "Thứ Sáu" }
    ]
  },
  {
    id: 5,
    title: "Bài 5: Di chuyển & Phương tiện",
    description: "Cách nói đi, đến, về một địa danh nào đó bằng phương tiện gì và đi cùng với ai.",
    level: "N5",
    category: "Minna Bài 5",
    grammar: {
      pattern: "Địa điểm へ いきます/きます/かえります | Phương tiện で いきます | Người と いきます",
      explanation: "Di chuyển đến địa điểm bằng phương tiện cụ thể sử dụng các trợ từ へ (e), で (de), と (to).",
      example: "わたし は でんしゃ で うち へ かえります。",
      exampleMeaning: "Tôi đi về nhà bằng tàu điện."
    },
    words: [
      { japanese: "いきます", romaji: "ikimasu", vietnameseMeaning: "Đi" },
      { japanese: "きます", romaji: "kimasu", vietnameseMeaning: "Đến" },
      { japanese: "かえります", romaji: "kaerimasu", vietnameseMeaning: "Trở về" },
      { japanese: "がっこう", romaji: "gakkou", vietnameseMeaning: "Trường học" },
      { japanese: "スーパー", romaji: "suupaa", vietnameseMeaning: "Siêu thị" },
      { japanese: "えき", romaji: "eki", vietnameseMeaning: "Nhà ga" },
      { japanese: "でんしゃ", romaji: "densha", vietnameseMeaning: "Tàu điện" },
      { japanese: "ばす", romaji: "basu", vietnameseMeaning: "Xe buýt" },
      { japanese: "たくしー", romaji: "takushii", vietnameseMeaning: "Xe taxi" },
      { japanese: "じてんしゃ", romaji: "jitensha", vietnameseMeaning: "Xe đạp" },
      { japanese: "ひこうき", romaji: "hikouki", vietnameseMeaning: "Máy bay" },
      { japanese: "ふね", romaji: "fune", vietnameseMeaning: "Thuyền, tàu thủy" },
      { japanese: "あるいて", romaji: "aruite", vietnameseMeaning: "Đi bộ" },
      { japanese: "ともだち", romaji: "tomodachi", vietnameseMeaning: "Bạn bè" },
      { japanese: "ひと", romaji: "hito", vietnameseMeaning: "Người" }
    ]
  },
  {
    id: 6,
    title: "Bài 6: Hành động tác động & Trợ từ を",
    description: "Diễn tả hành động ăn, uống, xem, đọc tác động trực tiếp lên đồ vật và đề nghị cùng thực hiện.",
    level: "N5",
    category: "Minna Bài 6",
    grammar: {
      pattern: "N を Vます | Địa điểm で Vます | いっしょに Vませんか / Vましょう",
      explanation: "Tác động hành động lên một tân ngữ, nơi chốn xảy ra hành động và rủ rê cùng làm gì.",
      example: "いっしょに おちゃ を のみませんか。",
      exampleMeaning: "Cùng uống trà với tôi nhé?"
    },
    words: [
      { japanese: "たべます", romaji: "tabemasu", vietnameseMeaning: "Ăn" },
      { japanese: "のみます", romaji: "nomimasu", vietnameseMeaning: "Uống" },
      { japanese: "すいます", romaji: "suimasu", vietnameseMeaning: "Hút (thuốc)" },
      { japanese: "みます", romaji: "mimasu", vietnameseMeaning: "Nhìn, xem" },
      { japanese: "ききます", romaji: "kikimasu", vietnameseMeaning: "Nghe" },
      { japanese: "よみます", romaji: "yomimasu", vietnameseMeaning: "Đọc" },
      { japanese: "かきます", romaji: "kakimasu", vietnameseMeaning: "Viết, vẽ" },
      { japanese: "かいます", romaji: "kaimasu", vietnameseMeaning: "Mua" },
      { japanese: "とります", romaji: "torimasu", vietnameseMeaning: "Chụp ảnh, lấy" },
      { japanese: "します", romaji: "shimasu", vietnameseMeaning: "Làm, chơi thể thao" },
      { japanese: "あいます", romaji: "aimasu", vietnameseMeaning: "Gặp gỡ (bạn bè)" },
      { japanese: "ごはん", romaji: "gohan", vietnameseMeaning: "Cơm, bữa ăn" },
      { japanese: "おちゃ", romaji: "ocha", vietnameseMeaning: "Trà" },
      { japanese: "おさけ", romaji: "osake", vietnameseMeaning: "Rượu" },
      { japanese: "みず", romaji: "mizu", vietnameseMeaning: "Nước uống" }
    ]
  },
  {
    id: 7,
    title: "Bài 7: Công cụ & Cho nhận cơ bản",
    description: "Diễn đạt việc làm điều gì bằng công cụ/ngôn ngữ gì, trao nhận quà cáp.",
    level: "N5",
    category: "Minna Bài 7",
    grammar: {
      pattern: "Công cụ/Ngôn ngữ で Vます | Người に あげます / もらいます | もう Vました",
      explanation: "Sử dụng công cụ thực hiện hành động, trao nhận giữa người cho - người nhận.",
      example: "わたし は はさみ で かみ を きります。",
      exampleMeaning: "Tôi cắt giấy bằng kéo."
    },
    words: [
      { japanese: "きります", romaji: "kirimasu", vietnameseMeaning: "Cắt" },
      { japanese: "おくります", romaji: "okurimasu", vietnameseMeaning: "Gửi" },
      { japanese: "あげます", romaji: "agemasu", vietnameseMeaning: "Cho, tặng" },
      { japanese: "もらいます", romaji: "moraimasu", vietnameseMeaning: "Nhận" },
      { japanese: "かします", romaji: "kashimasu", vietnameseMeaning: "Cho mượn" },
      { japanese: "かりまs", romaji: "karimasu", vietnameseMeaning: "Mượn" },
      { japanese: "おしえます", romaji: "oshiemasu", vietnameseMeaning: "Dạy, chỉ bảo" },
      { japanese: "ならいます", romaji: "naraimasu", vietnameseMeaning: "Học hỏi (từ ai)" },
      { japanese: "かけます", romaji: "kakemasu", vietnameseMeaning: "Gọi (điện thoại)" },
      { japanese: "て", romaji: "te", vietnameseMeaning: "Bàn tay" },
      { japanese: "はし", romaji: "hashi", vietnameseMeaning: "Đũa" },
      { japanese: "はさみ", romaji: "hasami", vietnameseMeaning: "Cái kéo" },
      { japanese: "ぱそこん", romaji: "pasokon", vietnameseMeaning: "Máy tính cá nhân" },
      { japanese: "てがみ", romaji: "tegami", vietnameseMeaning: "Bức thư" },
      { japanese: "ぷれぜんと", romaji: "purezento", vietnameseMeaning: "Quà tặng" }
    ]
  },
  {
    id: 8,
    title: "Bài 8: Tính từ miêu tả sự vật",
    description: "Miêu tả tính chất, trạng thái của người hay vật bằng tính từ đuôi -i và tính từ đuôi -na.",
    level: "N5",
    category: "Minna Bài 8",
    grammar: {
      pattern: "N は Adj(な) です / Adj(い) です | Adj N | N は どうですか / どんな N ですか",
      explanation: "Dùng tính từ để biểu thị thuộc tính sự vật, nối ý nghĩa bằng trợ từ và từ nối.",
      example: "にほん の たべもの は おいしい です。",
      exampleMeaning: "Đồ ăn Nhật Bản ngon."
    },
    words: [
      { japanese: "きれい [な]", romaji: "kirei", vietnameseMeaning: "Đẹp, sạch sẽ" },
      { japanese: "しずか [な]", romaji: "shizuka", vietnameseMeaning: "Yên tĩnh" },
      { japanese: "にぎやか [な]", romaji: "nigiyaka", vietnameseMeaning: "Náo nhiệt" },
      { japanese: "ゆうめい [な]", romaji: "yuumei", vietnameseMeaning: "Nổi tiếng" },
      { japanese: "しんせつ [な]", romaji: "shinsetsu", vietnameseMeaning: "Tốt bụng, thân thiện" },
      { japanese: "べんり [な]", romaji: "benri", vietnameseMeaning: "Tiện lợi" },
      { japanese: "いい", romaji: "ii", vietnameseMeaning: "Tốt, hay" },
      { japanese: "わるい", romaji: "warui", vietnameseMeaning: "Xấu, tồi" },
      { japanese: "あつい", romaji: "atsui", vietnameseMeaning: "Nóng (thời tiết/cảm giác)" },
      { japanese: "さむい", romaji: "samui", vietnameseMeaning: "Lạnh (thời tiết)" },
      { japanese: "つめたい", romaji: "tsumetai", vietnameseMeaning: "Lạnh (đồ uống/sờ chạm)" },
      { japanese: "むずかしい", romaji: "muzukashii", vietnameseMeaning: "Khó" },
      { japanese: "やさしい", romaji: "yasashii", vietnameseMeaning: "Dễ, hiền từ" },
      { japanese: "たかい", romaji: "takai", vietnameseMeaning: "Đắt, cao" },
      { japanese: "やすい", romaji: "yasui", vietnameseMeaning: "Rẻ" }
    ]
  },
  {
    id: 9,
    title: "Bài 9: Sở thích & Năng lực",
    description: "Học cách nói mình thích gì, giỏi gì, có sở hữu cái gì và cách giải thích lý do vì sao.",
    level: "N5",
    category: "Minna Bài 9",
    grammar: {
      pattern: "N が あります / わかります | N が すき / きらい / じょうず / へた | から (Lý do)",
      explanation: "Trợ từ が đi cùng các động từ trạng thái sở hữu, khả năng, tính từ biểu thị cảm xúc.",
      example: "じかん が ありません から, ほん を よみません。",
      exampleMeaning: "Vì không có thời gian nên tôi không đọc sách."
    },
    words: [
      { japanese: "わかります", romaji: "wakarimasu", vietnameseMeaning: "Hiểu, nắm rõ" },
      { japanese: "あります", romaji: "arimasu", vietnameseMeaning: "Có (đồ vật sở hữu)" },
      { japanese: "すき [な]", romaji: "suki", vietnameseMeaning: "Thích" },
      { japanese: "きらい [な]", romaji: "kirai", vietnameseMeaning: "Ghét, không thích" },
      { japanese: "じょうず [な]", romaji: "jouzu", vietnameseMeaning: "Giỏi" },
      { japanese: "へた [な]", romaji: "heta", vietnameseMeaning: "Kém, dở" },
      { japanese: "りょうり", romaji: "ryouri", vietnameseMeaning: "Món ăn, nấu ăn" },
      { japanese: "のみもの", romaji: "nomimono", vietnameseMeaning: "Đồ uống" },
      { japanese: "スポーツ", romaji: "supootsu", vietnameseMeaning: "Thể thao" },
      { japanese: "おんがく", romaji: "ongaku", vietnameseMeaning: "Âm nhạc" },
      { japanese: "うた", romaji: "uta", vietnameseMeaning: "Bài hát" },
      { japanese: "かんじ", romaji: "kanji", vietnameseMeaning: "Chữ Hán" },
      { japanese: "ひらがな", romaji: "hiragana", vietnameseMeaning: "Chữ Hiragana" },
      { japanese: "じかん", romaji: "jikan", vietnameseMeaning: "Thời gian" },
      { japanese: "ようじ", romaji: "youji", vietnameseMeaning: "Việc bận" }
    ]
  },
  {
    id: 10,
    title: "Bài 10: Sự hiện hữu & Trợ từ vị trí",
    description: "Mô tả đồ vật, con người đang nằm ở vị trí nào (trên, dưới, trong, ngoài, bên cạnh).",
    level: "N5",
    category: "Minna Bài 10",
    grammar: {
      pattern: "Địa điểm に N が あります/います | N は Địa điểm に あります/います",
      explanation: "Phân biệt あります cho vật vô tri, và います cho sinh vật cử động như người và động vật.",
      example: "つくえ の うえ に ほん が あります。",
      exampleMeaning: "Trên bàn có cuốn sách."
    },
    words: [
      { japanese: "あります", romaji: "arimasu", vietnameseMeaning: "Có, ở (vật vô tri)" },
      { japanese: "います", romaji: "imasu", vietnameseMeaning: "Có, ở (người, động vật)" },
      { japanese: "うえ", romaji: "ue", vietnameseMeaning: "Phía trên" },
      { japanese: "した", romaji: "shita", vietnameseMeaning: "Phía dưới" },
      { japanese: "まえ", romaji: "mae", vietnameseMeaning: "Phía trước" },
      { japanese: "うしろ", romaji: "ushiro", vietnameseMeaning: "Phía sau" },
      { japanese: "みぎ", romaji: "migi", vietnameseMeaning: "Phải" },
      { japanese: "ひだり", romaji: "hidari", vietnameseMeaning: "Trái" },
      { japanese: "なか", romaji: "naka", vietnameseMeaning: "Trong" },
      { japanese: "そと", romaji: "soto", vietnameseMeaning: "Ngoài" },
      { japanese: "となり", romaji: "tonari", vietnameseMeaning: "Bên cạnh, sát vách" },
      { japanese: "ちかく", romaji: "chikaku", vietnameseMeaning: "Gần đây" },
      { japanese: "あいだ", romaji: "aida", vietnameseMeaning: "Ở giữa" },
      { japanese: "つくえ", romaji: "tsukue", vietnameseMeaning: "Cái bàn" },
      { japanese: "れいぞうこ", romaji: "reizouko", vietnameseMeaning: "Tủ lạnh" }
    ]
  },
  {
    id: 11,
    title: "Bài 11: Số đếm & Lượng từ",
    description: "Học cách đếm đồ vật thông dụng bằng số đếm thuần Nhật, đếm người, đo đạc thời gian.",
    level: "N5",
    category: "Minna Bài 11",
    grammar: {
      pattern: "Lượng từ (Số đếm) V | Khoảng thời gian に ～かい V | ～だけ",
      explanation: "Đặt lượng từ đúng vị trí trong câu, hỏi tần suất và cách sử dụng giới hạn 'chỉ'.",
      example: "りんご を ４つ かいました。",
      exampleMeaning: "Tôi đã mua 4 quả táo."
    },
    words: [
      { japanese: "ひとつ", romaji: "hitotsu", vietnameseMeaning: "1 cái (đếm vật)" },
      { japanese: "ふたつ", romaji: "futatsu", vietnameseMeaning: "2 cái" },
      { japanese: "みっつ", romaji: "mittsu", vietnameseMeaning: "3 cái" },
      { japanese: "よっつ", romaji: "yottsu", vietnameseMeaning: "4 cái" },
      { japanese: "いつつ", romaji: "itsutsu", vietnameseMeaning: "5 cái" },
      { japanese: "むっつ", romaji: "muttsu", vietnameseMeaning: "6 cái" },
      { japanese: "ななつ", romaji: "nanatsu", vietnameseMeaning: "7 cái" },
      { japanese: "やっつ", romaji: "yatsu", vietnameseMeaning: "8 cái" },
      { japanese: "ここのつ", romaji: "kokonotsu", vietnameseMeaning: "9 cái" },
      { japanese: "とお", romaji: "too", vietnameseMeaning: "10 cái" },
      { japanese: "ひとり", romaji: "hitori", vietnameseMeaning: "1 người" },
      { japanese: "ふたり", romaji: "futari", vietnameseMeaning: "2 người" },
      { japanese: "～にん", romaji: "~nin", vietnameseMeaning: "~ người" },
      { japanese: "～だい", romaji: "~dai", vietnameseMeaning: "~ chiếc (máy móc)" },
      { japanese: "～まい", romaji: "~mai", vietnameseMeaning: "~ tờ, tấm (mỏng)" }
    ]
  },
  {
    id: 12,
    title: "Bài 12: Thì quá khứ & So sánh",
    description: "Chia tính từ/danh từ ở quá khứ, học so sánh hơn kém, so sánh lựa chọn, so sánh nhất.",
    level: "N5",
    category: "Minna Bài 12",
    grammar: {
      pattern: "N1 は N2 より Adj です | N1 と N2 と どちらが Adj ですか | N1 [のなか] で N2 が いちばん Adj です",
      explanation: "So sánh các đối tượng dựa trên tiêu chí tính chất, và so sánh lựa chọn giữa hai vật.",
      example: "にほん と ベトナム と どちら が あつい ですか。",
      exampleMeaning: "Giữa Nhật Bản và Việt Nam thì nơi nào nóng hơn?"
    },
    words: [
      { japanese: "かんたん [na]", romaji: "kantan", vietnameseMeaning: "Đơn giản" },
      { japanese: "ちかい", romaji: "chikai", vietnameseMeaning: "Gần" },
      { japanese: "とおい", romaji: "tooi", vietnameseMeaning: "Xa" },
      { japanese: "はやい", romaji: "hayai", vietnameseMeaning: "Nhanh, sớm" },
      { japanese: "おそい", romaji: "osoi", vietnameseMeaning: "Chậm, muộn" },
      { japanese: "おおい", romaji: "ooi", vietnameseMeaning: "Nhiều người" },
      { japanese: "すくない", romaji: "sukunai", vietnameseMeaning: "Ít người" },
      { japanese: "あたたかい", romaji: "atatakai", vietnameseMeaning: "Ấm áp" },
      { japanese: "すずしい", romaji: "suzushii", vietnameseMeaning: "Mát mẻ" },
      { japanese: "あまい", romaji: "amai", vietnameseMeaning: "Ngọt" },
      { japanese: "からい", romaji: "karai", vietnameseMeaning: "Cay" },
      { japanese: "おmoい", romaji: "omoi", vietnameseMeaning: "Nặng" },
      { japanese: "かるい", romaji: "karui", vietnameseMeaning: "Nhẹ" },
      { japanese: "きせつ", romaji: "kisetsu", vietnameseMeaning: "Mùa" },
      { japanese: "てんき", romaji: "tenki", vietnameseMeaning: "Thời tiết" }
    ]
  },
  {
    id: 13,
    title: "Bài 13: Thể hiện ước muốn",
    description: "Học cách nói mình muốn có cái gì, muốn thực hiện việc gì và diễn tả mục đích đi đâu đó.",
    level: "N5",
    category: "Minna Bài 13",
    grammar: {
      pattern: "N が ほしい です | V-たい です | V-ni Địa điểm へ いきます/きます/かえります",
      explanation: "Bày tỏ ham muốn sở hữu, mong muốn hành động và cấu trúc chỉ mục đích di chuyển.",
      example: "わたし は にほん へ にほんご を べんきょうし に いきます。",
      exampleMeaning: "Tôi đi đến Nhật Bản để học tiếng Nhật."
    },
    words: [
      { japanese: "ほしい", romaji: "hoshii", vietnameseMeaning: "Muốn có" },
      { japanese: "あそびます", romaji: "asobimasu", vietnameseMeaning: "Đi chơi, chơi" },
      { japanese: "およぎます", romaji: "oyogimasu", vietnameseMeaning: "Bơi" },
      { japanese: "むかえます", romaji: "mukaemasu", vietnameseMeaning: "Đón" },
      { japanese: "つかれます", romaji: "tsukaremasu", vietnameseMeaning: "Mệt mỏi" },
      { japanese: "だします", romaji: "dashimasu", vietnameseMeaning: "Nộp, gửi" },
      { japanese: "はいります", romaji: "hairimasu", vietnameseMeaning: "Vào (phòng/bể bơi)" },
      { japanese: "でます", romaji: "demasu", vietnameseMeaning: "Ra ngoài" },
      { japanese: "かいものします", romaji: "kaimono shimasu", vietnameseMeaning: "Mua sắm" },
      { japanese: "しょくじします", romaji: "shokuji shimasu", vietnameseMeaning: "Ăn uống, dùng bữa" },
      { japanese: "さんぽします", romaji: "sanpo shimasu", vietnameseMeaning: "Đi dạo" },
      { japanese: "こうえん", romaji: "kouen", vietnameseMeaning: "Công viên" },
      { japanese: "かわ", romaji: "kawa", vietnameseMeaning: "Sông" },
      { japanese: "びじゅつかん", romaji: "bijutsukan", vietnameseMeaning: "Bảo tàng mỹ thuật" },
      { japanese: "おなか", romaji: "onaka", vietnameseMeaning: "Bụng" }
    ]
  },
  {
    id: 14,
    title: "Bài 14: Thể Te & Nhờ vả lịch sự",
    description: "Bắt đầu làm quen với Thể Te cực kì quan trọng, nhờ vả người khác hoặc diễn đạt đang làm gì.",
    level: "N5",
    category: "Minna Bài 14",
    grammar: {
      pattern: "V-てください | V-ています | V-ましょうか",
      explanation: "Chia động từ nhóm I, II, III sang thể て, đưa ra lời yêu cầu lịch sự hoặc đề nghị hỗ trợ.",
      example: "ちょっと まって ください。",
      exampleMeaning: "Xin vui lòng chờ một chút."
    },
    words: [
      { japanese: "つけます", romaji: "tsukemasu", vietnameseMeaning: "Bật (thiết bị)" },
      { japanese: "けします", romaji: "keshimasu", vietnameseMeaning: "Tắt (thiết bị)" },
      { japanese: "あけます", romaji: "akemasu", vietnameseMeaning: "Mở (cửa/hộp)" },
      { japanese: "しめます", romaji: "shimemasu", vietnameseMeaning: "Đóng (cửa/hộp)" },
      { japanese: "いそぎます", romaji: "isogimasu", vietnameseMeaning: "Vội vã, gấp rút" },
      { japanese: "まちます", romaji: "machimasu", vietnameseMeaning: "Chờ đợi" },
      { japanese: "もちます", romaji: "mochimasu", vietnameseMeaning: "Cầm, mang" },
      { japanese: "とります", romaji: "torimasu", vietnameseMeaning: "Lấy, cầm giúp" },
      { japanese: "てつだいます", romaji: "tetsudaimasu", vietnameseMeaning: "Giúp đỡ, phụ một tay" },
      { japanese: "よびます", romaji: "yobimasu", vietnameseMeaning: "Gọi (taxi/tên)" },
      { japanese: "はなします", romaji: "hanashimasu", vietnameseMeaning: "Nói chuyện, đàm thoại" },
      { japanese: "みせます", romaji: "misemasu", vietnameseMeaning: "Cho xem" },
      { japanese: "おしえます", romaji: "oshiemasu", vietnameseMeaning: "Dạy học, chỉ bảo" },
      { japanese: "はじめます", romaji: "hajimemasu", vietnameseMeaning: "Bắt đầu" },
      { japanese: "ふります", romaji: "furimasu", vietnameseMeaning: "Rơi (mưa, tuyết)" }
    ]
  },
  {
    id: 15,
    title: "Bài 15: Cho phép & Trạng thái kéo dài",
    description: "Học cách xin phép làm gì đó, cấm đoán ai và nói về trạng thái kéo dài (kết hôn, nơi sống).",
    level: "N5",
    category: "Minna Bài 15",
    grammar: {
      pattern: "V-ても いいです | V-ては いけません | V-ています (Trạng thái)",
      explanation: "Diễn đạt sự cho phép, cấm đoán hành vi và nói về thói quen, nghề nghiệp, nơi sống.",
      example: "ここ で しゃしん を とっても いいですか。",
      exampleMeaning: "Tôi chụp ảnh ở đây có được không?"
    },
    words: [
      { japanese: "たちます", romaji: "tachimasu", vietnameseMeaning: "Đứng dậy" },
      { japanese: "すわります", romaji: "suwarimasu", vietnameseMeaning: "Ngồi xuống" },
      { japanese: "つかいます", romaji: "tsukaimasu", vietnameseMeaning: "Sử dụng" },
      { japanese: "おきます", romaji: "okimasu", vietnameseMeaning: "Đặt, để" },
      { japanese: "つくります", romaji: "tsukurimasu", vietnameseMeaning: "Làm, chế tạo" },
      { japanese: "うります", romaji: "urimasu", vietnameseMeaning: "Bán" },
      { japanese: "しります", romaji: "shirimasu", vietnameseMeaning: "Biết, nắm rõ" },
      { japanese: "すみます", romaji: "sumimasu", vietnameseMeaning: "Sống, trú ngụ" },
      { japanese: "けんきゅうします", romaji: "kenkyuu shimasu", vietnameseMeaning: "Nghiên cứu" },
      { japanese: "しりょう", romaji: "shiryou", vietnameseMeaning: "Tài liệu" },
      { japanese: "カタログ", romaji: "katarogu", vietnameseMeaning: "Sách danh mục" },
      { japanese: "じこくひょう", romaji: "jikokuhyou", vietnameseMeaning: "Bảng giờ chạy tàu" },
      { japanese: "はいしゃ", romaji: "haisha", vietnameseMeaning: "Nha sĩ, bác sĩ răng" },
      { japanese: "とこや", romaji: "tokoya", vietnameseMeaning: "Tiệm cắt tóc" },
      { japanese: "しゃくしょ", romaji: "shakusho", vietnameseMeaning: "Tòa thị chính" }
    ]
  },
  {
    id: 16,
    title: "Bài 16: Liên kết câu bằng Thể Te",
    description: "Cách nối nhiều tính từ, danh từ hoặc động từ trong một câu và diễn tả sau khi làm xong gì.",
    level: "N5",
    category: "Minna Bài 16",
    grammar: {
      pattern: "V1-て, V2-て, V3 ます | Adj1-くて, Adj2 です | N1 で, N2 です | V1-て から V2",
      explanation: "Ghép chuỗi hành động theo trình tự thời gian, nối tính từ/danh từ, và diễn tả 'sau khi làm V1'.",
      example: "おふろ に はいって から, ねます。",
      exampleMeaning: "Sau khi tắm bồn xong, tôi sẽ đi ngủ."
    },
    words: [
      { japanese: "のります", romaji: "norimasu", vietnameseMeaning: "Lên xe, đi tàu" },
      { japanese: "おりまs", romaji: "orimasu", vietnameseMeaning: "Xuống tàu xe" },
      { japanese: "のりかえます", romaji: "norikaemasu", vietnameseMeaning: "Chuyển tàu xe" },
      { japanese: "あびます", romaji: "abimasu", vietnameseMeaning: "Tắm vòi sen" },
      { japanese: "いれます", romaji: "iremasu", vietnameseMeaning: "Cho vào, bỏ vào" },
      { japanese: "だします", romaji: "dashimasu", vietnameseMeaning: "Nộp, lấy ra" },
      { japanese: "おろします", romaji: "oroshimasu", vietnameseMeaning: "Rút tiền" },
      { japanese: "おします", romaji: "oshimasu", vietnameseMeaning: "Ấn nút" },
      { japanese: "わかい", romaji: "wakai", vietnameseMeaning: "Trẻ trung" },
      { japanese: "ながい", romaji: "nagai", vietnameseMeaning: "Dài" },
      { japanese: "みじかい", romaji: "mijikai", vietnameseMeaning: "Ngắn" },
      { japanese: "あかるい", romaji: "akaruy", vietnameseMeaning: "Sáng sủa" },
      { japanese: "くらい", romaji: "kurai", vietnameseMeaning: "Tối tăm" },
      { japanese: "からだ", romaji: "karada", vietnameseMeaning: "Cơ thể" },
      { japanese: "あたま", romaji: "atama", vietnameseMeaning: "Đầu" }
    ]
  },
  {
    id: 17,
    title: "Bài 17: Thể Nai & Nghĩa vụ bắt buộc",
    description: "Học cách chia động từ thể phủ định ngắn ない, khuyên đừng làm gì, bắt buộc phải làm.",
    level: "N5",
    category: "Minna Bài 17",
    grammar: {
      pattern: "V-ないで ください | V-なければ なりません | V-なくても いいです",
      explanation: "Khuyên nhủ ai không nên làm gì, biểu đạt bổn phận bắt buộc phải làm, và không cần làm.",
      example: "くすり を のまなければ なりません。",
      exampleMeaning: "Tôi bắt buộc phải uống thuốc."
    },
    words: [
      { japanese: "おぼえます", romaji: "oboemasu", vietnameseMeaning: "Ghi nhớ, nhớ" },
      { japanese: "わすれます", romaji: "wasuremasu", vietnameseMeaning: "Quên" },
      { japanese: "なくします", romaji: "nakushimasu", vietnameseMeaning: "Làm mất" },
      { japanese: "はらいます", romaji: "haraimasu", vietnameseMeaning: "Thanh toán" },
      { japanese: "かえします", romaji: "kaeshimasu", vietnameseMeaning: "Trả lại" },
      { japanese: "でかけます", romaji: "dekakemasu", vietnameseMeaning: "Đi ra ngoài" },
      { japanese: "ぬぎます", romaji: "nugimasu", vietnameseMeaning: "Cởi quần áo/giày" },
      { japanese: "もっていきます", romaji: "motte ikimasu", vietnameseMeaning: "Mang đi" },
      { japanese: "もってきます", romaji: "motte kimasu", vietnameseMeaning: "Mang đến" },
      { japanese: "しんぱいします", romaji: "shinpai shimasu", vietnameseMeaning: "Lo lắng" },
      { japanese: "ざんぎょうします", romaji: "zangyou shimasu", vietnameseMeaning: "Làm thêm giờ" },
      { japanese: "しゅっちょうします", romaji: "shutchou shimasu", vietnameseMeaning: "Đi công tác" },
      { japanese: "くすり", romaji: "kusuri", vietnameseMeaning: "Thuốc" },
      { japanese: "おふろ", romaji: "ofuro", vietnameseMeaning: "Bồn tắm" },
      { japanese: "パスポート", romaji: "pasupooto", vietnameseMeaning: "Hộ chiếu" }
    ]
  },
  {
    id: 18,
    title: "Bài 18: Thể Từ điển & Khả năng",
    description: "Chia động từ sang thể từ điển じしょけい, nói về năng lực bản thân, sở thích, trước khi làm gì.",
    level: "N5",
    category: "Minna Bài 18",
    grammar: {
      pattern: "V-る こと が できます | わたしのしゅみ は V-る こと です | V-る / Nの / Thời gian まえに",
      explanation: "Diễn tả khả năng bẩm sinh hoặc được rèn luyện, giới thiệu sở thích cá nhân, trình tự hành động.",
      example: "にほんご を はなす こと が できます。",
      exampleMeaning: "Tôi có thể nói được tiếng Nhật."
    },
    words: [
      { japanese: "できます", romaji: "dekimasu", vietnameseMeaning: "Có thể" },
      { japanese: "あらいます", romaji: "araimasu", vietnameseMeaning: "Rửa, giặt giũ" },
      { japanese: "ひきます", romaji: "hikimasu", vietnameseMeaning: "Chơi đàn (nhạc cụ)" },
      { japanese: "うたいます", romaji: "utaimasu", vietnameseMeaning: "Hát" },
      { japanese: "あつめます", romaji: "atsumemasu", vietnameseMeaning: "Thu gom, sưu tầm" },
      { japanese: "すてます", romaji: "sutemasu", vietnameseMeaning: "Vứt bỏ" },
      { japanese: "かえます", romaji: "kaemasu", vietnameseMeaning: "Thay đổi" },
      { japanese: "うんてんします", romaji: "unten shimasu", vietnameseMeaning: "Lái xe" },
      { japanese: "よやくします", romaji: "yoyaku shimasu", vietnameseMeaning: "Đặt trước" },
      { japanese: "けんがくします", romaji: "kengaku shimasu", vietnameseMeaning: "Tham quan kiến tập" },
      { japanese: "ピアノ", romaji: "piano", vietnameseMeaning: "Đàn Piano" },
      { japanese: "カード", romaji: "kaado", vietnameseMeaning: "Thẻ, Card" },
      { japanese: "げんきん", romaji: "genkin", vietnameseMeaning: "Tiền mặt" },
      { japanese: "しゅみ", romaji: "shumi", vietnameseMeaning: "Sở thích" },
      { japanese: "にっき", romaji: "nikki", vietnameseMeaning: "Nhật ký" }
    ]
  },
  {
    id: 19,
    title: "Bài 19: Thể Ta & Liệt kê hành động",
    description: "Chia động từ sang thể quá khứ ngắn た, diễn tả kinh nghiệm, liệt kê hành động tiêu biểu.",
    level: "N5",
    category: "Minna Bài 19",
    grammar: {
      pattern: "V-た こと が あります | V-たり, V-たり します | Adj-く/に なります",
      explanation: "Nói về trải nghiệm trong quá khứ, liệt kê một số hành động đại diện, và biến đổi trạng thái.",
      example: "富士山（ふじさん）に のぼった こと が あります。",
      exampleMeaning: "Tôi đã từng leo núi Phú Sĩ."
    },
    words: [
      { japanese: "のぼります", romaji: "noborimasu", vietnameseMeaning: "Leo (núi)" },
      { japanese: "とまります", romaji: "tomarimasu", vietnameseMeaning: "Trọ lại" },
      { japanese: "そうじします", romaji: "soujishimasu", vietnameseMeaning: "Dọn dẹp dọn vệ sinh" },
      { japanese: "せんたくします", romaji: "sentakushimasu", vietnameseMeaning: "Giặt giũ quần áo" },
      { japanese: "なります", romaji: "narimasu", vietnameseMeaning: "Trở nên, trở thành" },
      { japanese: "ねむい", romaji: "nemui", vietnameseMeaning: "Buồn ngủ" },
      { japanese: "つよい", romaji: "tsuyoi", vietnameseMeaning: "Mạnh mẽ" },
      { japanese: "よわい", romaji: "yowai", vietnameseMeaning: "Yếu ớt" },
      { japanese: "からだにいい", romaji: "karada ni ii", vietnameseMeaning: "Tốt cho sức khỏe" },
      { japanese: "むり [な]", romaji: "muri", vietnameseMeaning: "Quá sức, vô lý" },
      { japanese: "ごるふ", romaji: "gorufu", vietnameseMeaning: "Trò chơi Golf" },
      { japanese: "すもう", romaji: "sumou", vietnameseMeaning: "Vật Sumo" },
      { japanese: "おちゃ", romaji: "ocha", vietnameseMeaning: "Trà đạo" },
      { japanese: "てんき", romaji: "tenki", vietnameseMeaning: "Thời tiết" },
      { japanese: "いちど", romaji: "ichido", vietnameseMeaning: "Một lần" }
    ]
  },
  {
    id: 20,
    title: "Bài 20: Thể Thông thường",
    description: "Học cách nói chuyện suồng sã, thân mật với bạn bè, đồng nghiệp thân bằng thể thông thường.",
    level: "N5",
    category: "Minna Bài 20",
    grammar: {
      pattern: "Thể thông thường (Futsuukei) (Động từ, Tính từ, Danh từ)",
      explanation: "Sử dụng thể ngắn (Futsuukei) thay thế hoàn toàn ます / です trong hội thoại không trang trọng.",
      example: "あした とうきょう へ いく？ - うん、いく。",
      exampleMeaning: "Mai đi Tokyo không? - Ừ, đi chứ."
    },
    words: [
      { japanese: "いります", romaji: "irimasu", vietnameseMeaning: "Cần" },
      { japanese: "しらべます", romaji: "shirabemasu", vietnameseMeaning: "Kiểm tra, tra cứu" },
      { japanese: "なおします", romaji: "naoshimasu", vietnameseMeaning: "Sửa chữa" },
      { japanese: "しゅりします", romaji: "shuri shimasu", vietnameseMeaning: "Sửa chữa lớn" },
      { japanese: "でんわします", romaji: "denwashimasu", vietnameseMeaning: "Gọi điện thoại" },
      { japanese: "ぼく", romaji: "boku", vietnameseMeaning: "Tớ (nam giới xưng hô)" },
      { japanese: "きみ", romaji: "kimi", vietnameseMeaning: "Cậu, em" },
      { japanese: "うん", romaji: "un", vietnameseMeaning: "Ừ, vâng (thân mật)" },
      { japanese: "うーん", romaji: "uun", vietnameseMeaning: "Không (thân mật)" },
      { japanese: "サラリーマン", romaji: "sarariiman", vietnameseMeaning: "Nhân viên văn phòng" },
      { japanese: "ことば", romaji: "kotoba", vietnameseMeaning: "Từ vựng, ngôn từ" },
      { japanese: "ぶっか", romaji: "bukka", vietnameseMeaning: "Vật giá, giá cả" },
      { japanese: "きもの", romaji: "kimono", vietnameseMeaning: "Trang phục Kimono" },
      { japanese: "ビザ", romaji: "biza", vietnameseMeaning: "Visa, thị thực" },
      { japanese: "はじめ", romaji: "hajime", vietnameseMeaning: "Sự bắt đầu" }
    ]
  },
  {
    id: 21,
    title: "Bài 21: Ý kiến & Suy nghĩ cá nhân",
    description: "Bày tỏ suy nghĩ cá nhân về thời tiết, sự việc, và cách nói câu gián tiếp trích dẫn ai đó.",
    level: "N5",
    category: "Minna Bài 21",
    grammar: {
      pattern: "V-る/Adj/N(thông thường) と おmoいます | ～ と いいました | ～ でしょう",
      explanation: "Đưa ra phán đoán/suy nghĩ cá nhân, trích dẫn câu nói gián tiếp, và biểu thị sự đồng tình.",
      example: "あした は あめ が fuる と おmoいます。",
      exampleMeaning: "Tôi nghĩ là ngày mai trời sẽ mưa."
    },
    words: [
      { japanese: "おもいます", romaji: "omoimasu", vietnameseMeaning: "Nghĩ, tưởng rằng" },
      { japanese: "いいます", romaji: "iimasu", vietnameseMeaning: "Nói" },
      { japanese: "たります", romaji: "tarimasu", vietnameseMeaning: "Đầy đủ" },
      { japanese: "かちます", romaji: "kachimasu", vietnameseMeaning: "Thắng" },
      { japanese: "まけます", romaji: "makemasu", vietnameseMeaning: "Thua" },
      { japanese: "あります", romaji: "arimasu", vietnameseMeaning: "Có (tổ chức cuộc họp/lễ hội)" },
      { japanese: "役に立ちます", romaji: "yakunitachimasu", vietnameseMeaning: "Hữu ích, có ích" },
      { japanese: "おなじ", romaji: "onaji", vietnameseMeaning: "Giống nhau" },
      { japanese: "たぶん", romaji: "tabun", vietnameseMeaning: "Chắc là, có lẽ" },
      { japanese: "きっと", romaji: "kitto", vietnameseMeaning: "Nhất định" },
      { japanese: "ほんとうに", romaji: "hentouni", vietnameseMeaning: "Thật sự, thực sự" },
      { japanese: "ニュース", romaji: "nyuusu", vietnameseMeaning: "Tin tức" },
      { japanese: "スピーチ", romaji: "supiichi", vietnameseMeaning: "Bài diễn văn, phát biểu" },
      { japanese: "しあい", romaji: "shiai", vietnameseMeaning: "Trận đấu" },
      { japanese: "じけん", romaji: "jiken", vietnameseMeaning: "Vụ án, sự cố" }
    ]
  },
  {
    id: 22,
    title: "Bài 22: Định ngữ bổ nghĩa Danh từ",
    description: "Học cách sử dụng cả một mệnh đề hành động để bổ nghĩa cho danh từ, làm câu chi tiết hơn.",
    level: "N5",
    category: "Minna Bài 22",
    grammar: {
      pattern: "Mệnh đề bổ ngữ (V thể thông thường) + Danh từ",
      explanation: "Động từ thể ngắn đứng trước bổ ngữ trực tiếp cho danh từ, biến mệnh đề thành tính chất danh từ.",
      example: "これは わたし が かいた え です。",
      exampleMeaning: "Đây là bức tranh mà tôi đã vẽ."
    },
    words: [
      { japanese: "きます", romaji: "kimasu", vietnameseMeaning: "Mặc (áo, sơ mi)" },
      { japanese: "はきます", romaji: "hakimasu", vietnameseMeaning: "Mặc (quần, váy), đi giày" },
      { japanese: "かぶります", romaji: "kaburimasu", vietnameseMeaning: "Đội (mũ)" },
      { japanese: "かけます", romaji: "kakemasu", vietnameseMeaning: "Đeo (kính)" },
      { japanese: "うまれます", romaji: "umaremasu", vietnameseMeaning: "Sinh ra" },
      { japanese: "コート", romaji: "kooto", vietnameseMeaning: "Áo khoác" },
      { japanese: "セーター", romaji: "seetaa", vietnameseMeaning: "Áo len" },
      { japanese: "スーツ", romaji: "suutsu", vietnameseMeaning: "Comple, Suit" },
      { japanese: "ぼうし", romaji: "boushi", vietnameseMeaning: "Mũ, nón" },
      { japanese: "めがね", romaji: "megane", vietnameseMeaning: "Kính mắt" },
      { japanese: "よく", romaji: "yoku", vietnameseMeaning: "Thường xuyên" },
      { japanese: "おめでとう", romaji: "omedetou", vietnameseMeaning: "Chúc mừng" },
      { japanese: "やちん", romaji: "yachin", vietnameseMeaning: "Tiền thuê nhà" },
      { japanese: "ダイニングキッチン", romaji: "dainingu kicchin", vietnameseMeaning: "Bếp ăn" },
      { japanese: "わしつ", romaji: "washitsu", vietnameseMeaning: "Phòng kiểu Nhật" }
    ]
  },
  {
    id: 23,
    title: "Bài 23: Chỉ thời điểm & Hệ quả tự nhiên",
    description: "Liên kết sự việc xảy ra ở một thời điểm nhất định (Khi...) và diễn tả quy luật nhân quả (Hễ...).",
    level: "N5",
    category: "Minna Bài 23",
    grammar: {
      pattern: "V-る / V-た / Adj / N の とき | V-ると, ~",
      explanation: "Dùng とき khi nói về mốc thời điểm, dùng と diễn tả hành động dẫn đến kết quả tất yếu tự nhiên.",
      example: "はし を わたる と, ぎんこう が あります。",
      exampleMeaning: "Hễ băng qua cây cầu là sẽ thấy ngân hàng."
    },
    words: [
      { japanese: "ききます", romaji: "kikimasu", vietnameseMeaning: "Hỏi" },
      { japanese: "まわします", romaji: "mawashimasu", vietnameseMeaning: "Xoay, vặn" },
      { japanese: "ひきます", romaji: "hikimasu", vietnameseMeaning: "Kéo, giật" },
      { japanese: "かえます", romaji: "kaemasu", vietnameseMeaning: "Thay đổi" },
      { japanese: "さわります", romaji: "sawarimasu", vietnameseMeaning: "Chạm vào, sờ" },
      { japanese: "でます", romaji: "demasu", vietnameseMeaning: "Ra (tiền thừa thối lại)" },
      { japanese: "あるきます", romaji: "arukimasu", vietnameseMeaning: "Đi bộ" },
      { japanese: "わたります", romaji: "watarimasu", vietnameseMeaning: "Băng qua" },
      { japanese: "まがります", romaji: "magarimasu", vietnameseMeaning: "Rẽ, quẹo" },
      { japanese: "さびしい", romaji: "sabishii", vietnameseMeaning: "Cô đơn, buồn" },
      { japanese: "おゆ", romaji: "oyu", vietnameseMeaning: "Nước nóng" },
      { japanese: "おと", romaji: "oto", vietnameseMeaning: "Âm thanh" },
      { japanese: "サイズ", romaji: "saizu", vietnameseMeaning: "Kích cỡ" },
      { japanese: "こしょう", romaji: "koshou", vietnameseMeaning: "Sự hỏng hóc" },
      { japanese: "みち", romaji: "michi", vietnameseMeaning: "Con đường" }
    ]
  },
  {
    id: 24,
    title: "Bài 24: Cho nhận hành động",
    description: "Thể hiện hành động đem lại lợi ích cho ai đó bằng cách kết hợp Thể Te với cho nhận.",
    level: "N5",
    category: "Minna Bài 24",
    grammar: {
      pattern: "N は わたし に くれる | V-て あげます / もらいます / くれます",
      explanation: "Mô tả hành vi hỗ trợ, làm điều tốt giúp đỡ cho người khác hoặc được người khác ban ơn.",
      example: "さとうさん は わたし に にほんgo を おしえて くれました。",
      exampleMeaning: "Chị Sato đã dạy tiếng Nhật cho tôi."
    },
    words: [
      { japanese: "くれます", romaji: "kuremasu", vietnameseMeaning: "Cho tôi, tặng tôi" },
      { japanese: "つれていきます", romaji: "tsurete ikimasu", vietnameseMeaning: "Dẫn đi" },
      { japanese: "つれてきます", romaji: "tsurete kimasu", vietnameseMeaning: "Dẫn đến" },
      { japanese: "おくります", romaji: "okurimasu", vietnameseMeaning: "Tiễn đưa, tiễn khách" },
      { japanese: "しょうかいします", romaji: "shoukaishimasu", vietnameseMeaning: "Giới thiệu" },
      { japanese: "あんないします", romaji: "annaishimasu", vietnameseMeaning: "Hướng dẫn, dẫn đường" },
      { japanese: "せつめいします", romaji: "setsumeishimasu", vietnameseMeaning: "Giải thích" },
      { japanese: "コピーします", romaji: "kopii shimasu", vietnameseMeaning: "In sao, Copy" },
      { japanese: "おじいさん", romaji: "ojiisan", vietnameseMeaning: "Ông nội/ngoại" },
      { japanese: "おばあさん", romaji: "obaasan", vietnameseMeaning: "Bà nội/ngoại" },
      { japanese: "じゅんび", romaji: "junbi", vietnameseMeaning: "Sự chuẩn bị" },
      { japanese: "ひっこし", romaji: "hikkoshi", vietnameseMeaning: "Chuyển nhà" },
      { japanese: "おかし", romaji: "okashi", vietnameseMeaning: "Bánh kẹo" },
      { japanese: "ホームステイ", romaji: "hoomusutei", vietnameseMeaning: "Homestay" },
      { japanese: "ぜんぶ", romaji: "zenbu", vietnameseMeaning: "Toàn bộ" }
    ]
  },
  {
    id: 25,
    title: "Bài 25: Câu giả định & Điều kiện",
    description: "Cách nói nếu thời tiết/sự việc xảy ra thì sẽ làm gì (Nếu... thì) và cho dù... thì vẫn.",
    level: "N5",
    category: "Minna Bài 25",
    grammar: {
      pattern: "V-たら, ~ (Nếu...) | V-ても, ~ (Mặc dù...)",
      explanation: "Diễn đạt điều kiện giả định xảy ra trong tương lai, hoặc điều kiện nhượng bộ mặc dù vẫn.",
      example: "あめ が ふったら, いきません。 ",
      exampleMeaning: "Nếu trời mưa, tôi sẽ không đi."
    },
    words: [
      { japanese: "かんgえます", romaji: "kangaemasu", vietnameseMeaning: "Suy nghĩ, cân nhắc" },
      { japanese: "つきます", romaji: "tsukimasu", vietnameseMeaning: "Đến nơi" },
      { japanese: "りゅうがくします", romaji: "ryuugaku shimasu", vietnameseMeaning: "Du học" },
      { japanese: "とります", romaji: "torimasu", vietnameseMeaning: "Thêm (tuổi), lấy" },
      { japanese: "いなか", romaji: "inaka", vietnameseMeaning: "Nông thôn, quê hương" },
      { japanese: "たいしかん", romaji: "taishikan", vietnameseMeaning: "Đại sứ quán" },
      { japanese: "グループ", romaji: "guruupu", vietnameseMeaning: "Nhóm, Group" },
      { japanese: "チャンス", romaji: "chansu", vietnameseMeaning: "Cơ hội, Chance" },
      { japanese: "おく", romaji: "oku", vietnameseMeaning: "Trăm triệu" },
      { japanese: "もし", romaji: "moshi", vietnameseMeaning: "Nếu" },
      { japanese: "いくら", romaji: "ikura", vietnameseMeaning: "Bao nhiêu" },
      { japanese: "てんきん", romaji: "tenkin", vietnameseMeaning: "Chuyển công tác" },
      { japanese: "こと", romaji: "koto", vietnameseMeaning: "Việc, chuyện" },
      { japanese: "いっぱい", romaji: "ippai", vietnameseMeaning: "Đầy, nhiều" },
      { japanese: "おせわになりました", romaji: "osewa ni narimashita", vietnameseMeaning: "Cảm ơn đã giúp đỡ" }
    ]
  }
];

export function getUnlockedLessons(): number[] {
  try {
    const saved = localStorage.getItem("japanese_course_unlocked_lessons");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading unlocked lessons", e);
  }
  return [1]; // Default to Lesson 1 unlocked
}

export function saveUnlockLesson(lessonId: number): number[] {
  const current = getUnlockedLessons();
  if (!current.includes(lessonId)) {
    const nextList = [...current, lessonId].sort((a, b) => a - b);
    try {
      localStorage.setItem("japanese_course_unlocked_lessons", JSON.stringify(nextList));
    } catch (e) {
      console.error("Error saving unlocked lessons", e);
    }
    return nextList;
  }
  return current;
}

export function getCompletedLessons(): number[] {
  try {
    const saved = localStorage.getItem("japanese_course_completed_lessons");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading completed lessons", e);
  }
  return [];
}

export function saveCompleteLesson(lessonId: number): number[] {
  const current = getCompletedLessons();
  if (!current.includes(lessonId)) {
    const nextList = [...current, lessonId].sort((a, b) => a - b);
    try {
      localStorage.setItem("japanese_course_completed_lessons", JSON.stringify(nextList));
    } catch (e) {
      console.error("Error saving completed lessons", e);
    }
    return nextList;
  }
  return current;
}
