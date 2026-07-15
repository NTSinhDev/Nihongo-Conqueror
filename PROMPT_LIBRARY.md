# NIHONGO CONQUEROR - PROMPT LIBRARY FOR LESSON BUILDER

Tài liệu này chứa thư viện Prompt Engineering hoàn chỉnh, chuẩn sư phạm và có tính ổn định cực cao dành cho 4 AI Step thuộc quy trình xây dựng bài học (Lesson Builder) của dự án **Nihongo Conqueror**:
1. **GenerateEnglish**
2. **GenerateVocabularyExamples**
3. **GenerateGrammarExamples**
4. **GenerateReview**

Thư viện được thiết kế để hoạt động với hệ thống AI của Google Gemini thông qua SDK `@google/genai` sử dụng cấu hình `responseSchema` nhằm đảm bảo định dạng JSON trả về chuẩn xác 100%.

---

## 1. STEP: GenerateEnglish

### 1. Mục tiêu của Step
Dịch nghĩa của danh sách từ vựng tiếng Nhật (đã được validate) sang tiếng Anh một cách ngắn gọn, chính xác nhất và gán thẻ từ loại (Category/Part of Speech) chuẩn tiếng Anh (ví dụ: Noun, Verb, Adjective, Adverb, Phrase, Particle, Expression) để hiển thị trong giao diện đa ngôn ngữ của Nihongo Conqueror.

### 2. Input
*   **Level**: Cấp độ JLPT của bài học (N5, N4, N3, N2, N1).
*   **Vocabulary list**: Danh sách từ vựng dạng rút gọn gồm: `id`, `kanji`, `hiragana`, `meaningVi`.

### 3. Output
*   Một đối tượng JSON chứa mảng `translations`. Mỗi phần tử trong mảng tương ứng với một từ vựng, bao gồm `id` gốc để liên kết ngược lại, nghĩa tiếng Anh `meaningEn`, và phân loại từ loại `category`.

### 4. JSON Schema mong muốn
```json
{
  "type": "OBJECT",
  "properties": {
    "translations": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "id": { "type": "STRING", "description": "The exact original ID of the vocabulary item to match." },
          "meaningEn": { "type": "STRING", "description": "Concise, precise English translation." },
          "category": { "type": "STRING", "description": "Part of speech category in English, capitalized (e.g. Noun, Verb, Adjective, Adverb, Particle, Phrase, Pronoun, Expression)." }
        },
        "required": ["id", "meaningEn", "category"]
      }
    }
  },
  "required": ["translations"]
}
```

### 5. System Prompt
```text
You are an expert Japanese-English lexicographer and educator. Your task is to process a list of Japanese vocabulary items that already have Vietnamese meanings, provide their exact, natural, and concise English translations, and classify their parts of speech (category) into standard grammatical terms.

Follow these instructions strictly:
1. For each item in the input list, locate its unique 'id' and preserve it exactly in your output. Do not omit any items.
2. Provide a clean, modern, and concise English translation. Avoid overly verbose explanations unless a direct English equivalent does not exist.
3. Classify the part of speech (category) into one of the following standardized English categories: Noun, Verb, Adjective, Adverb, Particle, Pronoun, Conjunction, Preposition, Phrase, Expression. Use Title Case (capitalized).
4. Do not invent, split, merge, or alter any vocabulary items. Return results strictly matching the provided JSON schema. No conversational preamble, markdown, or text outside the JSON.
```

### 6. User Prompt Template
```text
Generate English meanings and part of speech categories for these Japanese vocabulary items matching the lesson level: {{level}}.

Vocabulary Items:
{{vocabulary_json}}
```

### 7. Các biến sẽ được inject
*   `{{level}}`: Chuỗi đại diện cho trình độ JLPT hiện tại (ví dụ: `N5`, `N4`).
*   `{{vocabulary_json}}`: Chuỗi JSON stringify của mảng chứa thông tin từ vựng thô:
    ```json
    [
      { "id": "vocab-1", "kanji": "会う", "hiragana": "あう", "meaningVi": "gặp gỡ" }
    ]
    ```

