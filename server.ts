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
