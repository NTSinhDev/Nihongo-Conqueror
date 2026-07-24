import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, LessonReview } from "../../domain/types";
import { ValidationError, BusinessError, AIError } from "../../domain/errors";
import { PromptRegistry } from "../../prompts/promptRegistry";
import { PromptRenderer } from "../../prompts/promptRenderer";

export class GenerateReviewStep implements IStepHandler {
  public readonly stepId = "generate-review";
  public readonly description = "Generate a comprehensive lesson review and quick multiple-choice interactive quiz";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running GenerateReviewStep for draft: ${execContext.draftId}`);

    const vocabulary = context.generated?.vocabularyWithExamples;
    const grammar = context.generated?.grammarWithExamples;

    if (!vocabulary || vocabulary.length === 0 || !grammar || grammar.length === 0) {
      throw new BusinessError("Cannot generate review because vocabulary or grammar examples are missing. Run earlier steps first.");
    }

    const template = PromptRegistry.getTemplate(this.stepId);
    const rendered = PromptRenderer.render(template, {
      level: context.metadata?.level || "General",
      lesson_title: context.metadata?.titleVi || "Bài học",
      vocabulary: vocabulary.map((v) => ({
        word: v.kanji || v.hiragana,
        meaningVi: v.meaningVi
      })),
      grammar: grammar.map((g) => ({
        pattern: g.pattern,
        meaningVi: g.meaningVi
      }))
    });

    try {
      const responseText = await execContext.aiService.generate(
        rendered.userPrompt,
        rendered.systemPrompt,
        rendered.responseSchema,
        { model: execContext.aiModel }
      );

      const parsed = JSON.parse(responseText);
      if (!parsed || typeof parsed.summaryVi !== "string" || !Array.isArray(parsed.quickQuiz) || parsed.quickQuiz.length === 0) {
        throw new AIError("AI returned invalid JSON format or empty quiz (0 questions) for lesson review.", parsed, true);
      }

      const review: LessonReview = {
        summaryVi: parsed.summaryVi,
        summaryEn: parsed.summaryEn || undefined,
        quickQuiz: parsed.quickQuiz.map((q: any) => ({
          question: q.question,
          options: q.options,
          answerIndex: q.answerIndex,
          explanation: q.explanation,
        })),
      };

      return {
        status: StepState.SUCCESS,
        updatedContext: {
          generated: {
            ...context.generated,
            review,
          },
        },
      };
    } catch (err: any) {
      if (err instanceof AIError) {
        throw err;
      }
      throw new AIError(`Failed to generate lesson review: ${err.message}`, err, true);
    }
  }
}
