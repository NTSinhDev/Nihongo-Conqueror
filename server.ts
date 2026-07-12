import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in your Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API: AI Auto-Categorize Vocabulary
app.post("/api/vocab/categorize", async (req, res) => {
  try {
    const { words, model } = req.body;
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Danh sách từ vựng không hợp lệ hoặc trống." });
    }

    const ai = getAiClient();
    
    // Choose selected model or fallback to gemini-3.5-flash
    const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const chosenModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    // Build a fallback order starting with the user's chosen model
    const fallbackModels = [
      chosenModel,
      ...allowedModels.filter(m => m !== chosenModel)
    ];

    const prompt = `Phân loại danh sách từ vựng tiếng Nhật sau đây thành các nhóm chủ đề hoặc ngữ cảnh sử dụng hợp lý.
Mỗi nhóm nên có một tên tiếng Việt tinh tế (ví dụ: "Chào hỏi xã giao & Nghi thức", "Đại từ & Danh từ chỉ người", "Hành động & Hoạt động thường nhật") kèm theo một mô tả ngắn gọn và một ngữ cảnh (context) sử dụng thực tế.
Mỗi từ trong danh sách đầu vào phải được phân loại chính xác vào một nhóm thích hợp nhất. Đảm bảo giữ nguyên các trường dữ liệu của từ vựng đầu vào (japanese, romaji, vietnameseMeaning, englishMeaning).

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    let response;
    let successModel = chosenModel;
    let lastError = null;

    // Try each model in sequence
    for (const currentModel of fallbackModels) {
      try {
        console.log(`Attempting to generate categorized vocabulary with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một giảng viên tiếng Nhật bản xứ kỳ cựu và chuyên gia ngôn ngữ học. Nhiệm vụ của bạn là nhóm từ vựng của một bài học tiếng Nhật thành các chủ đề, nhóm ý nghĩa hoặc ngữ cảnh giao tiếp cụ thể, giúp học viên dễ dàng ghi nhớ và phân xạ nhanh. Trả về kết quả dưới dạng JSON hoàn toàn hợp lệ.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Danh sách các nhóm từ vựng sau khi đã phân loại",
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: {
                    type: Type.STRING,
                    description: "Tên chủ đề hoặc nhóm ngữ cảnh bằng tiếng Việt (ví dụ: 'Chào hỏi xã giao', 'Địa điểm & Trường học')"
                  },
                  categoryDescription: {
                    type: Type.STRING,
                    description: "Mô tả ngắn gọn, dễ hiểu về nhóm này bằng tiếng Việt"
                  },
                  context: {
                    type: Type.STRING,
                    description: "Ngữ cảnh hoặc tình huống sử dụng thực tế bằng tiếng Việt"
                  },
                  words: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        japanese: { type: Type.STRING },
                        romaji: { type: Type.STRING },
                        vietnameseMeaning: { type: Type.STRING },
                        englishMeaning: { type: Type.STRING }
                      },
                      required: ["japanese", "vietnameseMeaning"]
                    },
                    description: "Danh sách các từ vựng thuộc nhóm này"
                  }
                },
                required: ["categoryName", "categoryDescription", "context", "words"]
              }
            }
          }
        });
        
        successModel = currentModel;
        break; // Stop loop once successful
      } catch (err: any) {
        console.warn(`Model ${currentModel} failed with error:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả các mô hình Gemini hiện tại đều đang bận hoặc quá tải.");
    }

    const resultText = response.text?.trim() || "[]";
    let categorizedData;
    try {
      categorizedData = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText);
      return res.status(500).json({ error: "Lỗi phân tích kết quả phân loại từ AI." });
    }

    return res.json({ categorized: categorizedData, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Categorization Error:", error);
    return res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi phân loại từ vựng bằng AI." });
  }
});

// API: AI Translate Missing English Meanings
app.post("/api/vocab/translate-english", async (req, res) => {
  try {
    const { words, model } = req.body;
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Danh sách từ vựng không hợp lệ hoặc trống." });
    }

    const ai = getAiClient();
    
    // Choose selected model or fallback to gemini-3.5-flash
    const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const chosenModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    const fallbackModels = [
      chosenModel,
      ...allowedModels.filter(m => m !== chosenModel)
    ];

    // Find words that need English meanings
    const missingWords = words.filter(w => !w.englishMeaning || w.englishMeaning.trim() === "");
    
    if (missingWords.length === 0) {
      return res.json({ words, updatedCount: 0, activeModel: chosenModel });
    }

    const prompt = `Dịch nghĩa tiếng Anh cho các từ vựng tiếng Nhật sau đây. 
Hãy phân tích từ tiếng Nhật (Kanji/Hiragana/Katakana) và nghĩa tiếng Việt của nó, sau đó cung cấp nghĩa tiếng Anh chuẩn xác, ngắn gọn và tự nhiên nhất.
Chỉ trả về các cặp từ được yêu cầu trong danh sách đầu vào dưới dạng JSON hoàn toàn hợp lệ.

Danh sách từ vựng cần dịch:
${JSON.stringify(missingWords.map(w => ({ japanese: w.japanese, romaji: w.romaji, vietnameseMeaning: w.vietnameseMeaning })), null, 2)}`;

    let response;
    let successModel = chosenModel;
    let lastError = null;

    // Try each model in sequence
    for (const currentModel of fallbackModels) {
      try {
        console.log(`Attempting to translate vocabulary with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một nhà dịch thuật tiếng Nhật - tiếng Anh chuyên nghiệp. Hãy cung cấp nghĩa tiếng Anh ngắn gọn, chuẩn xác và dễ hiểu cho mỗi từ được truyền vào. Trả về kết quả dưới dạng JSON một mảng các đối tượng chứa japanese và englishMeaning.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Danh sách các bản dịch tiếng Anh của từ vựng tiếng Nhật tương ứng",
              items: {
                type: Type.OBJECT,
                properties: {
                  japanese: { type: Type.STRING, description: "Từ tiếng Nhật ban đầu" },
                  englishMeaning: { type: Type.STRING, description: "Nghĩa tiếng Anh ngắn gọn của từ đó" }
                },
                required: ["japanese", "englishMeaning"]
              }
            }
          }
        });
        
        successModel = currentModel;
        break; // Stop loop once successful
      } catch (err: any) {
        console.warn(`Model ${currentModel} failed with error during translation:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả các mô hình Gemini hiện tại đều đang bận hoặc quá tải.");
    }

    const resultText = response.text?.trim() || "[]";
    let translatedData;
    try {
      translatedData = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse Gemini translation response as JSON:", resultText);
      return res.status(500).json({ error: "Lỗi phân tích kết quả dịch thuật từ AI." });
    }

    // Map the translated English meanings back to the original list of words
    let updatedCount = 0;
    const updatedWords = words.map(origWord => {
      const match = translatedData.find((t: any) => t && typeof t.japanese === "string" && t.japanese.trim() === origWord.japanese.trim());
      if (match && match.englishMeaning && (!origWord.englishMeaning || origWord.englishMeaning.trim() === "")) {
        updatedCount++;
        return {
          ...origWord,
          englishMeaning: match.englishMeaning.trim()
        };
      }
      return origWord;
    });

    return res.json({ words: updatedWords, updatedCount, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Translation Error:", error);
    return res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi dịch từ vựng sang tiếng Anh bằng AI." });
  }
});

// API: Tokenize & Romaji & English meaning for Raw Vocabulary list
app.post("/api/lesson/tokenize", async (req, res) => {
  try {
    const { words, model } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: "Dữ liệu từ vựng đầu vào không hợp lệ hoặc trống." });
    }

    const ai = getAiClient();
    const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const chosenModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    const fallbackModels = [
      chosenModel,
      ...allowedModels.filter(m => m !== chosenModel)
    ];

    const prompt = `Phân tích danh sách từ vựng tiếng Nhật thô sau đây.
Đối với mỗi từ, hãy xác định hoặc sinh ra:
1. Từ tiếng Nhật chuẩn xác (japanese)
2. Cách đọc phiên âm Romaji chính xác (romaji)
3. Nghĩa tiếng Việt chuẩn (vietnameseMeaning)
4. Nghĩa tiếng Anh tự nhiên ngắn gọn (englishMeaning)

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    let response;
    let successModel = chosenModel;
    let lastError = null;

    for (const currentModel of fallbackModels) {
      try {
        console.log(`AI Tokenizing with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction: "Bạn là chuyên gia ngôn ngữ học tiếng Nhật học thuật. Nhiệm vụ của bạn là lấy danh sách từ vựng tiếng Nhật thô, phân tích bổ sung Romaji chính xác viết thường, hoàn thiện nghĩa tiếng Việt và tiếng Anh chuẩn xác. Trả về mảng JSON.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Danh sách từ vựng đã được phân tích đầy đủ",
              items: {
                type: Type.OBJECT,
                properties: {
                  japanese: { type: Type.STRING },
                  romaji: { type: Type.STRING },
                  vietnameseMeaning: { type: Type.STRING },
                  englishMeaning: { type: Type.STRING }
                },
                required: ["japanese", "romaji", "vietnameseMeaning", "englishMeaning"]
              }
            }
          }
        });
        successModel = currentModel;
        break;
      } catch (err: any) {
        console.warn(`Model ${currentModel} failed in tokenize:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Không thể xử lý phân tích từ vựng.");
    }

    const resultText = response.text?.trim() || "[]";
    const tokenizedData = JSON.parse(resultText);
    return res.json({ words: tokenizedData, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Tokenize Error:", error);
    return res.status(500).json({ error: error.message || "Lỗi xử lý phân tích từ vựng." });
  }
});

// API: Generate Example Sentences with translations
app.post("/api/lesson/generate-examples", async (req, res) => {
  try {
    const { words, model } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: "Dữ liệu từ vựng không hợp lệ hoặc trống." });
    }

    const ai = getAiClient();
    const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const chosenModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    const fallbackModels = [
      chosenModel,
      ...allowedModels.filter(m => m !== chosenModel)
    ];

    const prompt = `Hãy tạo một câu ví dụ tiếng Nhật tự nhiên, ngắn gọn và đời thường cho mỗi từ vựng tiếng Nhật sau đây. 
Đồng thời, hãy cung cấp bản dịch nghĩa tiếng Việt chính xác và tinh tế của câu ví dụ đó.

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    let response;
    let successModel = chosenModel;
    let lastError = null;

    for (const currentModel of fallbackModels) {
      try {
        console.log(`AI Examples generating with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction: "Bạn là giáo viên tiếng Nhật chuyên nghiệp bản xứ. Hãy viết đúng 1 câu ví dụ tiếng Nhật chuẩn, ngắn gọn và bản dịch tiếng Việt cho mỗi từ vựng. Trả về mảng JSON.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Danh sách các câu ví dụ và nghĩa của chúng",
              items: {
                type: Type.OBJECT,
                properties: {
                  japanese: { type: Type.STRING, description: "Từ vựng gốc" },
                  example: { type: Type.STRING, description: "Câu ví dụ tiếng Nhật tự nhiên, ngắn gọn" },
                  exampleMeaning: { type: Type.STRING, description: "Bản dịch tiếng Việt của câu ví dụ" }
                },
                required: ["japanese", "example", "exampleMeaning"]
              }
            }
          }
        });
        successModel = currentModel;
        break;
      } catch (err: any) {
        console.warn(`Model ${currentModel} failed in examples:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Không thể tạo câu ví dụ.");
    }

    const resultText = response.text?.trim() || "[]";
    const examplesData = JSON.parse(resultText);
    return res.json({ examples: examplesData, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Examples Error:", error);
    return res.status(500).json({ error: error.message || "Lỗi tạo câu ví dụ bằng AI." });
  }
});

// API: Generate Review Questions
app.post("/api/lesson/generate-review", async (req, res) => {
  try {
    const { grammar, words, model } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: "Dữ liệu bài học không hợp lệ." });
    }

    const ai = getAiClient();
    const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    const chosenModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    const fallbackModels = [
      chosenModel,
      ...allowedModels.filter(m => m !== chosenModel)
    ];

    const prompt = `Hãy tạo 5 câu hỏi ôn tập/kiểm tra (Multiple Choice Questions) để kiểm tra mức độ ghi nhớ từ vựng và ngữ pháp của bài học.
Các câu hỏi nên bao quát:
- Nhận diện nghĩa từ vựng (Nhật - Việt hoặc Việt - Nhật)
- Điền trợ từ hoặc chia mẫu câu dựa trên ngữ pháp bài học.

Dữ liệu đầu vào bài học:
Ngữ pháp: ${JSON.stringify(grammar)}
Từ vựng: ${JSON.stringify(words, null, 2)}`;

    let response;
    let successModel = chosenModel;
    let lastError = null;

    for (const currentModel of fallbackModels) {
      try {
        console.log(`AI Review questions generating with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction: "Bạn là giảng viên tiếng Nhật và chuyên gia soạn đề thi JLPT. Hãy soạn đúng 5 câu hỏi trắc nghiệm chất lượng cao kèm 4 phương án lựa chọn, ghi rõ đáp án đúng và lời giải thích ngắn gọn bằng tiếng Việt. Trả về mảng JSON.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Mảng chứa 5 câu hỏi trắc nghiệm",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Đặt là 'vocab-exam' hoặc 'jlpt-exam'" },
                  question: { type: Type.STRING, description: "Nội dung câu hỏi (tiếng Nhật có chỗ trống hoặc hỏi nghĩa tiếng Việt)" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Chứa đúng 4 phương án lựa chọn khác nhau"
                  },
                  correctStr: { type: Type.STRING, description: "Đáp án chính xác, phải khớp tuyệt đối 1 trong 4 lựa chọn trong mảng options" },
                  explanation: { type: Type.STRING, description: "Giải thích chi tiết ngắn gọn bằng tiếng Việt" }
                },
                required: ["type", "question", "options", "correctStr", "explanation"]
              }
            }
          }
        });
        successModel = currentModel;
        break;
      } catch (err: any) {
        console.warn(`Model ${currentModel} failed in review questions:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Không thể tạo câu hỏi ôn tập.");
    }

    const resultText = response.text?.trim() || "[]";
    const reviewData = JSON.parse(resultText);
    return res.json({ reviewQuestions: reviewData, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Review Error:", error);
    return res.status(500).json({ error: error.message || "Lỗi tạo đề thi ôn tập bằng AI." });
  }
});

// Setup Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

setupVite();
