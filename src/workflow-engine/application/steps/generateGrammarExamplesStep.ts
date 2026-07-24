import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState, GrammarItem, GrammarExample } from "../../domain/types";
import { ValidationError, BusinessError, AIError } from "../../domain/errors";
import { PromptRegistry } from "../../prompts/promptRegistry";
import { PromptRenderer } from "../../prompts/promptRenderer";

export class GenerateGrammarExamplesStep implements IStepHandler {
  public readonly stepId = "generate-grammar-examples";
  public readonly description = "Generate natural Japanese dialogue or sentence examples with translations and explanations for grammar patterns";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running GenerateGrammarExamplesStep for draft: ${execContext.draftId}`);

    const grammar = context.validated?.grammar;

    if (!grammar || grammar.length === 0) {
      throw new BusinessError("No validated grammar items found to generate examples for. Please run validation step first.");
    }

    const template = PromptRegistry.getTemplate(this.stepId);
    const rendered = PromptRenderer.render(template, {
      level: context.metadata?.level || "General",
      grammar: grammar.map((g) => ({
        id: g.id,
        pattern: g.pattern,
        meaningVi: g.meaningVi,
        explanationVi: g.explanationVi
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
      if (!parsed || !Array.isArray(parsed.grammarDetails)) {
        throw new AIError("AI returned invalid JSON format for grammar examples.", parsed, true);
      }

      const detailsMap = new Map<string, {
        explanationEn?: string;
        explanationVi?: string;
        meaningEn?: string;
        examples: GrammarExample[];
      }>();

      for (const item of parsed.grammarDetails) {
        if (item.grammarId && Array.isArray(item.examples)) {
          detailsMap.set(item.grammarId, {
            explanationEn: item.explanationEn,
            explanationVi: item.explanationVi,
            meaningEn: item.meaningEn,
            examples: item.examples.map((ex: any) => ({
              japanese: ex.japanese,
              hiragana: ex.hiragana,
              meaningVi: ex.meaningVi,
              meaningEn: ex.meaningEn || undefined,
            })),
          });
        }
      }

      const grammarWithExamples: GrammarItem[] = grammar.map((item) => {
        const gen = detailsMap.get(item.id);
        return {
          ...item,
          explanationEn: gen?.explanationEn || item.explanationEn || undefined,
          explanationVi: gen?.explanationVi || item.explanationVi,
          meaningEn: gen?.meaningEn || item.meaningEn || undefined,
          examples: gen?.examples || item.examples || [],
        };
      });

      // Maintain a copy for grammarWithMeanings as well
      const grammarWithMeanings: GrammarItem[] = grammarWithExamples.map((item) => ({
        ...item,
        examples: [], // just the meanings and explanations, no examples
      }));

      return {
        status: StepState.SUCCESS,
        updatedContext: {
          generated: {
            ...context.generated,
            grammarWithMeanings,
            grammarWithExamples,
          },
        },
      };
    } catch (err: any) {
      if (err instanceof AIError) {
        throw err;
      }
      throw new AIError(`Failed to generate grammar examples: ${err.message}`, err, true);
    }
  }
}
