import { describe, it, expect } from "vitest";
import { PromptRegistry, PromptTemplate } from "../prompts/promptRegistry";
import { PromptRenderer } from "../prompts/promptRenderer";
import { ValidationError } from "../domain/errors";

describe("Prompt System Unit Tests", () => {
  describe("PromptRegistry", () => {
    it("should retrieve valid templates for all steps in both kebab-case and CamelCase", () => {
      const steps = [
        "generate-english",
        "GenerateEnglish",
        "generate-vocabulary-examples",
        "GenerateVocabularyExamples",
        "generate-grammar-examples",
        "GenerateGrammarExamples",
        "generate-review",
        "GenerateReview"
      ];

      for (const stepId of steps) {
        const template = PromptRegistry.getTemplate(stepId);
        expect(template).toBeDefined();
        expect(typeof template.systemPrompt).toBe("string");
        expect(typeof template.userPromptTemplate).toBe("string");
        expect(Array.isArray(template.requiredVariables)).toBe(true);
      }
    });

    it("should throw an error when requesting an invalid step ID", () => {
      expect(() => {
        PromptRegistry.getTemplate("non-existent-step");
      }).toThrowError("Prompt template not found for step: non-existent-step");
    });
  });

  describe("PromptRenderer & Variable Replacement", () => {
    it("should correctly load and pass responseSchema", () => {
      const template = PromptRegistry.getTemplate("generate-english");
      const result = PromptRenderer.render(template, {
        level: "N5",
        vocabulary: [{ id: "v-1", word: "猫" }]
      });

      expect(result.responseSchema).toBeDefined();
      expect(result.responseSchema.type).toBe("OBJECT");
      expect(result.responseSchema.properties.translations).toBeDefined();
    });

    it("should replace string variables and stringify object/array variables", () => {
      const mockTemplate: PromptTemplate = {
        systemPrompt: "You are a teacher for {{level}}.",
        userPromptTemplate: "Explain this grammar pattern: {{grammar}} in lesson: {{lesson_title}}.",
        requiredVariables: ["level", "grammar", "lesson_title"],
        responseSchema: { type: "OBJECT" }
      };

      const vars = {
        level: "N4",
        lesson_title: "Polite Requests",
        grammar: {
          pattern: "～てください",
          meaningVi: "Hãy làm gì đó"
        }
      };

      const result = PromptRenderer.render(mockTemplate, vars);

      // Verify string replacement
      expect(result.systemPrompt).toBe("You are a teacher for N4.");
      expect(result.userPrompt).toContain("lesson: Polite Requests");

      // Verify object replacement gets stringified
      expect(result.userPrompt).toContain("～てください");
      expect(result.userPrompt).toContain("Hãy làm gì đó");
    });

    it("should throw ValidationError when a required variable is missing", () => {
      const template = PromptRegistry.getTemplate("generate-review");

      // generate-review requires: ["level", "lesson_title", "vocabulary", "grammar"]
      expect(() => {
        PromptRenderer.render(template, {
          level: "N5",
          // lesson_title is missing
          vocabulary: [],
          grammar: []
        });
      }).toThrow(ValidationError);

      expect(() => {
        PromptRenderer.render(template, {
          level: "N5",
          // lesson_title is missing
          vocabulary: [],
          grammar: []
        });
      }).toThrowError(/Missing required prompt variable: lesson_title/);
    });
  });
});
