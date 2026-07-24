import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, GrammarItem } from "../../domain/types";
import { ValidationError, BusinessError } from "../../domain/errors";

export class ValidateGrammarStep implements IStepHandler {
  public readonly stepId = "validate-grammar";
  public readonly description = "Validate raw input Japanese grammar items";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running ValidateGrammarStep for draft: ${execContext.draftId}`);

    const grammar = context.input?.grammar;

    if (!grammar) {
      throw new ValidationError("Grammar list is missing in input context.");
    }

    if (grammar.length === 0) {
      throw new BusinessError("Grammar list is empty. At least one grammar item is required.");
    }

    const seenIds = new Set<string>();
    const seenPatterns = new Set<string>();
    const validatedGrammar: GrammarItem[] = [];

    for (const item of grammar) {
      // 1. Check required fields
      if (!item.id || typeof item.id !== "string") {
        throw new ValidationError("Grammar item is missing a valid 'id'.", item);
      }
      if (!item.pattern || typeof item.pattern !== "string" || item.pattern.trim() === "") {
        throw new ValidationError(`Grammar item with ID ${item.id} is missing a valid 'pattern'.`, item);
      }
      if (!item.meaningVi || typeof item.meaningVi !== "string" || item.meaningVi.trim() === "") {
        throw new ValidationError(`Grammar item with ID ${item.id} is missing a valid 'meaningVi'.`, item);
      }
      if (!item.explanationVi || typeof item.explanationVi !== "string" || item.explanationVi.trim() === "") {
        throw new ValidationError(`Grammar item with ID ${item.id} is missing a valid 'explanationVi'.`, item);
      }

      // 2. Check duplicates
      if (seenIds.has(item.id)) {
        throw new BusinessError(`Duplicate grammar ID detected: ${item.id}`);
      }
      seenIds.add(item.id);

      const patternNormalized = item.pattern.trim();
      if (seenPatterns.has(patternNormalized)) {
        throw new BusinessError(`Duplicate grammar pattern detected: ${item.pattern}`);
      }
      seenPatterns.add(patternNormalized);

      // 3. Normalize fields
      validatedGrammar.push({
        id: item.id.trim(),
        pattern: patternNormalized,
        meaningVi: item.meaningVi.trim(),
        meaningEn: item.meaningEn?.trim() || undefined,
        explanationVi: item.explanationVi.trim(),
        explanationEn: item.explanationEn?.trim() || undefined,
        examples: item.examples || [],
      });
    }

    return {
      status: StepState.SUCCESS,
      updatedContext: {
        validated: {
          ...context.validated,
          grammar: validatedGrammar,
        },
      },
    };
  }
}
