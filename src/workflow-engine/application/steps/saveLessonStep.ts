import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState } from "../../domain/types";
import { BusinessError, ValidationError } from "../../domain/errors";

export class SaveLessonStep implements IStepHandler {
  public readonly stepId = "save-lesson";
  public readonly description = "Standardize and compile final compiled Lesson package";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running SaveLessonStep for draft: ${execContext.draftId}`);

    // 1. Verify all previous pipelines output fields are populated
    const vocabulary = context.generated?.vocabularyWithExamples;
    const grammar = context.generated?.grammarWithExamples;
    const tokens = context.tokenized?.vocabularyTokens;
    const review = context.generated?.review;

    if (!vocabulary || vocabulary.length === 0) {
      throw new BusinessError("Final compiled vocabulary is missing or empty.");
    }

    if (!grammar || grammar.length === 0) {
      throw new BusinessError("Final compiled grammar is missing or empty.");
    }

    if (!tokens || Object.keys(tokens).length === 0) {
      throw new BusinessError("Vocabulary token structures are missing or empty.");
    }

    if (!review) {
      throw new BusinessError("Final lesson interactive review and quiz are missing.");
    }

    // 2. Validate consistency
    for (const item of vocabulary) {
      if (!item.examples || item.examples.length === 0) {
        throw new ValidationError(`Vocabulary item "${item.hiragana}" (ID: ${item.id}) is missing example sentences.`);
      }
      if (!tokens[item.id]) {
        execContext.logger.warn(`No specific token breakdown found for vocabulary ID: ${item.id}`);
      }
    }

    for (const item of grammar) {
      if (!item.examples || item.examples.length === 0) {
        throw new ValidationError(`Grammar pattern "${item.pattern}" (ID: ${item.id}) is missing example sentences.`);
      }
    }

    if (!review.quickQuiz || !Array.isArray(review.quickQuiz) || review.quickQuiz.length === 0) {
      throw new ValidationError("Interactive quick quiz has 0 questions.");
    }

    execContext.logger.info(`Draft ${execContext.draftId} successfully compiled and finalized for publishing.`);

    return {
      status: StepState.SUCCESS,
      // No extra context mutation is strictly necessary, but we can return the exact context unchanged
      updatedContext: {},
    };
  }
}