### 8. Các quy tắc AI phải tuân thủ
*   **Không tự tạo từ mới**: Tuyệt đối không được thêm các từ không có trong danh sách input, hoặc bỏ sót từ vựng.
*   **Trùng khớp ID**: Thuộc tính `id` ở output phải khớp chính xác tuyệt đối với `id` của input (phân biệt cả chữ hoa chữ thường).
*   **Nghĩa tiếng Anh ngắn gọn**: Nghĩa tiếng Anh phải cô đọng (ví dụ: "to meet", "friend", "book"), không viết cả đoạn dài giải thích dông dài trừ khi thật sự cần thiết.
*   **Chuẩn hóa Category**: Gán category theo đúng chuẩn ngữ pháp tiếng Anh. Sử dụng danh sách giới hạn: `Noun`, `Verb`, `Adjective`, `Adverb`, `Particle`, `Pronoun`, `Phrase`, `Expression`.
*   **Output chỉ được là JSON**: Output trả về là một chuỗi JSON thuần túy, tuyệt đối không bọc trong thẻ markdown ```json ... ```, không kèm bất kỳ lời dẫn giải nào trước hay sau JSON.

### 9. Các lỗi AI thường gặp
*   **Trả Markdown**: Bao bọc JSON bằng dấu nháy ngược \`\`\`json.
*   **Mất dấu nối ID**: Thay đổi id của từ vựng (ví dụ đổi `vocab-01` thành `vocab_01` hoặc `1`).
*   **Hallucination từ loại**: Tự đặt ra các tên từ loại dị biệt như "i-adjective", "na-adjective", "verb group 1" thay vì chuẩn chung `Adjective`, `Verb`.
*   **Thêm giải thích dài dòng**: Thay vì dịch "shampoo" thì viết "a liquid preparation with synthetic detergent used for washing the hair...".

### 10. Cách giảm hallucination
*   **Ràng buộc cấu trúc ID**: Đưa ID vào làm khoá bắt buộc (`required: ["id"]`) trong cấu trúc JSON Schema. AI buộc phải ánh xạ đúng ID trước khi suy luận ra nghĩa dịch.
*   **Strict mapping**: Trong prompt chỉ rõ "Your output array length must be exactly equal to the input array length".

### 11. Cách giảm token
*   **Rút gọn Input**: Chỉ gửi qua các trường thiết yếu để dịch (`id`, `kanji`, `hiragana`, `meaningVi`). Loại bỏ toàn bộ các dữ liệu rác, ví dụ, hay ghi chú khác.
*   **Output ngắn gọn**: Giới hạn độ dài chuỗi nghĩa En qua mô tả trong schema.

### 12. Cách tăng độ ổn định
*   **Sử dụng Response Schema**: Bắt buộc truyền `responseSchema` cấu hình chặt chẽ vào tham số gọi của SDK `@google/genai` để Gemini ép cấu trúc ở tầng biên dịch mô hình.
*   **Nhiệt độ thấp (Temperature = 0.0)**: Đặt temperature bằng `0.0` để triệt tiêu tính ngẫu nhiên, tăng tối đa tính nhất quán khi dịch thuật ngữ.

### 13. Ví dụ Input
```json
[
  { "id": "v-01", "kanji": "猫", "hiragana": "ねこ", "meaningVi": "con mèo" },
  { "id": "v-02", "kanji": "食べる", "hiragana": "たべる", "meaningVi": "ăn" }
]
```

### 14. Ví dụ Output
```json
{
  "translations": [
    {
      "id": "v-01",
      "meaningEn": "cat",
      "category": "Noun"
    },
    {
      "id": "v-02",
      "meaningEn": "to eat",
      "category": "Verb"
    }
  ]
}
```

---

## 2. STEP: GenerateVocabularyExamples

### 1. Mục tiêu của Step
Tạo ra chính xác một câu ví dụ tiếng Nhật (kèm chữ Kanji đúng trình độ, có Furigana dưới dạng Hiragana tương ứng, bản dịch tiếng Việt và bản dịch tiếng Anh) cho từng từ vựng trong danh sách. Câu ví dụ phải tự nhiên, mang tính ứng dụng cao và phù hợp với trình độ người học.

### 2. Input
*   **Level**: Cấp độ JLPT hiện tại (N5, N4, N3, N2, N1) để khống chế độ phức tạp của câu và từ vựng đi kèm.
*   **Vocabulary list**: Danh sách từ vựng gồm: `id`, `kanji`, `hiragana`, `meaningVi`, `category`.

### 3. Output
*   Một đối tượng JSON chứa mảng `examples` với các câu ví dụ tương ứng. Mỗi phần tử chứa: `vocabularyId` (để khớp lại từ vựng gốc), câu tiếng Nhật `japanese`, phiên âm `hiragana` (toàn bộ câu được viết bằng Hiragana và các khoảng trắng phân tách từ phù hợp nếu ở trình độ sơ cấp), bản dịch nghĩa tiếng Việt `meaningVi` và tiếng Anh `meaningEn`.

### 4. JSON Schema mong muốn
```json
{
  "type": "OBJECT",
  "properties": {
    "examples": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "vocabularyId": { "type": "STRING", "description": "The exact ID of the original vocabulary item." },
          "japanese": { "type": "STRING", "description": "Natural Japanese sentence using appropriate Kanji, Hiragana, Katakana, and punctuation." },
          "hiragana": { "type": "STRING", "description": "The entire sentence converted completely to Hiragana (including particles, verb endings, and nouns, separated by spaces to aid pronunciation)." },
          "meaningVi": { "type": "STRING", "description": "Highly accurate, natural Vietnamese translation of the example sentence." },
          "meaningEn": { "type": "STRING", "description": "Natural English translation of the example sentence." }
        },
        "required": ["vocabularyId", "japanese", "hiragana", "meaningVi", "meaningEn"]
      }
    }
  },
  "required": ["examples"]
}
```

### 5. System Prompt
```text
You are an expert Japanese language educator. Your goal is to write exactly one natural, pedagogically valuable Japanese example sentence for each vocabulary word provided. 

