import { generateEnglishTemplate } from "./templates/generateEnglish";
import { generateVocabularyExamplesTemplate } from "./templates/generateVocabularyExamples";
import { generateGrammarExamplesTemplate } from "./templates/generateGrammarExamples";
import { generateReviewTemplate } from "./templates/generateReview";

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  responseSchema?: any;
  requiredVariables: string[];
}

export class PromptRegistry {
  private static registry: Map<string, PromptTemplate> = new Map([
    ["generate-english", generateEnglishTemplate],
    ["GenerateEnglish", generateEnglishTemplate],
    ["generate-vocabulary-examples", generateVocabularyExamplesTemplate],
    ["GenerateVocabularyExamples", generateVocabularyExamplesTemplate],
    ["generate-grammar-examples", generateGrammarExamplesTemplate],
    ["GenerateGrammarExamples", generateGrammarExamplesTemplate],
    ["generate-review", generateReviewTemplate],
    ["GenerateReview", generateReviewTemplate]
  ]);

  public static getTemplate(stepId: string): PromptTemplate {
    const template = this.registry.get(stepId);
    if (!template) {
      throw new Error(`Prompt template not found for step: ${stepId}`);
    }
    return template;
  }
}
