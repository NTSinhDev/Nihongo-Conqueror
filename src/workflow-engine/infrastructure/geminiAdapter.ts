import { GoogleGenAI } from "@google/genai";
import { IAIService } from "../application/ports";
import { AIError } from "../domain/errors";

export class GeminiAIService implements IAIService {
  private readonly ai?: GoogleGenAI;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config?: {
    apiKey?: string;
    defaultModel?: string;
    defaultTemperature?: number;
    timeoutMs?: number;
    maxRetries?: number;
  }) {
    this.defaultModel = config?.defaultModel || "gemini-3.5-flash";
    this.defaultTemperature = config?.defaultTemperature !== undefined ? config.defaultTemperature : 1.0;
    this.timeoutMs = config?.timeoutMs || 45000; // 45 seconds default for heavier steps
    this.maxRetries = config?.maxRetries !== undefined ? config.maxRetries : 3;

    const isBrowser = typeof window !== "undefined";
    const apiKey = config?.apiKey || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);

    if (!isBrowser) {
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required to initialize GeminiAIService.");
      }

      this.ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build", // Mandatory telemetry header
          }
        }
      });
    }
  }

  async generate(
    userPrompt: string,
    systemPrompt?: string,
    responseSchema?: any,
    options?: { temperature?: number; model?: string }
  ): Promise<string> {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
      // Client-side/browser environment: Delegate to the server-side API proxy to keep API key hidden and avoid permission issues
      try {
        const response = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userPrompt,
            systemPrompt,
            responseSchema,
            options,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned status ${response.status}`);
        }

        const data = await response.json();
        return data.text;
      } catch (error: any) {
        throw new AIError(`Gemini API proxy call failed: ${error.message || error}`, error, true);
      }
    }

    // Server-side environment: call Gemini directly
    if (!this.ai) {
      throw new Error("GoogleGenAI client is not initialized.");
    }

    const modelName = options?.model || this.defaultModel;
    const temperature = options?.temperature !== undefined ? options.temperature : this.defaultTemperature;

    let attempt = 0;
    let lastError: any = null;

    while (attempt < this.maxRetries) {
      attempt++;
      try {
        const startTime = Date.now();
        // Enforce timeout using Promise.race
        const response = await this.executeWithTimeout(
          this.ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature,
              responseMimeType: responseSchema ? "application/json" : undefined,
              responseSchema,
            }
          }),
          this.timeoutMs
        );

        const durationMs = Date.now() - startTime;

        // Standard response.text property access as required by the skill
        const text = response.text;
        if (text === undefined || text === null) {
          throw new AIError("Gemini response returned an empty or undefined content part.", null, false);
        }

        // AI Cost Monitoring & Telemetry
        const usage = (response as any).usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const responseTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || 0;

        console.log(`[TELEMETRY] [AI_COST_MONITOR]`, {
          model: modelName,
          temperature,
          durationMs,
          promptTokens,
          responseTokens,
          totalTokens,
          promptSizeChars: userPrompt.length + (systemPrompt ? systemPrompt.length : 0),
          responseSizeChars: text.length,
          attempt
        });

        return text;
      } catch (error: any) {
        lastError = error;
        
        // Propagate non-retryable errors immediately
        const isRetryable = error.name === "AIError" ? error.isRetryable : this.isErrorRetryable(error);
        if (!isRetryable || attempt >= this.maxRetries) {
          break;
        }

        // Exponential backoff before retrying
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Always wrap failures in custom AIError
    throw new AIError(
      `Gemini API call failed after ${attempt} attempt(s): ${lastError?.message || lastError}`,
      lastError,
      this.isErrorRetryable(lastError)
    );
  }

  /**
   * Helper to execute a promise with a maximum timeout duration.
   */
  private executeWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * Analyzes an error to determine if it is transient and should be retried.
   */
  private isErrorRetryable(error: any): boolean {
    const message = String(error.message || error).toLowerCase();
    
    // Quota limits, rate limits, server overloads, timeouts and network issues are retryable
    if (
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("exhausted") ||
      message.includes("500") ||
      message.includes("503") ||
      message.includes("overloaded") ||
      message.includes("timeout") ||
      message.includes("etimedout") ||
      message.includes("network")
    ) {
      return true;
    }
    return false;
  }
}