Guidelines for sentence generation:
1. Match the difficulty to the requested JLPT Level. If Level is N5, use very simple grammar structures (e.g., ~です, ~ます, ~ますか, particles は, が, を, に, で) and avoid complex sentence connections.
2. For the 'japanese' field, use standard Japanese writing (Kanji, Hiragana, Katakana). Do not use Kanji that is significantly above the lesson's target level (e.g. for N5, do not use N1/N2 Kanji unless they are highly common like 日本 or 先生, or provide standard writing).
3. For the 'hiragana' field, transcribe the entire 'japanese' sentence into Hiragana. Put spaces between words/phrases to help beginners read it easily (e.g. "わたし は  ほん を  よみます。").
4. Ensure the Vietnamese ('meaningVi') and English ('meaningEn') translations are natural, smooth, and contextual, clearly demonstrating how the target vocabulary word is used.
5. Ensure the target vocabulary word is used in its correct part of speech. Do not omit any vocabularyId from the output.
```

### 6. User Prompt Template
```text
Generate a natural, level-appropriate example sentence for each vocabulary item in this list. 

Target JLPT Level: {{level}}

Vocabulary items:
{{vocabulary_json}}
```

### 7. Các biến sẽ được inject
*   `{{level}}`: Ví dụ `N5` hoặc `N4`.
*   `{{vocabulary_json}}`: Mảng đối tượng từ vựng chứa: `id`, `word` (Kanji hoặc Hiragana), `meaningVi`, `category`.
    ```json
    [
      { "id": "v-01", "word": "犬", "meaningVi": "con chó", "category": "Noun" }
    ]
    ```

### 8. Các quy tắc AI phải tuân thủ
*   **Khống chế Kanji theo cấp độ**: Với N5, chỉ sử dụng Kanji của N5 (ví dụ: 水, 木, 人, 山). Các chữ Kanji khó bắt buộc phải viết bằng Hiragana trong trường `japanese` hoặc không được dùng.
*   **Đồng nhất Hiragana**: Trường `hiragana` phải ghi lại toàn bộ câu bằng Hiragana thuần túy (không chứa Kanji, không chứa Romaji). Đồng thời sử dụng dấu cách phân tách từ để người học dễ đọc.
*   **Tránh ví dụ mang tính sáo rỗng**: Tránh các câu quá chung chung như "Đây là [từ vựng]". Hãy viết câu có bối cảnh giao tiếp cụ thể (ví dụ: "Tôi thích con chó nhỏ" thay vì "Đây là con chó").
*   **Giới hạn số lượng**: Mỗi từ vựng nhận về đúng **1 câu ví dụ** tương đương 1 object trong mảng.

### 9. Các lỗi AI thường gặp
*   **Dùng Kanji quá khó**: Với cấp độ N5, AI dùng các chữ như 綺麗 (kirei) hay 憂鬱 (yuuutsu) mà không có furigana, gây hoảng sợ cho học viên.
*   **Thiếu dấu cách ở trường Hiragana**: Viết liền tù tì trường hiragana "わたしはほんをよみます" làm người mới học cực kỳ khó định hình ranh giới từ vựng.
*   **Sử dụng sai ngữ cảnh từ loại**: Ví dụ từ loại là "Verb" nhưng lại đặt câu dùng nó như một danh từ.

### 10. Cách giảm hallucination
*   **Neo cứng vocabularyId**: Cấu hình schema yêu cầu trường `vocabularyId` là bắt buộc, làm mốc định vị để AI không thể tự sinh ví dụ mập mờ mà không quy về từ vựng cụ thể nào.
*   **One-to-One constraints**: Ghi rõ trong User Prompt: "Every input item must have exactly one matching output item. Match vocabularyId to the input 'id' field."

### 11. Cách giảm token
*   **Cú pháp ví dụ tinh gọn**: Yêu cầu câu ví dụ có độ dài trung bình từ 5-15 từ tiếng Nhật, tránh viết cả câu ghép dài dòng lê thê không cần thiết đối với trình độ cơ bản.

### 12. Cách tăng độ ổn định
*   **Sử dụng Few-shot Prompting (trong User Prompt/System)**: Đưa ra một ví dụ chuẩn mẫu để AI bắt chước đúng phong cách chia từ loại, đặt câu và phân tách khoảng trắng.
*   **Temperature**: Đặt `0.3` để có độ đa dạng và tự nhiên nhất định trong cách đặt câu nhưng vẫn giữ được tính tuân thủ quy tắc cao.

### 13. Ví dụ Input
```json
[
  { "id": "v-01", "word": "あう", "meaningVi": "gặp", "category": "Verb" }
]
```

### 14. Ví dụ Output
```json
{
  "examples": [
    {
      "vocabularyId": "v-01",
      "japanese": "明日、友達に会います。",
      "hiragana": "あした、 ともだち に あいます。",
      "meaningVi": "Ngày mai, tôi sẽ gặp bạn bè.",
      "meaningEn": "Tomorrow, I will meet my friend."
    }
  ]
}
```

---

## 3. STEP: GenerateGrammarExamples

### 1. Mục tiêu của Step
Bổ sung giải thích ngữ pháp bằng cả tiếng Anh (`explanationEn`) và tiếng Việt (`explanationVi`), gán nghĩa tiếng Anh (`meaningEn`) cho cấu trúc ngữ pháp đó, và quan trọng nhất là tạo ra các ví dụ cụ thể (hoặc các mẩu hội thoại ngắn A-B) giúp trực quan hóa cấu trúc ngữ pháp một cách sinh động nhất.

### 2. Input
*   **Level**: Cấp độ JLPT (N5 - N1) để kiểm soát độ phức tạp.
*   **Grammar list**: Danh sách cấu trúc gồm: `id`, `pattern` (mẫu ngữ pháp), `meaningVi`, `explanationVi` (giải thích tiếng Việt ban đầu).

### 3. Output
*   Đối tượng JSON chứa mảng `grammarDetails`. Mỗi phần tử bao gồm: `grammarId` để tham chiếu, `explanationEn` (giải thích cách dùng bằng tiếng Anh), `explanationVi` (giải thích tiếng Việt đã được trau chuốt hơn), `meaningEn` (nghĩa tiếng Anh của cấu trúc), và mảng `examples` chứa từ 1 đến 2 câu ví dụ hoặc mẩu hội thoại A-B.

### 4. JSON Schema mong muốn
```json
{
  "type": "OBJECT",
  "properties": {
    "grammarDetails": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "grammarId": { "type": "STRING", "description": "The exact ID of the original grammar item." },
          "explanationEn": { "type": "STRING", "description": "Clear pedagogical English explanation of the grammar pattern's usage, conjugation, and context." },
          "explanationVi": { "type": "STRING", "description": "Clear pedagogical Vietnamese explanation of the grammar pattern." },
          "meaningEn": { "type": "STRING", "description": "The English meaning or translation equivalent of the pattern (e.g. 'want to do something' or 'please do...')." },
          "examples": {
            "type": "ARRAY",
            "items": {
              "type": "OBJECT",
              "properties": {
                "japanese": { "type": "STRING", "description": "Japanese example sentence or short A-B dialogue utilizing this pattern." },
                "hiragana": { "type": "STRING", "description": "Complete Hiragana transcription of the japanese sentence/dialogue, preserving A-B indicators if present, with spaces separating words." },
                "meaningVi": { "type": "STRING", "description": "Vietnamese translation of the example sentence/dialogue." },
                "meaningEn": { "type": "STRING", "description": "English translation of the example sentence/dialogue." }
              },
              "required": ["japanese", "hiragana", "meaningVi", "meaningEn"]
            },
            "minItems": 1,
            "maxItems": 2
          }
        },
        "required": ["grammarId", "explanationEn", "explanationVi", "meaningEn", "examples"]
      }
    }
  },
  "required": ["grammarDetails"]
}
```

### 5. System Prompt
```text
You are an expert Japanese grammar specialist and language curriculum developer. Your task is to elaborate on Japanese grammar patterns by generating bilingual explanations and contextual examples.

