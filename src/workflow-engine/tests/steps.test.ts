import { describe, it, expect, beforeEach } from "vitest";
import { ValidateVocabularyStep } from "../application/steps/validateVocabularyStep";
import { ValidateGrammarStep } from "../application/steps/validateGrammarStep";
import { TokenizeStep } from "../application/steps/tokenizeStep";
import { GenerateEnglishStep } from "../application/steps/generateEnglishStep";
import { GenerateVocabularyExamplesStep } from "../application/steps/generateVocabularyExamplesStep";
import { GenerateGrammarExamplesStep } from "../application/steps/generateGrammarExamplesStep";
import { GenerateReviewStep } from "../application/steps/generateReviewStep";
import { SaveLessonStep } from "../application/steps/saveLessonStep";
import { 
  FakeAIService, 
  FakeLogger, 
  MockStepHandler 
} from "./fakes";
import { PipelineContext, StepState } from "../domain/types";
import { ValidationError, BusinessError, AIError } from "../domain/errors";

describe("Step Handlers - Detailed Testing Unit Suite", () => {
  let aiService: FakeAIService;
  let logger: FakeLogger;
  let execContext: any;
  let context: PipelineContext;

  beforeEach(() => {
    aiService = new FakeAIService();
    logger = new FakeLogger();
    execContext = {
      draftId: "draft-abc",
      stepId: "current-step",
      aiService,
      logger,
      retryCount: 0,
      promptVersion: "1.0",
      aiModel: "gemini-3.5-flash",
    };

    context = {
      metadata: {
        level: "N4",
        lessonId: 5,
        titleVi: "Bài 5",
      },
      input: {
        vocabulary: [],
        grammar: [],
      },
      validated: {
        vocabulary: [],
        grammar: [],
      },
      tokenized: {
        vocabularyTokens: {},
      },
      generated: {
        vocabularyWithMeanings: [],
        vocabularyWithExamples: [],
        grammarWithMeanings: [],
        grammarWithExamples: [],
        review: null,
      },
    };
  });

  // ==========================================
  // 1. ValidateVocabularyStep Tests
  // ==========================================
  describe("ValidateVocabularyStep", () => {
    const step = new ValidateVocabularyStep();

    it("should validate and normalize correct vocabulary list", async () => {
      context.input.vocabulary = [
        {
          id: "v1",
          kanji: " 行く ",
          hiragana: " いく ",
          romaji: " iku ",
          meaningVi: " đi ",
        },
      ];

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      expect(res.updatedContext?.validated?.vocabulary).toHaveLength(1);
      
      const validatedItem = res.updatedContext!.validated!.vocabulary[0];
      expect(validatedItem.id).toBe("v1");
      expect(validatedItem.kanji).toBe("行く");
      expect(validatedItem.hiragana).toBe("いく");
      expect(validatedItem.romaji).toBe("iku");
      expect(validatedItem.meaningVi).toBe("đi");
    });

    it("should throw ValidationError if vocabulary is completely missing", async () => {
      (context as any).input = {};
      await expect(step.execute(context, execContext)).rejects.toThrow(ValidationError);
    });

    it("should throw BusinessError if vocabulary list is empty", async () => {
      context.input.vocabulary = [];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });

    it("should throw ValidationError if required field hiragana is missing", async () => {
      context.input.vocabulary = [
        {
          id: "v1",
          hiragana: "",
          romaji: "iku",
          meaningVi: "đi",
        },
      ];
      await expect(step.execute(context, execContext)).rejects.toThrow(ValidationError);
    });

    it("should throw BusinessError if duplicate ID is found", async () => {
      context.input.vocabulary = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
        { id: "v1", hiragana: "たべる", romaji: "taberu", meaningVi: "ăn" },
      ];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });

    it("should throw BusinessError if duplicate hiragana is found", async () => {
      context.input.vocabulary = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
        { id: "v2", hiragana: "いく", romaji: "iku", meaningVi: "đi 2" },
      ];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });
  });

  // ==========================================
  // 2. ValidateGrammarStep Tests
  // ==========================================
  describe("ValidateGrammarStep", () => {
    const step = new ValidateGrammarStep();

    it("should validate and normalize correct grammar list", async () => {
      context.input.grammar = [
        {
          id: "g1",
          pattern: " ~てから ",
          meaningVi: " sau khi làm gì ",
          explanationVi: " chỉ hành động tiếp diễn sau khi... ",
          examples: [],
        },
      ];

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      expect(res.updatedContext?.validated?.grammar).toHaveLength(1);
      
      const valGrammar = res.updatedContext!.validated!.grammar[0];
      expect(valGrammar.pattern).toBe("~てから");
      expect(valGrammar.meaningVi).toBe("sau khi làm gì");
    });

    it("should throw ValidationError if required field explanationVi is missing", async () => {
      context.input.grammar = [
        {
          id: "g1",
          pattern: "~てから",
          meaningVi: "sau khi",
          explanationVi: "",
          examples: [],
        },
      ];
      await expect(step.execute(context, execContext)).rejects.toThrow(ValidationError);
    });

    it("should throw BusinessError if duplicate pattern is detected", async () => {
      context.input.grammar = [
        { id: "g1", pattern: "~てから", meaningVi: "sau khi", explanationVi: "xyz", examples: [] },
        { id: "g2", pattern: "~てから", meaningVi: "sau khi", explanationVi: "abc", examples: [] },
      ];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });
  });

  // ==========================================
  // 3. TokenizeStep Tests
  // ==========================================
  describe("TokenizeStep", () => {
    const step = new TokenizeStep();

    it("should tokenize validated vocabulary using AI successfully", async () => {
      context.validated.vocabulary = [
        { id: "v1", kanji: "行く", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
      ];

      aiService.generateResult = JSON.stringify({
        vocabularyTokens: {
          "行く (いく)": ["行", "く"],
        },
      });

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      expect(res.updatedContext?.tokenized?.vocabularyTokens).toEqual({
        v1: ["行", "く"],
      });
      expect(aiService.calls).toHaveLength(1);
    });

    it("should throw BusinessError if no validated vocabulary is present", async () => {
      context.validated.vocabulary = [];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });

    it("should throw AIError if AI returns non-compliant format", async () => {
      context.validated.vocabulary = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
      ];
      aiService.generateResult = "Not JSON";

      await expect(step.execute(context, execContext)).rejects.toThrow(AIError);
    });
  });

  // ==========================================
  // 4. GenerateEnglishStep Tests
  // ==========================================
  describe("GenerateEnglishStep", () => {
    const step = new GenerateEnglishStep();

    it("should generate English translation and categories using AI", async () => {
      context.validated.vocabulary = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
      ];

      aiService.generateResult = JSON.stringify({
        translations: [
          { id: "v1", meaningEn: "to go", category: "Verb" },
        ],
      });

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      const generated = res.updatedContext?.generated?.vocabularyWithMeanings;
      expect(generated).toBeDefined();
      expect(generated![0].meaningEn).toBe("to go");
      expect(generated![0].category).toBe("Verb");
    });
  });

  // ==========================================
  // 5. GenerateVocabularyExamplesStep Tests
  // ==========================================
  describe("GenerateVocabularyExamplesStep", () => {
    const step = new GenerateVocabularyExamplesStep();

    it("should generate contextual example sentences with translations", async () => {
      context.validated.vocabulary = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi" },
      ];

      aiService.generateResult = JSON.stringify({
        examples: [
          {
            vocabularyId: "v1",
            japanese: "学校に行く。",
            hiragana: "がっこうにいく。",
            meaningVi: "Tôi đi đến trường.",
            meaningEn: "I go to school.",
          },
        ],
      });

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      const output = res.updatedContext?.generated?.vocabularyWithExamples;
      expect(output).toBeDefined();
      expect(output![0].examples).toHaveLength(1);
      expect(output![0].examples![0].japanese).toBe("学校に行く。");
      expect(output![0].examples![0].meaningVi).toBe("Tôi đi đến trường.");
    });
  });

  // ==========================================
  // 6. GenerateGrammarExamplesStep Tests
  // ==========================================
  describe("GenerateGrammarExamplesStep", () => {
    const step = new GenerateGrammarExamplesStep();

    it("should generate grammar examples and detail explanations using AI", async () => {
      context.validated.grammar = [
        { id: "g1", pattern: "~てから", meaningVi: "sau khi", explanationVi: "giải thích vi", examples: [] },
      ];

      aiService.generateResult = JSON.stringify({
        grammarDetails: [
          {
            grammarId: "g1",
            explanationVi: "Giải thích cụ thể",
            explanationEn: "Specific explanation",
            meaningEn: "after doing...",
            examples: [
              {
                japanese: "手を洗ってから食べます。",
                hiragana: "てをあらってからたべます。",
                meaningVi: "Tôi ăn sau khi rửa tay.",
                meaningEn: "I eat after washing hands.",
              },
            ],
          },
        ],
      });

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      const generated = res.updatedContext?.generated?.grammarWithExamples;
      expect(generated).toBeDefined();
      expect(generated![0].explanationEn).toBe("Specific explanation");
      expect(generated![0].examples).toHaveLength(1);
      expect(generated![0].examples[0].japanese).toBe("手を洗ってから食べます。");
    });
  });

  // ==========================================
  // 7. GenerateReviewStep Tests
  // ==========================================
  describe("GenerateReviewStep", () => {
    const step = new GenerateReviewStep();

    it("should generate interactive quiz, summary, and lessons exercises using AI", async () => {
      context.generated.vocabularyWithExamples = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi", examples: [{ japanese: "...", hiragana: "...", meaningVi: "..." }] },
      ];
      context.generated.grammarWithExamples = [
        { id: "g1", pattern: "~てから", meaningVi: "sau khi", explanationVi: "giải thích vi", examples: [{ japanese: "...", hiragana: "...", meaningVi: "..." }] },
      ];

      aiService.generateResult = JSON.stringify({
        summaryVi: "Tóm tắt bài học hôm nay",
        summaryEn: "Summary of today's lesson",
        quickQuiz: [
          {
            question: "Lựa chọn nào đúng cho từ 'iku'?",
            options: ["Ăn", "Ngủ", "Đi", "Chơi"],
            answerIndex: 2,
            explanation: "Iku nghĩa là đi.",
          },
        ],
      });

      const res = await step.execute(context, execContext);

      expect(res.status).toBe(StepState.SUCCESS);
      const review = res.updatedContext?.generated?.review;
      expect(review).toBeDefined();
      expect(review!.summaryVi).toBe("Tóm tắt bài học hôm nay");
      expect(review!.quickQuiz).toHaveLength(1);
      expect(review!.quickQuiz[0].answerIndex).toBe(2);
    });

    it("should throw BusinessError if called without generating vocab and grammar examples first", async () => {
      context.generated.vocabularyWithExamples = [];
      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });
  });

  // ==========================================
  // 8. SaveLessonStep Tests
  // ==========================================
  describe("SaveLessonStep", () => {
    const step = new SaveLessonStep();

    it("should successfully save / finalize compile checks if all prior fields are properly populated", async () => {
      context.generated.vocabularyWithExamples = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi", examples: [{ japanese: "A", hiragana: "B", meaningVi: "C" }] },
      ];
      context.generated.grammarWithExamples = [
        { id: "g1", pattern: "~てから", meaningVi: "sau khi", explanationVi: "X", examples: [{ japanese: "X", hiragana: "Y", meaningVi: "Z" }] },
      ];
      context.tokenized.vocabularyTokens = {
        v1: ["い", "く"],
      };
      context.generated.review = {
        summaryVi: "Tổng kết",
        quickQuiz: [
          { question: "Q", options: ["O1", "O2"], answerIndex: 0, explanation: "E" },
        ],
      };

      const res = await step.execute(context, execContext);
      expect(res.status).toBe(StepState.SUCCESS);
    });

    it("should throw BusinessError if tokens are missing", async () => {
      context.generated.vocabularyWithExamples = [
        { id: "v1", hiragana: "いく", romaji: "iku", meaningVi: "đi", examples: [{ japanese: "A", hiragana: "B", meaningVi: "C" }] },
      ];
      context.generated.grammarWithExamples = [
        { id: "g1", pattern: "~てから", meaningVi: "sau khi", explanationVi: "X", examples: [{ japanese: "X", hiragana: "Y", meaningVi: "Z" }] },
      ];
      context.tokenized.vocabularyTokens = {}; // empty
      context.generated.review = {
        summaryVi: "Tổng kết",
        quickQuiz: [],
      };

      await expect(step.execute(context, execContext)).rejects.toThrow(BusinessError);
    });
  });
});
