export interface HiraganaChar {
  hiragana: string;
  romaji: string;
  vietnamesePronunciation: string;
  row: string;
  mnemonic?: string;
  isDouble?: boolean;
}

export const HIRAGANA_GROUPS: { [key: string]: { label: string; chars: HiraganaChar[] } } = {
  a: {
    label: "Hàng A (あ い う え お)",
    chars: [
      { hiragana: "あ", romaji: "a", vietnamesePronunciation: "a", row: "a", mnemonic: "Nhìn giống chữ A viết cách điệu có vòng tròn" },
      { hiragana: "い", romaji: "i", vietnamesePronunciation: "i", row: "a", mnemonic: "Hai nét song song giống hai hạt cơm 'i'" },
      { hiragana: "う", romaji: "u", vietnamesePronunciation: "u", row: "a", mnemonic: "Giống hình dáng một người đang cúi 'u' người xuống" },
      { hiragana: "え", romaji: "e", vietnamesePronunciation: "e", row: "a", mnemonic: "Nhìn hao hao chữ 'e' cách điệu hoặc vệt chim bay" },
      { hiragana: "お", romaji: "o", vietnamesePronunciation: "o", row: "a", mnemonic: "Gợi nhớ đến quả 'ô' hoặc người cầm ô nhảy qua vũng nước" }
    ]
  },
  ka: {
    label: "Hàng KA (か き く け こ)",
    chars: [
      { hiragana: "か", romaji: "ka", vietnamesePronunciation: "ka", row: "ka", mnemonic: "Nhìn giống chiếc khẩu súng đang 'ca' hát với dấu phẩy" },
      { hiragana: "き", romaji: "ki", vietnamesePronunciation: "ki", row: "ka", mnemonic: "Trông giống chiếc chìa khóa ('key')" },
      { hiragana: "く", romaji: "ku", vietnamesePronunciation: "ku", row: "ka", mnemonic: "Giống chiếc mỏ chim đang hót 'khu' khu" },
      { hiragana: "け", romaji: "ke", vietnamesePronunciation: "ke", row: "ka", mnemonic: "Giống như thùng bia 'kê' lên kệ gỗ" },
      { hiragana: "こ", romaji: "ko", vietnamesePronunciation: "ko", row: "ka", mnemonic: "Hai nét song song giống hai khúc tre xếp lại 'cạnh' nhau" }
    ]
  },
  sa: {
    label: "Hàng SA (さ し す せ そ)",
    chars: [
      { hiragana: "さ", romaji: "sa", vietnamesePronunciation: "sa", row: "sa", mnemonic: "Giống nét nhảy 'xa' hoặc bộ vị một phím nhạc" },
      { hiragana: "し", romaji: "shi", vietnamesePronunciation: "si", row: "sa", mnemonic: "Dáng cong mềm mại như sợi tóc 'si' tình hoặc lưỡi câu" },
      { hiragana: "す", romaji: "su", vietnamesePronunciation: "su", row: "sa", mnemonic: "Giống dây đu xích đu 'su' xoắn giữa" },
      { hiragana: "せ", romaji: "se", vietnamesePronunciation: "se", row: "sa", mnemonic: "Trông giống ai đó đang 'xế' chiều tựa vào chiếc ghế" },
      { hiragana: "そ", romaji: "so", vietnamesePronunciation: "so", row: "sa", mnemonic: "Một nét uốn lượn liên tục giống đường may 'sỏ' kim" }
    ]
  },
  ta: {
    label: "Hàng TA (た ち つ て と)",
    chars: [
      { hiragana: "た", romaji: "ta", vietnamesePronunciation: "ta", row: "ta", mnemonic: "Nhìn giống chữ 'ta' hoặc vần 't' ghép với 'a'" },
      { hiragana: "ち", romaji: "chi", vietnamesePronunciation: "chi", row: "ta", mnemonic: "Trông hao hao số 5 nhưng là chữ 'chi'" },
      { hiragana: "つ", romaji: "tsu", vietnamesePronunciation: "tsư", row: "ta", mnemonic: "Dáng sóng thần cuộn trào kêu 'tsu-na-mi'" },
      { hiragana: "て", romaji: "te", vietnamesePronunciation: "tê", row: "ta", mnemonic: "Giống cánh tay đang vươn ra 'tê' tái rờ đồ vật" },
      { hiragana: "と", romaji: "to", vietnamesePronunciation: "to", row: "ta", mnemonic: "Xoắn như một cái gai đâm vào ngón chân 'to' đùng" }
    ]
  },
  na: {
    label: "Hàng NA (な に ぬ ね の)",
    chars: [
      { hiragana: "な", romaji: "na", vietnamesePronunciation: "na", row: "na", mnemonic: "Giống hình một nữ tu quỳ lạy thánh giá (Nun -> Na)" },
      { hiragana: "に", romaji: "ni", vietnamesePronunciation: "ni", row: "na", mnemonic: "Một nét đứng cùng hai nét ngang gợi ý chữ 'ni' nỉ" },
      { hiragana: "ぬ", romaji: "nu", vietnamesePronunciation: "nu", row: "na", mnemonic: "Nét cuộn tròn tựa như bát mì sợi 'noodle'" },
      { hiragana: "ね", romaji: "ne", vietnamesePronunciation: "nê", row: "na", mnemonic: "Chú mèo vẫy đuôi thắt nút bên góc phải (Neko -> Ne)" },
      { hiragana: "の", romaji: "no", vietnamesePronunciation: "no", row: "na", mnemonic: "Vòng tròn cấm, biển báo 'No' entry" }
    ]
  },
  ha: {
    label: "Hàng HA (は ひ ふ へ ほ)",
    chars: [
      { hiragana: "は", romaji: "ha", vietnamesePronunciation: "ha", row: "ha", mnemonic: "Cạnh trái có vạch thẳng, bên phải như mặt cười 'ha ha'" },
      { hiragana: "ひ", romaji: "hi", vietnamesePronunciation: "hi", row: "ha", mnemonic: "Cái miệng rộng đang 'hí' hửng mỉm cười" },
      { hiragana: "ふ", romaji: "fu", vietnamesePronunciation: "phư", row: "ha", mnemonic: "Hình vẽ ngọn núi Phú Sĩ ('Fu-ji') hùng vĩ" },
      { hiragana: "へ", romaji: "he", vietnamesePronunciation: "hê", row: "ha", mnemonic: "Giống ngọn đồi lượn đỉnh nhọn hướng lên 'hê' hả" },
      { hiragana: "ほ", romaji: "ho", vietnamesePronunciation: "ho", row: "ha", mnemonic: "Trông giống chữ HA nhưng có thêm chân mũ phía trên" }
    ]
  },
  ma: {
    label: "Hàng MA (ま み む め も)",
    chars: [
      { hiragana: "ま", romaji: "ma", vietnamesePronunciation: "ma", row: "ma", mnemonic: "Giống cột thánh giá có hai vạch ngang dễ thương 'ma' mị" },
      { hiragana: "み", romaji: "mi", vietnamesePronunciation: "mi", row: "ma", mnemonic: "Giống số 21 cách điệu liên nét" },
      { hiragana: "む", romaji: "mu", vietnamesePronunciation: "mu", row: "ma", mnemonic: "Như chiếc mũi bò tót kêu tiếng 'muuu'" },
      { hiragana: "め", romaji: "me", vietnamesePronunciation: "mê", row: "ma", mnemonic: "Trông giống NU nhưng nét cuối hất bay tự do không cuộn vòng" },
      { hiragana: "も", romaji: "mo", vietnamesePronunciation: "mo", row: "ma", mnemonic: "Lưỡi câu cá kéo lên 'mồi' ngon hai vạch" }
    ]
  },
  ya: {
    label: "Hàng YA (や ゆ よ)",
    chars: [
      { hiragana: "や", romaji: "ya", vietnamesePronunciation: "ya", row: "ya", mnemonic: "Mái nhà có con chim 'ya-mê-tê' đậu trên" },
      { hiragana: "ゆ", romaji: "yu", vietnamesePronunciation: "yu", row: "ya", mnemonic: "Nhìn giống một con cá lớn đang bơi lội 'yu' dương" },
      { hiragana: "よ", romaji: "yo", vietnamesePronunciation: "yo", row: "ya", mnemonic: "Giống phím khóa sol lộn ngược nhảy 'yo-yo'" }
    ]
  },
  ra: {
    label: "Hàng RA (ら り る れ ろ)",
    chars: [
      { hiragana: "ら", romaji: "ra", vietnamesePronunciation: "ra", row: "ra", mnemonic: "Con lạc đà ngẩng đầu 'ra' rả ăn cỏ" },
      { hiragana: "り", romaji: "ri", vietnamesePronunciation: "ri", row: "ra", mnemonic: "Nét ngắn bên trái, nét dài rủ lượn cong bên phải" },
      { hiragana: "る", romaji: "ru", vietnamesePronunciation: "ru", row: "ra", mnemonic: "Số 3 thắt một vòng tròn ngủ khò 'ru' êm" },
      { hiragana: "れ", romaji: "re", vietnamesePronunciation: "rê", row: "ra", mnemonic: "Bản sao của NE nhưng đuôi quành hướng ra ngoài như 'rễ' cây" },
      { hiragana: "ろ", romaji: "ro", vietnamesePronunciation: "ro", row: "ra", mnemonic: "Giống RU nhưng không có thắt nút uốn ở cuối" }
    ]
  },
  wa: {
    label: "Hàng WA & N (わ を ん)",
    chars: [
      { hiragana: "わ", romaji: "wa", vietnamesePronunciation: "wa", row: "wa", mnemonic: "Tương tự RE và NE nhưng đuôi cuộn rộng mượt mà" },
      { hiragana: "を", romaji: "wo", vietnamesePronunciation: "ô/gô", row: "wa", mnemonic: "Người thợ đang lắc đũa chỉ 'wo' hát" },
      { hiragana: "ん", romaji: "n", vietnamesePronunciation: "n/ng", row: "wa", mnemonic: "Chữ 'h' cách điệu hoặc đuôi âm nhạc ngắt ngắn 'n'" }
    ]
  },
  dakuten: {
    label: "Biến âm Dakuten (Voiced)",
    chars: [
      { hiragana: "が", romaji: "ga", vietnamesePronunciation: "ga", row: "dakuten", mnemonic: "Biến âm từ か (ka)" },
      { hiragana: "ぎ", romaji: "gi", vietnamesePronunciation: "ghi", row: "dakuten", mnemonic: "Biến âm từ き (ki)" },
      { hiragana: "ぐ", romaji: "gu", vietnamesePronunciation: "gu", row: "dakuten", mnemonic: "Biến âm từ く (ku)" },
      { hiragana: "げ", romaji: "ge", vietnamesePronunciation: "ghê", row: "dakuten", mnemonic: "Biến âm từ け (ke)" },
      { hiragana: "ご", romaji: "go", vietnamesePronunciation: "gô", row: "dakuten", mnemonic: "Biến âm từ こ (ko)" },
      { hiragana: "ざ", romaji: "za", vietnamesePronunciation: "da/da-dự", row: "dakuten", mnemonic: "Biến âm từ さ (sa)" },
      { hiragana: "じ", romaji: "ji", vietnamesePronunciation: "di", row: "dakuten", mnemonic: "Biến âm từ し (shi)" },
      { hiragana: "ず", romaji: "zu", vietnamesePronunciation: "du", row: "dakuten", mnemonic: "Biến âm từ す (su)" },
      { hiragana: "ぜ", romaji: "ze", vietnamesePronunciation: "dê", row: "dakuten", mnemonic: "Biến âm từ せ (se)" },
      { hiragana: "ぞ", romaji: "zo", vietnamesePronunciation: "dô", row: "dakuten", mnemonic: "Biến âm từ そ (so)" },
      { hiragana: "だ", romaji: "da", vietnamesePronunciation: "đa", row: "dakuten", mnemonic: "Biến âm từ た (ta)" },
      { hiragana: "ぢ", romaji: "ji", vietnamesePronunciation: "di (ít dùng)", row: "dakuten", mnemonic: "Biến âm từ ち (chi)" },
      { hiragana: "づ", romaji: "zu", vietnamesePronunciation: "du (ít dùng)", row: "dakuten", mnemonic: "Biến âm từ つ (tsu)" },
      { hiragana: "で", romaji: "de", vietnamesePronunciation: "đê", row: "dakuten", mnemonic: "Biến âm từ て (te)" },
      { hiragana: "ど", romaji: "do", vietnamesePronunciation: "đô", row: "dakuten", mnemonic: "Biến âm từ と (to)" },
      { hiragana: "ば", romaji: "ba", vietnamesePronunciation: "ba", row: "dakuten", mnemonic: "Biến âm từ は (ha)" },
      { hiragana: "び", romaji: "bi", vietnamesePronunciation: "bi", row: "dakuten", mnemonic: "Biến âm từ ひ (hi)" },
      { hiragana: "ぶ", romaji: "bu", vietnamesePronunciation: "bu", row: "dakuten", mnemonic: "Biến âm từ ふ (fu)" },
      { hiragana: "べ", romaji: "be", vietnamesePronunciation: "bê", row: "dakuten", mnemonic: "Biến âm từ へ (he)" },
      { hiragana: "ぼ", romaji: "bo", vietnamesePronunciation: "bô", row: "dakuten", mnemonic: "Biến âm từ ほ (ho)" }
    ]
  },
  handakuten: {
    label: "Bán biến âm Handakuten (P-sound)",
    chars: [
      { hiragana: "ぱ", romaji: "pa", vietnamesePronunciation: "pa", row: "handakuten", mnemonic: "Biến âm từ は (ha) với vòng tròn maru" },
      { hiragana: "ぴ", romaji: "pi", vietnamesePronunciation: "pi", row: "handakuten", mnemonic: "Biến âm từ ひ (hi) với vòng tròn maru" },
      { hiragana: "ぷ", romaji: "pu", vietnamesePronunciation: "pu", row: "handakuten", mnemonic: "Biến âm từ ふ (fu) với vòng tròn maru" },
      { hiragana: "ぺ", romaji: "pe", vietnamesePronunciation: "pê", row: "handakuten", mnemonic: "Biến âm từ へ (he) với vòng tròn maru" },
      { hiragana: "ぽ", romaji: "po", vietnamesePronunciation: "pô", row: "handakuten", mnemonic: "Biến âm từ ほ (ho) with maru circle" }
    ]
  },
  yoon: {
    label: "Âm Ghép (Yōon - Hiragana)",
    chars: [
      { hiragana: "きゃ", romaji: "kya", vietnamesePronunciation: "kya", row: "yoon", mnemonic: "Ki + ya nhỏ" },
      { hiragana: "きゅ", romaji: "kyu", vietnamesePronunciation: "kyu", row: "yoon", mnemonic: "Ki + yu nhỏ" },
      { hiragana: "きょ", romaji: "kyo", vietnamesePronunciation: "kyo", row: "yoon", mnemonic: "Ki + yo nhỏ" },
      { hiragana: "しゃ", romaji: "sha", vietnamesePronunciation: "sha", row: "yoon", mnemonic: "Shi + ya nhỏ" },
      { hiragana: "しゅ", romaji: "shu", vietnamesePronunciation: "shu", row: "yoon", mnemonic: "Shi + yu nhỏ" },
      { hiragana: "しょ", romaji: "sho", vietnamesePronunciation: "sho", row: "yoon", mnemonic: "Shi + yo nhỏ" },
      { hiragana: "ちゃ", romaji: "cha", vietnamesePronunciation: "cha", row: "yoon", mnemonic: "Chi + ya nhỏ" },
      { hiragana: "ちゅ", romaji: "chu", vietnamesePronunciation: "chu", row: "yoon", mnemonic: "Chi + yu nhỏ" },
      { hiragana: "ちょ", romaji: "cho", vietnamesePronunciation: "cho", row: "yoon", mnemonic: "Chi + yo nhỏ" },
      { hiragana: "にゃ", romaji: "nya", vietnamesePronunciation: "nya", row: "yoon", mnemonic: "Ni + ya nhỏ" },
      { hiragana: "にゅ", romaji: "nyu", vietnamesePronunciation: "nyu", row: "yoon", mnemonic: "Ni + yu nhỏ" },
      { hiragana: "にょ", romaji: "nyo", vietnamesePronunciation: "nyo", row: "yoon", mnemonic: "Ni + yo nhỏ" },
      { hiragana: "ひゃ", romaji: "hya", vietnamesePronunciation: "hya", row: "yoon", mnemonic: "Hi + ya nhỏ" },
      { hiragana: "ひゅ", romaji: "hyu", vietnamesePronunciation: "hyu", row: "yoon", mnemonic: "Hi + yu nhỏ" },
      { hiragana: "ひょ", romaji: "hyo", vietnamesePronunciation: "hyo", row: "yoon", mnemonic: "Hi + yo nhỏ" },
      { hiragana: "みゃ", romaji: "mya", vietnamesePronunciation: "mya", row: "yoon", mnemonic: "Mi + ya nhỏ" },
      { hiragana: "みゅ", romaji: "myu", vietnamesePronunciation: "myu", row: "yoon", mnemonic: "Mi + yu nhỏ" },
      { hiragana: "みょ", romaji: "myo", vietnamesePronunciation: "myo", row: "yoon", mnemonic: "Mi + yo nhỏ" },
      { hiragana: "りゃ", romaji: "rya", vietnamesePronunciation: "rya", row: "yoon", mnemonic: "Ri + ya nhỏ" },
      { hiragana: "りゅ", romaji: "ryu", vietnamesePronunciation: "ryu", row: "yoon", mnemonic: "Ri + yu nhỏ" },
      { hiragana: "りょ", romaji: "ryo", vietnamesePronunciation: "ryo", row: "yoon", mnemonic: "Ri + yo nhỏ" },
      { hiragana: "ぎゃ", romaji: "gya", vietnamesePronunciation: "gya", row: "yoon", mnemonic: "Gi + ya nhỏ" },
      { hiragana: "ぎゅ", romaji: "gyu", vietnamesePronunciation: "gyu", row: "yoon", mnemonic: "Gi + yu nhỏ" },
      { hiragana: "ぎょ", romaji: "gyo", vietnamesePronunciation: "gyo", row: "yoon", mnemonic: "Gi + yo nhỏ" },
      { hiragana: "じゃ", romaji: "ja", vietnamesePronunciation: "ja", row: "yoon", mnemonic: "Ji + ya nhỏ" },
      { hiragana: "じゅ", romaji: "ju", vietnamesePronunciation: "ju", row: "yoon", mnemonic: "Ji + yu nhỏ" },
      { hiragana: "じょ", romaji: "jo", vietnamesePronunciation: "jo", row: "yoon", mnemonic: "Ji + yo nhỏ" },
      { hiragana: "びゃ", romaji: "bya", vietnamesePronunciation: "bya", row: "yoon", mnemonic: "Bi + ya nhỏ" },
      { hiragana: "びゅ", romaji: "byu", vietnamesePronunciation: "byu", row: "yoon", mnemonic: "Bi + yu nhỏ" },
      { hiragana: "びょ", romaji: "byo", vietnamesePronunciation: "byo", row: "yoon", mnemonic: "Bi + yo nhỏ" },
      { hiragana: "ぴゃ", romaji: "pya", vietnamesePronunciation: "pya", row: "yoon", mnemonic: "Pi + ya nhỏ" },
      { hiragana: "ぴゅ", romaji: "pyu", vietnamesePronunciation: "pyu", row: "yoon", mnemonic: "Pi + yu nhỏ" },
      { hiragana: "ぴょ", romaji: "pyo", vietnamesePronunciation: "pyo", row: "yoon", mnemonic: "Pi + yo nhỏ" }
    ]
  }
};

// Sưu tập đầy đủ ký tự Hiragana đơn lẻ
export const ALL_HIRAGANA: HiraganaChar[] = Object.values(HIRAGANA_GROUPS).reduce<HiraganaChar[]>(
  (acc, curr) => [...acc, ...curr.chars],
  []
);