For each grammar pattern:
1. Provide a clear pedagogical explanation in English ('explanationEn') and Vietnamese ('explanationVi') showing:
   - How to conjugate verbs, adjectives, or nouns with this pattern (e.g., V-dict + と, N + から).
   - The nuance of this pattern compared to similar ones (if applicable).
   - In what contexts it is typically used (formal, informal, polite).
2. Translate the grammar pattern's core meaning into English ('meaningEn').
3. Generate exactly 1 to 2 high-quality examples. These examples can be single sentences or short A-B dialogues (highly recommended for conversational reinforcement).
4. For dialogues, format them with speaker tags in the 'japanese' field like "A: そうですか。 B: はい、そうです。" and keep this format consistent in the 'hiragana', 'meaningVi', and 'meaningEn' fields.
5. In the 'hiragana' field, transcribe everything into Hiragana, using spaces between words. Do not use Kanji.
6. Match the syntactic and vocabulary difficulty strictly to the requested JLPT Level. Do not introduce vocabulary that is far beyond the target level.
```

### 6. User Prompt Template
```text
Generate explanations and example dialogues/sentences for these Japanese grammar patterns. Ensure the linguistic complexity matches the level: {{level}}.

Grammar patterns to process:
{{grammar_json}}
```

### 7. Các biến sẽ được inject
*   `{{level}}`: Cấp độ hiện tại (ví dụ: `N5`).
*   `{{grammar_json}}`: Mảng cấu trúc ngữ pháp thô:
    ```json
    [
      { "id": "g-01", "pattern": "～たいです", "meaningVi": "Muốn làm gì đó", "explanationVi": "Diễn tả nguyện vọng của bản thân" }
    ]
    ```

### 8. Các quy tắc AI phải tuân thủ
*   **Ưu tiên hình thức hội thoại A-B**: Đối với các mẫu ngữ pháp mang tính tương tác (như xin phép, nhờ vả, rủ rê), hãy ưu tiên thiết kế ví dụ dạng hội thoại A-B ngắn 2 câu để học viên thấy rõ ngữ cảnh phản xạ thực tế.
*   **Giải thích công thức chia từ**: Giải thích phải chỉ rõ cấu trúc kết hợp từ (ví dụ: "Động từ thể ます bỏ ます cộng たいです").
*   **Tránh dùng Kanji ngoài trình độ**: Không dùng chữ Kanji của N3/N2 trong bài học N5. Nếu buộc phải dùng, hãy chuyển thành Hiragana ở phần `japanese`.
*   **Độ dài ví dụ vừa phải**: Hội thoại tối đa 4 lượt thoại, câu ví dụ đơn tối đa 15 chữ Nhật.

### 9. Các lỗi AI thường gặp
*   **Quên chia thể động từ**: Giải thích nhưng không chỉ ra cách nối từ, khiến học viên không biết phải đổi động từ sang thể gì trước khi ghép.
*   **Lệch pha định dạng hội thoại**: Ở phần `japanese` viết hội thoại dạng "A: ... B: ..." nhưng ở phần `hiragana` lại viết liền một mạch không có nhãn người nói "A:" và "B:".
*   **Không dịch nghĩa tiếng Anh của cấu trúc**: Để trống trường `meaningEn` hoặc sao chép nguyên mẫu tiếng Việt sang.

### 10. Cách giảm hallucination
*   **Cung cấp cấu trúc ví dụ có sẵn**: Đưa vào một mẫu cấu trúc hội thoại chuẩn mực trong tài liệu hướng dẫn hoặc system prompt để định hình hành vi lập luận của AI.
*   **Yêu cầu đối chiếu**: Bắt buộc AI đối chiếu ý nghĩa mẫu ngữ pháp với từ vựng phổ biến trong trình độ để tránh sinh ra ví dụ chứa từ vựng quá xa lạ.

### 11. Cách giảm token
*   **Giới hạn số lượng ví dụ**: Neo cứng thuộc tính `"maxItems": 2` cho mảng `examples` trong schema để chặn AI tự sinh 4-5 ví dụ dông dài gây tràn token vô ích.

### 12. Cách tăng độ ổn định
*   **Phân chia nhiệm vụ ngôn ngữ**: Đặt định dạng schema tường minh với các trường riêng biệt (`explanationEn`, `explanationVi`). Việc tách biệt trường ngôn ngữ giúp AI suy nghĩ mạch lạc, không bị chồng chéo ngôn ngữ này lấn át ngôn ngữ kia.
*   **Temperature**: Đặt `0.2` để kiểm soát độ chính xác của ngữ pháp học thuật tốt hơn.

### 13. Ví dụ Input
```json
[
  { 
    "id": "g-01", 
    "pattern": "～てください", 
    "meaningVi": "Hãy làm gì đó...", 
    "explanationVi": "Dùng để yêu cầu, sai khiến một cách lịch sự" 
  }
]
```

### 14. Ví dụ Output
```json
{
  "grammarDetails": [
    {
      "grammarId": "g-01",
      "explanationEn": "Used to request or instruct the listener politely to perform an action. Conjugation: change the verb to its -te form and append ください (kudasai).",
      "explanationVi": "Dùng để đưa ra yêu cầu hoặc chỉ dẫn người nghe thực hiện một hành động nào đó một cách lịch sự. Cách chia: Động từ chia sang thể て (te) rồi cộng thêm ください.",
      "meaningEn": "Please do...",
      "examples": [
        {
          "japanese": "A: すみません、日本語で話してください。 B: はい、分かりました。",
          "hiragana": "A: すみません、 にほんご で はなしてください。 B: はい、 わかりました。",
          "meaningVi": "A: Xin lỗi, xin hãy nói bằng tiếng Nhật. B: Vâng, tôi hiểu rồi.",
          "meaningEn": "A: Excuse me, please speak in Japanese. B: Yes, I understand."
        }
      ]
    }
  ]
}
```

---

## 4. STEP: GenerateReview

### 1. Mục tiêu của Step
Tạo ra một phần tóm tắt tổng hợp bài học sâu sắc và một bộ câu hỏi trắc nghiệm tương tác (từ 3 đến 5 câu) dựa trên chính danh sách từ vựng và cấu trúc ngữ pháp đã học. Quiz giúp củng cố kiến thức, kiểm tra khả năng ghi nhớ tức thời và cung cấp giải thích sư phạm chi tiết để người học tự sửa sai.

### 2. Input
*   **Level**: Cấp độ JLPT (N5 - N1).
*   **Lesson Title**: Tiêu đề tiếng Việt của bài học để AI cá nhân hóa lời tóm tắt.
*   **Vocabulary list**: Danh sách từ vựng đã xử lý ở các bước trước (gồm từ tiếng Nhật và nghĩa tiếng Việt).
*   **Grammar list**: Danh sách ngữ pháp đã xử lý ở các bước trước (gồm mẫu câu và nghĩa tiếng Việt).

### 3. Output
*   Đối tượng JSON chứa lời tóm tắt bài học tiếng Việt `summaryVi` và tiếng Anh `summaryEn`. Đồng thời chứa mảng `quickQuiz` (mỗi câu hỏi gồm chuỗi câu hỏi `question`, mảng 4 lựa chọn `options`, chỉ số đáp án đúng `answerIndex` dạng 0-indexed integer, và lời giải thích chi tiết bằng tiếng Việt `explanation`).

### 4. JSON Schema mong muốn
```json
{
  "type": "OBJECT",
  "properties": {
    "summaryVi": { "type": "STRING", "description": "A comprehensive review summary of the lesson written in encouraging, professional Vietnamese, highlighting key vocabulary and grammar rules." },
    "summaryEn": { "type": "STRING", "description": "A comprehensive review summary written in professional English." },
    "quickQuiz": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "question": { "type": "STRING", "description": "The multiple-choice question in Japanese (with Furigana in brackets if needed, or simple Kanji) asking about vocabulary or grammar from the lesson." },
          "options": {
            "type": "ARRAY",
            "items": { "type": "STRING", "description": "Exactly one possible answer choice." },
            "minItems": 4,
            "maxItems": 4
          },
          "answerIndex": { "type": "INTEGER", "description": "The 0-based index of the correct option in the options array (must be 0, 1, 2, or 3)." },
          "explanation": { "type": "STRING", "description": "Detailed pedagogical explanation in Vietnamese explaining why the selected option is correct and why other options are incorrect." }
        },
        "required": ["question", "options", "answerIndex", "explanation"]
      },
      "minItems": 3,
      "maxItems": 5
    }
  },
  "required": ["summaryVi", "quickQuiz"]
}
```

### 5. System Prompt
```text
You are an expert Japanese curriculum designer and test examiner. Your goal is to create an engaging, comprehensive summary review of the lesson, and compile an interactive multiple-choice quiz of 3 to 5 questions to test the user's understanding of the lesson's core materials.

