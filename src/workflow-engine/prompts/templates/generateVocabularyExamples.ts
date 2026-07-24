import { PromptTemplate } from "../promptRegistry";

export const generateVocabularyExamplesTemplate: PromptTemplate = {
  systemPrompt: "You are an expert Japanese educator. For each provided Japanese vocabulary word, generate exactly one highly natural, context-appropriate example sentence. Provide the example in Japanese (with Kanji where appropriate), its Hiragana/Furigana reading, its Vietnamese translation, and its English translation. Return the result strictly in the specified JSON schema format.",
  userPromptTemplate: "Generate a natural, level-appropriate example sentence for each vocabulary item in this list.\n\nTarget JLPT Level: {{level}}\n\nVocabulary items:\n{{vocabulary}}",
  responseSchema: {
    type: "OBJECT",
    properties: {
      examples: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            vocabularyId: { type: "STRING" },
            japanese: { type: "STRING" },
            hiragana: { type: "STRING" },
            meaningVi: { type: "STRING" },
            meaningEn: { type: "STRING" }
          },
          required: ["vocabularyId", "japanese", "hiragana", "meaningVi"]
        }
      }
    },
    required: ["examples"]
  },
  requiredVariables: ["level", "vocabulary"]
};
