import { PromptTemplate } from "../promptRegistry";

export const generateReviewTemplate: PromptTemplate = {
  systemPrompt: "You are a Japanese pedagogy expert. Create an interactive review summary and a multiple-choice quiz based on the provided vocabulary and grammar. Write a clear review summary in Vietnamese and English. You MUST generate a quiz with exactly 3 to 5 questions in the 'quickQuiz' array. Each question must have exactly 4 options, a 0-indexed answerIndex pointing to the correct option, and a clear, pedagogical explanation in Vietnamese. Do not return an empty 'quickQuiz' array under any circumstances.",
  userPromptTemplate: "Create a lesson review summary and a multiple-choice interactive quiz based on the following details.\n\nLesson Title: {{lesson_title}}\nJLPT Level: {{level}}\n\nVocabulary List (strictly use these to construct questions):\n{{vocabulary}}\n\nGrammar Patterns (strictly use these to construct questions):\n{{grammar}}",
  responseSchema: {
    type: "OBJECT",
    properties: {
      summaryVi: { type: "STRING" },
      summaryEn: { type: "STRING" },
      quickQuiz: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            options: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            answerIndex: { type: "INTEGER" },
            explanation: { type: "STRING" }
          },
          required: ["question", "options", "answerIndex", "explanation"]
        }
      }
    },
    required: ["summaryVi", "quickQuiz"]
  },
  requiredVariables: ["level", "lesson_title", "vocabulary", "grammar"]
};