Requirements for the Summary:
1. Provide 'summaryVi' in warm, professional Vietnamese. Summarize what the student has learned in this lesson (words, verbs, grammar) and provide actionable study advice.
2. Provide 'summaryEn' in encouraging English.

Requirements for the Quiz:
1. Generate between 3 and 5 questions based strictly on the vocabulary and grammar patterns provided in the input list. Do not test items outside this scope.
2. For each question:
   - Create 4 clear options. Make sure options are highly plausible but distinct. Do not create silly or obviously wrong options.
   - Set 'answerIndex' to the correct 0-based index pointing to the right option in the 'options' array. For example, if the 3rd option is correct, answerIndex must be 2. Double-check this index to ensure 100% accuracy.
   - Write a detailed 'explanation' in Vietnamese. Explain the exact rule or meaning, translate the question sentence, and clarify why the distractor options are incorrect.
3. Design a variety of question types: filling in particles, choosing the correct vocabulary meaning, choosing the correct conjugation form of a verb, or selecting the appropriate dialogue response.
4. Keep the difficulty appropriate to the lesson level. Do not markdown, wrap, or write explanatory text outside the specified JSON schema.
```

### 6. User Prompt Template
```text
Create a lesson review summary and a multiple-choice interactive quiz based on the following details.

Lesson Title: {{lesson_title}}
JLPT Level: {{level}}

