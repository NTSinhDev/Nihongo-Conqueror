import { PromptTemplate } from "../promptRegistry";

export const generateGrammarExamplesTemplate: PromptTemplate = {
  systemPrompt: "You are an expert Japanese grammar specialist. For each grammar pattern, generate 1-2 clear, contextually relevant example sentences or small A-B dialogues. Provide the Japanese text, its Hiragana reading, Vietnamese translation, and English translation. Also, provide a short, helpful explanation of how the pattern is used in these examples in both Vietnamese and English. Return the result strictly in the specified JSON schema format.",
  userPromptTemplate: "Generate explanations and example dialogues/sentences for these Japanese grammar patterns. Ensure the linguistic complexity matches the level: {{level}}.\n\nGrammar patterns:\n{{grammar}}",
  responseSchema: {
    type: "OBJECT",
    properties: {
      grammarDetails: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            grammarId: { type: "STRING" },
            explanationEn: { type: "STRING" },
            explanationVi: { type: "STRING" },
            meaningEn: { type: "STRING" },
            examples: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  japanese: { type: "STRING" },
                  hiragana: { type: "STRING" },
                  meaningVi: { type: "STRING" },
                  meaningEn: { type: "STRING" }
                },
                required: ["japanese", "hiragana", "meaningVi"]
              }
            }
          },
          required: ["grammarId", "examples"]
        }
      }
    },
    required: ["grammarDetails"]
  },
  requiredVariables: ["level", "grammar"]
};
