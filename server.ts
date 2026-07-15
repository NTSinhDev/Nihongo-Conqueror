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

// Helper for robust Gemini generation with retry and model fallback
async function generateContentWithRetry(options: {
  userPrompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  temperature?: number;
  chosenModel?: string;
}): Promise<{ text: string; successModel: string }> {
  const ai = getAiClient();
  const modelName = options.chosenModel || "gemini-3.5-flash";
  const temperature = options.temperature !== undefined ? options.temperature : 1.0;

  const allowedModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
  const finalChosenModel = allowedModels.includes(modelName) ? modelName : "gemini-3.5-flash";

  const fallbackModels = [
    finalChosenModel,
    ...allowedModels.filter(m => m !== finalChosenModel)
  ];

  let lastError: any = null;

  for (const currentModel of fallbackModels) {
    let attempt = 0;
    const maxAttempts = 3;
    let baseDelay = 2000; // 2 seconds

    while (attempt < maxAttempts) {
      try {
        console.log(`[AI] Generating content using ${currentModel} (attempt ${attempt + 1}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: options.userPrompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature,
            responseMimeType: options.responseSchema ? "application/json" : undefined,
            responseSchema: options.responseSchema,
          }
        });

        const text = response.text;
        if (text === undefined || text === null) {
          throw new Error("Gemini returned empty or undefined content.");
        }

        return { text, successModel: currentModel };
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err).toLowerCase();
        
        // If it's a rate limit / 429 / resource exhausted error, we should back off and retry the same model
        const isRateLimit = errStr.includes("429") || errStr.includes("quota") || errStr.includes("rate limit") || errStr.includes("exhausted");
        
        if (isRateLimit && attempt < maxAttempts - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`[AI] Model ${currentModel} rate limited (429). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } else {
          // For other errors (or if we exhausted retries for this model), log and try the next fallback model
          console.warn(`[AI] Model ${currentModel} failed with error:`, err.message || err);
          break; // break the while loop, proceed to next model in the for loop
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models failed or are currently unavailable.");
}

// API: AI Auto-Categorize Vocabulary
app.post("/api/vocab/categorize", async (req, res) => {
  try {
    const { words, model } = req.body;
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Danh sách từ vựng không hợp lệ hoặc trống." });
    }

    const prompt = `Phân loại danh sách từ vựng tiếng Nhật sau đây thành các nhóm chủ đề hoặc ngữ cảnh sử dụng hợp lý.
Mỗi nhóm nên có một tên tiếng Việt tinh tế (ví dụ: "Chào hỏi xã giao & Nghi thức", "Đại từ & Danh từ chỉ người", "Hành động & Hoạt động thường nhật") kèm theo một mô tả ngắn gọn và một ngữ cảnh (context) sử dụng thực tế.
Mỗi từ trong danh sách đầu vào phải được phân loại chính xác vào một nhóm thích hợp nhất. Đảm bảo giữ nguyên các trường dữ liệu của từ vựng đầu vào (japanese, romaji, vietnameseMeaning, englishMeaning).

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    const systemInstruction = "Bạn là một giảng viên tiếng Nhật bản xứ kỳ cựu và chuyên gia ngôn ngữ học. Nhiệm vụ của bạn là nhóm từ vựng của một bài học tiếng Nhật thành các chủ đề, nhóm ý nghĩa hoặc ngữ cảnh giao tiếp cụ thể, giúp học viên dễ dàng ghi nhớ và phân xạ nhanh. Trả về kết quả dưới dạng JSON hoàn toàn hợp lệ.";

    const responseSchema = {
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
    };

    const { text, successModel } = await generateContentWithRetry({
      userPrompt: prompt,
      systemInstruction,
      responseSchema,
      chosenModel: model,
    });

    let categorizedData;
    try {
      categorizedData = JSON.parse(text.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text);
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

    // Find words that need English meanings
    const missingWords = words.filter(w => !w.englishMeaning || w.englishMeaning.trim() === "");
    
    if (missingWords.length === 0) {
      return res.json({ words, updatedCount: 0, activeModel: model || "gemini-3.5-flash" });
    }

    const prompt = `Dịch nghĩa tiếng Anh cho các từ vựng tiếng Nhật sau đây. 
Hãy phân tích từ tiếng Nhật (Kanji/Hiragana/Katakana) và nghĩa tiếng Việt của nó, sau đó cung cấp nghĩa tiếng Anh chuẩn xác, ngắn gọn và tự nhiên nhất.
Chỉ trả về các cặp từ được yêu cầu trong danh sách đầu vào dưới dạng JSON hoàn toàn hợp lệ.

Danh sách từ vựng cần dịch:
${JSON.stringify(missingWords.map(w => ({ japanese: w.japanese, romaji: w.romaji, vietnameseMeaning: w.vietnameseMeaning })), null, 2)}`;

    const systemInstruction = "Bạn là một nhà dịch thuật tiếng Nhật - tiếng Anh chuyên nghiệp. Hãy cung cấp nghĩa tiếng Anh ngắn gọn, chuẩn xác và dễ hiểu cho mỗi từ được truyền vào. Trả về kết quả dưới dạng JSON một mảng các đối tượng chứa japanese và englishMeaning.";

    const responseSchema = {
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
    };

    const { text, successModel } = await generateContentWithRetry({
      userPrompt: prompt,
      systemInstruction,
      responseSchema,
      chosenModel: model,
    });

    let translatedData;
    try {
      translatedData = JSON.parse(text.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini translation response as JSON:", text);
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

    const prompt = `Phân tích danh sách từ vựng tiếng Nhật thô sau đây.
Đối với mỗi từ, hãy xác định hoặc sinh ra:
1. Từ tiếng Nhật chuẩn xác (japanese)
2. Cách đọc phiên âm Romaji chính xác (romaji)
3. Nghĩa tiếng Việt chuẩn (vietnameseMeaning)
4. Nghĩa tiếng Anh tự nhiên ngắn gọn (englishMeaning)

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    const systemInstruction = "Bạn là chuyên gia ngôn ngữ học tiếng Nhật học thuật. Nhiệm vụ của bạn là lấy danh sách từ vựng tiếng Nhật thô, phân tích bổ sung Romaji chính xác viết thường, hoàn thiện nghĩa tiếng Việt và tiếng Anh chuẩn xác. Trả về mảng JSON.";

    const responseSchema = {
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
    };

    const { text, successModel } = await generateContentWithRetry({
      userPrompt: prompt,
      systemInstruction,
      responseSchema,
      chosenModel: model,
    });

    const tokenizedData = JSON.parse(text.trim());
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

    const prompt = `Hãy tạo một câu ví dụ tiếng Nhật tự nhiên, ngắn gọn và đời thường cho mỗi từ vựng tiếng Nhật sau đây. 
Đồng thời, hãy cung cấp bản dịch nghĩa tiếng Việt chính xác và tinh tế của câu ví dụ đó.

Danh sách từ vựng đầu vào:
${JSON.stringify(words, null, 2)}`;

    const systemInstruction = "Bạn là giáo viên tiếng Nhật chuyên nghiệp bản xứ. Hãy viết đúng 1 câu ví dụ tiếng Nhật chuẩn, ngắn gọn và bản dịch tiếng Việt cho mỗi từ vựng. Trả về mảng JSON.";

    const responseSchema = {
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
    };

    const { text, successModel } = await generateContentWithRetry({
      userPrompt: prompt,
      systemInstruction,
      responseSchema,
      chosenModel: model,
    });

    const examplesData = JSON.parse(text.trim());
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

    const prompt = `Hãy tạo 5 câu hỏi ôn tập/kiểm tra (Multiple Choice Questions) để kiểm tra mức độ ghi nhớ từ vựng và ngữ pháp của bài học.
Các câu hỏi nên bao quát:
- Nhận diện nghĩa từ vựng (Nhật - Việt hoặc Việt - Nhật)
- Điền trợ từ hoặc chia mẫu câu dựa trên ngữ pháp bài học.

Dữ liệu đầu vào bài học:
Ngữ pháp: ${JSON.stringify(grammar)}
Từ vựng: ${JSON.stringify(words, null, 2)}`;

    const systemInstruction = "Bạn là giảng viên tiếng Nhật và chuyên gia soạn đề thi JLPT. Hãy soạn đúng 5 câu hỏi trắc nghiệm chất lượng cao kèm 4 phương án lựa chọn, ghi rõ đáp án đúng và lời giải thích ngắn gọn bằng tiếng Việt. Trả về mảng JSON.";

    const responseSchema = {
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
    };

    const { text, successModel } = await generateContentWithRetry({
      userPrompt: prompt,
      systemInstruction,
      responseSchema,
      chosenModel: model,
    });

    const reviewData = JSON.parse(text.trim());
    return res.json({ reviewQuestions: reviewData, activeModel: successModel });
  } catch (error: any) {
    console.error("AI Review Error:", error);
    return res.status(500).json({ error: error.message || "Lỗi tạo đề thi ôn tập bằng AI." });
  }
});

// API: Generic Gemini Proxy for Workflow Steps
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { userPrompt, systemPrompt, responseSchema, options } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: "User prompt is required." });
    }

    const { text, successModel } = await generateContentWithRetry({
      userPrompt,
      systemInstruction: systemPrompt,
      responseSchema,
      chosenModel: options?.model,
      temperature: options?.temperature,
    });

    return res.json({ text, activeModel: successModel });
  } catch (error: any) {
    console.error("[PROXY] Gemini proxy error:", error);
    return res.status(500).json({ error: error.message || "An error occurred during Gemini API generation." });
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