Vocabulary List (strictly use these to construct questions):
{{vocabulary_json}}

Grammar Patterns (strictly use these to construct questions):
{{grammar_json}}
```

### 7. Các biến sẽ được inject
*   `{{lesson_title}}`: Ví dụ `Bài 1: Chào hỏi` hoặc `Bài 5: Đi lại`.
*   `{{level}}`: Cấp độ hiện tại (ví dụ: `N5`).
*   `{{vocabulary_json}}`: Mảng đối tượng từ vựng của bài học.
*   `{{grammar_json}}`: Mảng đối tượng ngữ pháp của bài học.

### 8. Các quy tắc AI phải tuân thủ
*   **Chỉ hỏi kiến thức trong bài**: Không được tạo câu hỏi về những từ vựng hay ngữ pháp chưa từng xuất hiện trong danh sách đầu vào, nhằm tránh gây ức chế cho học viên.
*   **Đúng 4 lựa chọn**: Mỗi câu hỏi bắt buộc phải có đúng **4 phần tử** trong mảng `options`.
*   **0-indexed answerIndex**: Đáp án đúng bắt buộc là một số nguyên nằm trong khoảng `[0, 3]`. Tuyệt đối không dùng chỉ số dạng chữ hoặc bắt đầu từ 1.
*   **Giải thích sư phạm sâu sắc**: Lời giải thích phải ghi rõ bản dịch câu hỏi, chỉ ra dấu hiệu nhận biết đáp án đúng (ví dụ: "Vì danh từ đi trước là địa điểm chuyển động và động từ đi sau là 行く nên ta dùng trợ từ へ...").
*   **Độ phủ kiến thức**: Đảm bảo bộ quiz có cả câu hỏi về từ vựng lẫn ngữ pháp một cách cân bằng.

### 9. Các lỗi AI thường gặp
*   **Lệch chỉ số đáp án**: AI đặt đáp án đúng ở vị trí thứ 1 (tức index 0) nhưng gán biến `answerIndex` bằng `1` (do quen tay đếm từ 1), khiến hệ thống chấm điểm bị sai lệch hoàn toàn.
*   **Đáp án lặp hoặc trùng lặp**: Các lựa chọn gây nhiễu bị trùng lặp nội dung với nhau do sinh ngẫu nhiên.
*   **Hỏi từ ngoài giáo trình**: Tự ý mượn từ vựng cao cấp để làm nhiễu nhưng vô tình tạo thành câu đố quá khó với trình độ sơ cấp.
*   **Giải thích quá ngắn**: Chỉ ghi vỏn vẹn "Đáp án đúng là A." mà không phân tích tại sao hay dịch nghĩa câu hỏi.

### 10. Cách giảm hallucination
*   **Giới hạn tài nguyên câu hỏi**: Viết rõ trong prompt: "You are forbidden from importing external Japanese vocabulary. Treat the provided lists as your entire dictionary."
*   **Tận dụng bộ lọc dữ liệu**: Ép AI sinh câu hỏi theo mẫu cố định (ví dụ câu hỏi điền vào chỗ trống dùng dấu gạch dưới `___`).

### 11. Cách giảm token
*   **Giới hạn số câu hỏi**: Thiết lập thuộc tính `"maxItems": 5` và `"minItems": 3` để ngăn chặn AI cao hứng viết liền 10-15 câu trắc nghiệm làm tràn bộ nhớ đệm và vượt ngưỡng xử lý.

### 12. Cách tăng độ ổn định
*   **Cơ chế Validation kép trước khi xuất**: Thêm dòng lệnh tự kiểm tra vào prompt: "Self-correcting phase: Before formatting the final JSON, read your options array, find the correct string, find its index, and write that index into answerIndex."
*   **Temperature**: Đặt `0.4` để đảm bảo các câu hỏi trắc nghiệm phong phú, sáng tạo, không trùng lặp mô-típ nhưng giải thích vẫn giữ được khuôn mẫu mô phạm chặt chẽ.

### 13. Ví dụ Input
```json
{
  "lesson_title": "Bài 2: Giao tiếp tại công ty",
  "level": "N5",
  "vocabulary": [
    { "word": "じしょ", "meaningVi": "Từ điển" },
    { "word": "これ", "meaningVi": "Cái này" }
  ],
  "grammar": [
    { "pattern": "これ は ～ です", "meaningVi": "Cái này là..." }
  ]
}
```

### 14. Ví dụ Output
```json
{
  "summaryVi": "Chúc mừng bạn đã hoàn thành Bài 2! Trong bài này, chúng ta đã làm quen với các đại từ chỉ định đồ vật như 'これ' (cái này) cùng cấu trúc khẳng định cơ bản nhất 'これ は ～ です'. Hãy chăm chỉ ôn tập và thực hành gọi tên các đồ vật xung quanh bạn nhé!",
  "summaryEn": "Congratulations on completing Lesson 2! In this lesson, we mastered demonstrative pronouns like 'これ' (this) and the core sentence pattern 'これ は ～ です' to identify objects. Try labeling things around you to practice!",
  "quickQuiz": [
    {
      "question": "「これ は じしょ です。」 có nghĩa là gì?",
      "options": [
        "Cái này là quyển từ điển.",
        "Cái kia là quyển từ điển.",
        "Đây không phải là từ điển.",
        "Kia là quyển từ điển phải không?"
      ],
      "answerIndex": 0,
      "explanation": "Câu hỏi sử dụng đại từ chỉ định đồ vật ở gần người nói là 「これ」 (cái này) và danh từ 「じしょ」 (từ điển). Do đó, nghĩa chuẩn xác của câu là 'Cái này là quyển từ điển.'. Các phương án khác dùng từ chỉ định xa hoặc dạng phủ định, nghi vấn nên đều sai."
    }
  ]
}
```

---

## 5. TỔNG HỢP CHIẾN LƯỢC TỐI ƯU HÓA PROMPT ENGINEERING

| Kỹ thuật tối ưu | Chi tiết áp dụng trong Lesson Builder | Lợi ích |
| :--- | :--- | :--- |
| **Response Schema Enforcement** | Sử dụng tính năng `responseSchema` của SDK `@google/genai` (Gemini API) cho tất cả các bước. | Ép mô hình sinh cấu trúc JSON hợp lệ tuyệt đối, loại bỏ hoàn toàn lỗi SyntaxError khi parse chuỗi. |
| **Semantic Anchoring (Neo ngữ nghĩa)** | Sử dụng thuộc tính ID gốc làm khóa chính liên kết giữa các bước xử lý dữ liệu. | Đảm bảo tính liên kết dữ liệu mượt mà từ validate -> tokenize -> dịch thuật -> ví dụ -> quizzing. |
| **Zero-Based Indexing Double-Check** | Yêu cầu AI tự rà soát vị trí đáp án đúng trước khi điền vào `answerIndex`. | Triệt tiêu lỗi sai đáp án do lệch chỉ số (lỗi đếm từ 1 thay vì đếm từ 0). |
| **Vocabulary Bounds Boundary** | Đóng khung không gian kiến thức đầu vào, cấm AI tự ý bổ sung từ vựng mới ngoài danh sách. | Tránh hiện tượng ảo tưởng (hallucination) kiến thức quá tầm trình độ bài học. |
| **Token-Saving Strict Boundaries** | Khống chế nghiêm ngặt số lượng phần tử tối đa (`maxItems`) và chiều dài ký tự. | Tiết kiệm chi phí gọi API, giảm độ trễ (latency), tránh dông dài mất trọng tâm sư phạm. |
