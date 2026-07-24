/**
 * Lightweight Feature Flags System for toggling prompts, models, and experimental steps.
 */
export const FEATURE_FLAGS = {
  // Enables experimental step handlers
  EXPERIMENTAL_STEPS_ENABLED: import.meta.env.VITE_EXPERIMENTAL_STEPS_ENABLED === "true" || false,
  
  // Toggles between different prompt library versions
  PROMPT_VERSION: import.meta.env.VITE_PROMPT_VERSION || "v1",
  
  // Sets the default AI model to use
  DEFAULT_AI_MODEL: import.meta.env.VITE_DEFAULT_AI_MODEL || "gemini-3.5-flash",
  
  // Whether to enforce strict validations
  STRICT_VALIDATION_ENABLED: import.meta.env.VITE_STRICT_VALIDATION_ENABLED !== "false",
};

/**
 * Check if a specific feature is enabled.
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return !!FEATURE_FLAGS[flag];
}
