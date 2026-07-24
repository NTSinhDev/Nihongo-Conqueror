import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, VocabularyItem, VocabularyExample } from "../../domain/types";
import { ValidationError, BusinessError, AIError } from "../../domain/errors";
import { PromptRegistry } from "../../prompts/promptRegistry";
import { PromptRenderer } from "../../prompts/promptRenderer";

export class GenerateVocabularyExamplesStep implements IStepHandler {
  public readonly stepId = "generate-vocabulary-examples";
  public readonly description = "Generate natural Japanese example sentences with translations for each vocabulary item";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running GenerateVocabularyExamplesStep for draft: ${execContext.draftId}`);

    const vocabulary = (context.generated?.vocabularyWithMeanings && context.generated.vocabularyWithMeanings.length > 0)
      ? context.generated.vocabularyWithMeanings
      : context.validated?.vocabulary;

    if (!vocabulary || vocabulary.length === 0) {
      throw new BusinessError("No vocabulary found to generate examples for. Please validate and run English generation steps first.");
    }

    const template = PromptRegistry.getTemplate(this.stepId);
    const rendered = PromptRenderer.render(template, {
      level: context.metadata?.level || "General",
      vocabulary: vocabulary.map((v) => ({
        id: v.id,
        word: v.kanji || v.hiragana,
        meaningVi: v.meaningVi,
        category: v.category
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
      if (!parsed || !Array.isArray(parsed.examples)) {
        throw new AIError("AI returned invalid JSON format for vocabulary examples.", parsed, true);
      }

      const examplesMap = new Map<string, VocabularyExample[]>();
      for (const item of parsed.examples) {
        if (item.vocabularyId && item.japanese && item.hiragana && item.meaningVi) {
          const arr = examplesMap.get(item.vocabularyId) || [];
          arr.push({
            japanese: item.japanese,
            hiragana: item.hiragana,
            meaningVi: item.meaningVi,
            meaningEn: item.meaningEn || undefined,
          });
          examplesMap.set(item.vocabularyId, arr);
        }
      }

      const vocabularyWithExamples: VocabularyItem[] = vocabulary.map((item) => {
        return {
          ...item,
          examples: examplesMap.get(item.id) || item.examples || [],
        };
      });

      return {
        status: StepState.SUCCESS,
        updatedContext: {
          generated: {
            ...context.generated,
            vocabularyWithExamples,
          },
        },
      };
    } catch (err: any) {
      if (err instanceof AIError) {
        throw err;
      }
      throw new AIError(`Failed to generate vocabulary examples: ${err.message}`, err, true);
    }
  }
}
