import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, VocabularyItem } from "../../domain/types";
import { ValidationError, BusinessError, AIError } from "../../domain/errors";
import { PromptRegistry } from "../../prompts/promptRegistry";
import { PromptRenderer } from "../../prompts/promptRenderer";

export class GenerateEnglishStep implements IStepHandler {
  public readonly stepId = "generate-english";
  public readonly description = "Generate professional English translation and category for Japanese vocabulary";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running GenerateEnglishStep for draft: ${execContext.draftId}`);

    const vocabulary = context.validated?.vocabulary;

    if (!vocabulary || vocabulary.length === 0) {
      throw new BusinessError("No validated vocabulary found. Run validation step first.");
    }

    const template = PromptRegistry.getTemplate(this.stepId);
    const rendered = PromptRenderer.render(template, {
      level: context.metadata?.level || "General",
      vocabulary: vocabulary.map((v) => ({
        id: v.id,
        kanji: v.kanji,
        hiragana: v.hiragana,
        meaningVi: v.meaningVi
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
      if (!parsed || !Array.isArray(parsed.translations)) {
        throw new AIError("AI returned invalid JSON format for English translations.", parsed, true);
      }

      const translationsMap = new Map<string, { meaningEn: string; category: string }>();
      for (const item of parsed.translations) {
        if (item.id && item.meaningEn && item.category) {
          translationsMap.set(item.id, {
            meaningEn: item.meaningEn,
            category: item.category,
          });
        }
      }

      const vocabularyWithMeanings: VocabularyItem[] = vocabulary.map((item) => {
        const generated = translationsMap.get(item.id);
        return {
          ...item,
          meaningEn: generated?.meaningEn || item.meaningEn || "TBD",
          category: generated?.category || item.category || "General",
        };
      });

      return {
        status: StepState.SUCCESS,
        updatedContext: {
          generated: {
            ...context.generated,
            vocabularyWithMeanings,
          },
        },
      };
    } catch (err: any) {
      if (err instanceof AIError) {
        throw err;
      }
      throw new AIError(`Failed to generate English meanings: ${err.message}`, err, true);
    }
  }
}
