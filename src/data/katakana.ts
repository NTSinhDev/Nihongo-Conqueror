export interface KatakanaChar {
  hiragana: string; // Keep as 'hiragana' for seamless backwards compatibility with components
  romaji: string;
  vietnamesePronunciation: string;
  row: string;
  mnemonic?: string;
  isDouble?: boolean;
}

export const KATAKANA_GROUPS: { [key: string]: { label: string; chars: KatakanaChar[] } } = {
  a: {
    label: "Hàng A (ア イ ウ エ オ)",
    chars: [
      { hiragana: "ア", romaji: "a", vietnamesePronunciation: "a", row: "a", mnemonic: "Giống vệt mái nhà sườn dốc xuống" },
      { hiragana: "イ", romaji: "i", vietnamesePronunciation: "i", row: "a", mnemonic: "Nhìn giống một người đứng nhìn nghiêng sang phải" },
      { hiragana: "ウ", romaji: "u", vietnamesePronunciation: "u", row: "a", mnemonic: "Giống chữ Hiragana う nhưng có góc nét gọn gàng hơn" },
      { hiragana: "エ", romaji: "e", vietnamesePronunciation: "e", row: "a", mnemonic: "Hình chiếc giá treo đồ bằng sắt có mâm đế đứng vững" },
      { hiragana: "オ", romaji: "o", vietnamesePronunciation: "o", row: "a", mnemonic: "Giống người dang tay sải bước đi dứt khoát" }
    ]
  },
  ka: {
    label: "Hàng KA (カ キ ク ケ コ)",
    chars: [
      { hiragana: "カ", romaji: "ka", vietnamesePronunciation: "ka", row: "ka", mnemonic: "Bản đơn giản hóa của chữ Hiragana か (bỏ dấu phẩy)" },
      { hiragana: "キ", romaji: "ki", vietnamesePronunciation: "ki", row: "ka", mnemonic: "Giống hệt phần đầu trên của chiếc chìa khóa き" },
      { hiragana: "ク", romaji: "ku", vietnamesePronunciation: "ku", row: "ka", mnemonic: "Trông giống số 7 nằm nghiêng hoặc chiếc nón xếp" },
      { hiragana: "ケ", romaji: "ke", vietnamesePronunciation: "ke", row: "ka", mnemonic: "Nhìn hao hao chữ 'ke' kề góc xiên nhọn" },
      { hiragana: "コ", romaji: "ko", vietnamesePronunciation: "ko", row: "ka", mnemonic: "Hình chiếc hộp mở hông trái rất vuông vức" }
    ]
  },
  sa: {
    label: "Hàng SA (サ シ ス セ ソ)",
    chars: [
      { hiragana: "サ", romaji: "sa", vietnamesePronunciation: "sa", row: "sa", mnemonic: "Nhìn tựa như chữ Sa nhưng vuông vắn hơn" },
      { hiragana: "シ", romaji: "shi", vietnamesePronunciation: "si", row: "sa", mnemonic: "Hai mắt cười chấm và một nét hất lượn xiên từ dưới lên" },
      { hiragana: "ス", romaji: "su", vietnamesePronunciation: "su", row: "sa", mnemonic: "Dáng một người trượt tuyết sải đứng một chân" },
      { hiragana: "セ", romaji: "se", vietnamesePronunciation: "se", row: "sa", mnemonic: "Khá giống Hiragana せ bẻ cong vuông dứt khoát" },
      { hiragana: "ソ", romaji: "so", vietnamesePronunciation: "so", row: "sa", mnemonic: "Một chấm ngắn phía trên lệch trái và nét vuốt dài từ trên xuống" }
    ]
  },
  ta: {
    label: "Hàng TA (タ チ ツ テ ト)",
    chars: [
      { hiragana: "タ", romaji: "ta", vietnamesePronunciation: "ta", row: "ta", mnemonic: "Trông hao hao chữ カ (ka) nhưng có nét gạch xéo ngang lòng" },
      { hiragana: "チ", romaji: "chi", vietnamesePronunciation: "chi", row: "ta", mnemonic: "Giống con số vạn tuế 千 hoặc số 1000" },
      { hiragana: "ツ", romaji: "tsu", vietnamesePronunciation: "tsư", row: "ta", mnemonic: "Hai chấm đứng song song và một nét vuốt từ trên dốc xuống (phân biệt màu シ)" },
      { hiragana: "テ", romaji: "te", vietnamesePronunciation: "tê", row: "ta", mnemonic: "Hình mái nhà ăng-ten đứng thu sóng 'tê' tái" },
      { hiragana: "ト", romaji: "to", vietnamesePronunciation: "to", row: "ta", mnemonic: "Nhìn giống chiếc chìa khóa âm nhạc đứng góc xiên phải" }
    ]
  },
  na: {
    label: "Hàng NA (ナ ニ ヌ ネ ノ)",
    chars: [
      { hiragana: "ナ", romaji: "na", vietnamesePronunciation: "na", row: "na", mnemonic: "Phác họa hình lưỡi kiếm gỗ đan chéo" },
      { hiragana: "ニ", romaji: "ni", vietnamesePronunciation: "ni", row: "na", mnemonic: "Hai nét ngang cực song song tựa như chữ nhị (số 2)" },
      { hiragana: "ヌ", romaji: "nu", vietnamesePronunciation: "nu", row: "na", mnemonic: "Giống hình chiếc súng cao su rẽ quạt xiên chéo" },
      { hiragana: "ネ", romaji: "ne", vietnamesePronunciation: "nê", row: "na", mnemonic: "Vẽ cây thánh giá cắm đất kề sườn" },
      { hiragana: "ノ", romaji: "no", vietnamesePronunciation: "no", row: "na", mnemonic: "Một dải sọc vuốt nhẹ duy nhất nghiêng sang trái (biển cấm No)" }
    ]
  },
  ha: {
    label: "Hàng HA (ハ ヒ フ ヘ ホ)",
    chars: [
      { hiragana: "ハ", romaji: "ha", vietnamesePronunciation: "ha", row: "ha", mnemonic: "Tạo hình râu ria hoặc hai nét xòe ra hai bên" },
      { hiragana: "ヒ", romaji: "hi", vietnamesePronunciation: "hi", row: "ha", mnemonic: "Giống chiếc chìa muỗng múc súp đặt ngang" },
      { hiragana: "フ", romaji: "fu", vietnamesePronunciation: "phư", row: "ha", mnemonic: "Trông cực kỳ giống góc mở chóp mỏ chim vẹt" },
      { hiragana: "ヘ", romaji: "he", vietnamesePronunciation: "hê", row: "ha", mnemonic: "Giống hệt gợn sóng hay dốc đồi Hiragana へ" },
      { hiragana: "ホ", romaji: "ho", vietnamesePronunciation: "bô", row: "ha", mnemonic: "Tựa như một thân cây đứng có hai cành nhỏ xòe bên" }
    ]
  },
  ma: {
    label: "Hàng MA (ま み む め も)",
    chars: [
      { hiragana: "マ", romaji: "ma", vietnamesePronunciation: "ma", row: "ma", mnemonic: "Gợi nhớ góc vuông gập như sườn vai người uống nước" },
      { hiragana: "ミ", romaji: "mi", vietnamesePronunciation: "mi", row: "ma", mnemonic: "Ba vệt sọc xiên ngắn lơ lửng song song (mi mi mi)" },
      { hiragana: "ム", romaji: "mu", vietnamesePronunciation: "mu", row: "ma", mnemonic: "Trông tựa góc tam giác gập khuyết chao lượn" },
      { hiragana: "メ", romaji: "me", vietnamesePronunciation: "mê", row: "ma", mnemonic: "Hai vệt chéo cắt nhau dứt khoát như hình chữ X cách điệu" },
      { hiragana: "モ", romaji: "mo", vietnamesePronunciation: "mo", row: "ma", mnemonic: "Rất giống chữ Hán Mao (lông) hay chữ Hiragana も bẻ thẳng" }
    ]
  },
  ya: {
    label: "Hàng YA (ヤ ユ よ)",
    chars: [
      { hiragana: "ヤ", romaji: "ya", vietnamesePronunciation: "ya", row: "ya", mnemonic: "Thừa hưởng dáng dấp tương đồng với Hiragana や" },
      { hiragana: "ユ", romaji: "yu", vietnamesePronunciation: "yu", row: "ya", mnemonic: "Giống một chiếc phễu hoặc đường lùi rẽ xe chữ U góc vuông" },
      { hiragana: "ヨ", romaji: "yo", vietnamesePronunciation: "yo", row: "ya", mnemonic: "Chữ E in hoa lật ngược theo gương phản chiếu" }
    ]
  },
  ra: {
    label: "Hàng RA (ラ リ ル レ ロ)",
    chars: [
      { hiragana: "ラ", romaji: "ra", vietnamesePronunciation: "ra", row: "ra", mnemonic: "Giống phím gạt rẽ nước hoặc hình kẹp gỗ" },
      { hiragana: "リ", romaji: "ri", vietnamesePronunciation: "ri", row: "ra", mnemonic: "Gần như giống hệt nét đứng của Hiragana り" },
      { hiragana: "ル", romaji: "ru", vietnamesePronunciation: "ru", row: "ra", mnemonic: "Hai chân đứng sải choãi sang hai bên làm đế" },
      { hiragana: "レ", romaji: "re", vietnamesePronunciation: "rê", row: "ra", mnemonic: "Một vạch đứng rồi bẻ góc vút thẳng xiên lên bên phải" },
      { hiragana: "ロ", romaji: "ro", vietnamesePronunciation: "ro", row: "ra", mnemonic: "Một hình ô vuông khép kín hoàn hảo không tì vết" }
    ]
  },
  wa: {
    label: "Hàng WA & N (ワ ヲ ン)",
    chars: [
      { hiragana: "ワ", romaji: "wa", vietnamesePronunciation: "wa", row: "wa", mnemonic: "Giống chiếc mũ bảo hiểm úp sườn chừa trần" },
      { hiragana: "ヲ", romaji: "wo", vietnamesePronunciation: "ô", row: "wa", mnemonic: "Hào quang mặt trời tỏa mỡ với hai vệt cắt chéo" },
      { hiragana: "ン", romaji: "n", vietnamesePronunciation: "n/ng", row: "wa", mnemonic: "Một chấm ngắn bên trái và nét hất gốc vuốt chọc xiên (phân biệt màu vs ソ, ツ)" }
    ]
  },
  dakuten: {
    label: "Biến âm Dakuten (Katakana)",
    chars: [
      { hiragana: "ガ", romaji: "ga", vietnamesePronunciation: "ga", row: "dakuten", mnemonic: "Biến âm từ カ (ka)" },
      { hiragana: "ギ", romaji: "gi", vietnamesePronunciation: "ghi", row: "dakuten", mnemonic: "Biến âm từ キ (ki)" },
      { hiragana: "グ", romaji: "gu", vietnamesePronunciation: "gu", row: "dakuten", mnemonic: "Biến âm từ ク (ku)" },
      { hiragana: "ゲ", romaji: "ge", vietnamesePronunciation: "ghê", row: "dakuten", mnemonic: "Biến âm từ ケ (ke)" },
      { hiragana: "ゴ", romaji: "go", vietnamesePronunciation: "gô", row: "dakuten", mnemonic: "Biến âm từ コ (ko)" },
      { hiragana: "ザ", romaji: "za", vietnamesePronunciation: "da", row: "dakuten", mnemonic: "Biến âm từ サ (sa)" },
      { hiragana: "ジ", romaji: "ji", vietnamesePronunciation: "di", row: "dakuten", mnemonic: "Biến âm từ シ (shi)" },
      { hiragana: "ズ", romaji: "zu", vietnamesePronunciation: "du", row: "dakuten", mnemonic: "Biến âm từ ス (su)" },
      { hiragana: "ゼ", romaji: "ze", vietnamesePronunciation: "dê", row: "dakuten", mnemonic: "Biến âm từ セ (se)" },
      { hiragana: "ゾ", romaji: "zo", vietnamesePronunciation: "dô", row: "dakuten", mnemonic: "Biến âm từ ソ (so)" },
      { hiragana: "ダ", romaji: "da", vietnamesePronunciation: "đa", row: "dakuten", mnemonic: "Biến âm từ タ (ta)" },
      { hiragana: "ヂ", romaji: "ji", vietnamesePronunciation: "di (ít dùng)", row: "dakuten", mnemonic: "Biến âm từ チ (chi)" },
      { hiragana: "ヅ", romaji: "zu", vietnamesePronunciation: "du (ít dùng)", row: "dakuten", mnemonic: "Biến âm từ ツ (tsu)" },
      { hiragana: "デ", romaji: "de", vietnamesePronunciation: "đê", row: "dakuten", mnemonic: "Biến âm từ テ (te)" },
      { hiragana: "ド", romaji: "do", vietnamesePronunciation: "đô", row: "dakuten", mnemonic: "Biến âm từ ト (to)" },
      { hiragana: "バ", romaji: "ba", vietnamesePronunciation: "ba", row: "dakuten", mnemonic: "Biến âm từ ハ (ha)" },
      { hiragana: "ビ", romaji: "bi", vietnamesePronunciation: "bi", row: "dakuten", mnemonic: "Biến âm từ ヒ (hi)" },
      { hiragana: "ブ", romaji: "bu", vietnamesePronunciation: "bu", row: "dakuten", mnemonic: "Biến âm từ フ (fu)" },
      { hiragana: "ベ", romaji: "be", vietnamesePronunciation: "bê", row: "dakuten", mnemonic: "Biến âm từ ヘ (he)" },
      { hiragana: "ボ", romaji: "bo", vietnamesePronunciation: "bô", row: "dakuten", mnemonic: "Biến âm từ ホ (ho)" }
    ]
  },
  handakuten: {
    label: "Bán biến âm Handakuten (Katakana)",
    chars: [
      { hiragana: "パ", romaji: "pa", vietnamesePronunciation: "pa", row: "handakuten", mnemonic: "Biến âm từ ハ (ha) với vòng tròn maru" },
      { hiragana: "ピ", romaji: "pi", vietnamesePronunciation: "pi", row: "handakuten", mnemonic: "Biến âm từ ヒ (hi) với vòng tròn maru" },
      { hiragana: "プ", romaji: "pu", vietnamesePronunciation: "pu", row: "handakuten", mnemonic: "Biến âm từ フ (fu) với vòng tròn maru" },
      { hiragana: "ペ", romaji: "pe", vietnamesePronunciation: "pê", row: "handakuten", mnemonic: "Biến âm từ ヘ (he) với vòng tròn maru" },
      { hiragana: "ポ", romaji: "po", vietnamesePronunciation: "pô", row: "handakuten", mnemonic: "Biến âm từ ホ (ho) với maru circle" }
    ]
  }
};

export const ALL_KATAKANA: KatakanaChar[] = Object.values(KATAKANA_GROUPS).reduce<KatakanaChar[]>(
  (acc, curr) => [...acc, ...curr.chars],
  []
);
