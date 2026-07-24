import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, VocabularyItem } from "../../domain/types";
import { ValidationError, BusinessError } from "../../domain/errors";

export class ValidateVocabularyStep implements IStepHandler {
  public readonly stepId = "validate-vocabulary";
  public readonly description = "Validate raw input Japanese vocabulary items";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running ValidateVocabularyStep for draft: ${execContext.draftId}`);

    const vocabulary = context.input?.vocabulary;

    if (!vocabulary) {
      throw new ValidationError("Vocabulary list is missing in input context.");
    }

    if (vocabulary.length === 0) {
      throw new BusinessError("Vocabulary list is empty. At least one vocabulary item is required.");
    }

    const seenIds = new Set<string>();
    const seenHiragana = new Set<string>();
    const validatedVocabulary: VocabularyItem[] = [];

    for (const item of vocabulary) {
      // 1. Check required fields
      if (!item.id || typeof item.id !== "string") {
        throw new ValidationError("Vocabulary item is missing a valid 'id'.", item);
      }
      if (!item.hiragana || typeof item.hiragana !== "string" || item.hiragana.trim() === "") {
        throw new ValidationError(`Vocabulary item with ID ${item.id} is missing a valid 'hiragana'.`, item);
      }
      if (!item.romaji || typeof item.romaji !== "string" || item.romaji.trim() === "") {
        throw new ValidationError(`Vocabulary item with ID ${item.id} is missing a valid 'romaji'.`, item);
      }
      if (!item.meaningVi || typeof item.meaningVi !== "string" || item.meaningVi.trim() === "") {
        throw new ValidationError(`Vocabulary item with ID ${item.id} is missing a valid 'meaningVi'.`, item);
      }

      // 2. Check duplicates
      if (seenIds.has(item.id)) {
        throw new BusinessError(`Duplicate vocabulary ID detected: ${item.id}`);
      }
      seenIds.add(item.id);

      const hiraganaNormalized = item.hiragana.trim();
      if (seenHiragana.has(hiraganaNormalized)) {
        throw new BusinessError(`Duplicate vocabulary entry detected for hiragana: ${item.hiragana}`);
      }
      seenHiragana.add(hiraganaNormalized);

      // 3. Normalize fields
      validatedVocabulary.push({
        id: item.id.trim(),
        kanji: item.kanji?.trim() || undefined,
        hiragana: hiraganaNormalized,
        romaji: item.romaji.trim(),
        meaningVi: item.meaningVi.trim(),
        meaningEn: item.meaningEn?.trim() || undefined,
        category: item.category?.trim() || undefined,
        examples: item.examples || [],
      });
    }

    return {
      status: StepState.SUCCESS,
      updatedContext: {
        validated: {
          ...context.validated,
          vocabulary: validatedVocabulary,
        },
      },
    };
  }
}
