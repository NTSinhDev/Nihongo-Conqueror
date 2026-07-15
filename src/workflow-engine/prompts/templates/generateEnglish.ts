import { PromptTemplate } from "../promptRegistry";

export const generateEnglishTemplate: PromptTemplate = {
  systemPrompt: "You are an expert Japanese-English lexicographer and educator. Your task is to process a list of Japanese vocabulary items that already have Vietnamese meanings, provide their exact, natural, and concise English translations, and classify their parts of speech (category) into standard grammatical terms.",
  userPromptTemplate: "Generate English meanings and part of speech categories for these Japanese vocabulary items matching the lesson level: {{level}}.\n\nVocabulary Items:\n{{vocabulary}}",
  responseSchema: {
    type: "OBJECT",
    properties: {
      translations: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            meaningEn: { type: "STRING" },
            category: { type: "STRING" }
          },
          required: ["id", "meaningEn", "category"]
        }
      }
    },
    required: ["translations"]
  },
  requiredVariables: ["level", "vocabulary"]
};
