import { ValidationError } from "../domain/errors";
import { PromptTemplate } from "./promptRegistry";

export interface RenderedPrompt {
  systemPrompt: string;
  userPrompt: string;
  responseSchema?: any;
}

export class PromptRenderer {
  public static render(template: PromptTemplate, variables: Record<string, any>): RenderedPrompt {
    // 1. Validate required variables
    for (const reqVar of template.requiredVariables) {
      if (variables[reqVar] === undefined || variables[reqVar] === null) {
        throw new ValidationError(`Missing required prompt variable: ${reqVar}`);
      }
    }

    // 2. Perform variable replacement
    let userPrompt = template.userPromptTemplate;
    let systemPrompt = template.systemPrompt;

    const allVars = Object.keys(variables);
    for (const key of allVars) {
      const value = variables[key];
      let replacementStr = "";

      if (typeof value === "object" && value !== null) {
        replacementStr = JSON.stringify(value, null, 2);
      } else {
        replacementStr = String(value);
      }

      const placeholder = `{{${key}}}`;
      // Replace all occurrences of placeholder
      userPrompt = userPrompt.split(placeholder).join(replacementStr);
      systemPrompt = systemPrompt.split(placeholder).join(replacementStr);
    }

    return {
      systemPrompt,
      userPrompt,
      responseSchema: template.responseSchema,
    };
  }
}
