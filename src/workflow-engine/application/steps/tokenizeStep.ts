import { IStepHandler, StepExecutionContext, StepResult } from "../step";
import { PipelineContext, StepState } from "../../domain/types";
import { ValidationError, BusinessError, AIError } from "../../domain/errors";

export class TokenizeStep implements IStepHandler {
  public readonly stepId = "tokenize-vocabulary";
  public readonly description = "Tokenize Japanese vocabulary words using AI";

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    execContext.logger.info(`Running TokenizeStep for draft: ${execContext.draftId}`);

    const vocabulary = context.validated?.vocabulary;

    if (!vocabulary || vocabulary.length === 0) {
      throw new BusinessError("No validated vocabulary found. Run validation step first.");
    }

    const wordsToTokenize = vocabulary.map((item) => {
      return item.kanji ? `${item.kanji} (${item.hiragana})` : item.hiragana;
    });

    const systemInstruction = "You are a professional Japanese linguistic parser. Analyze the given Japanese words and break them down into separate tokens/morphemes. Return the results strictly as a JSON object.";
    
    const responseSchema = {
      type: "OBJECT",
      properties: {
        vocabularyTokens: {
          type: "OBJECT",
          additionalProperties: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      },
      required: ["vocabularyTokens"]
    };

    const prompt = `
Please tokenize each of the following Japanese words into its constituent morphemes or particles.
Format the output as a JSON object where each key is the original word (exactly as listed below, e.g. "食べる" or "猫") and the value is an array of string tokens.

Words to tokenize:
${JSON.stringify(wordsToTokenize, null, 2)}
`;

    try {
      const responseText = await execContext.aiService.generate(
        prompt,
        systemInstruction,
        responseSchema,
        { model: execContext.aiModel }
      );

      const parsed = JSON.parse(responseText);
      if (!parsed || typeof parsed.vocabularyTokens !== "object") {
        throw new AIError("AI returned invalid JSON structure for tokenization.", parsed, true);
      }

      // Map the response keys back to the standard vocabulary items
      const vocabularyTokens: Record<string, string[]> = {};
      for (const item of vocabulary) {
        const lookupKeyWithKanji = item.kanji ? `${item.kanji} (${item.hiragana})` : item.hiragana;
        const tokens = parsed.vocabularyTokens[lookupKeyWithKanji] || parsed.vocabularyTokens[item.kanji || ""] || parsed.vocabularyTokens[item.hiragana] || [item.hiragana];
        vocabularyTokens[item.id] = tokens;
      }

      return {
        status: StepState.SUCCESS,
        updatedContext: {
          tokenized: {
            vocabularyTokens,
          },
        },
      };
    } catch (err: any) {
      if (err instanceof AIError) {
        throw err;
      }
      throw new AIError(`Failed to tokenize Japanese vocabulary: ${err.message}`, err, true);
    }
  }
}
