import type { AIProvider } from "./types";

export * from "./types";

/**
 * Stub provider used until AI_PROVIDER_API_KEY (see .env.example) is set
 * and a real provider is wired up in a future phase. Every method is
 * intentionally left unimplemented so callers fail loudly and visibly
 * instead of silently returning fabricated content.
 */
const unconfiguredProvider: AIProvider = {
  name: "unconfigured",
};

/**
 * Returns the active AI provider. Swap this out for a real implementation
 * (e.g. an OpenAI or Anthropic-backed provider) once Phase 2 begins —
 * every call site in the app already goes through this function.
 */
export function getAIProvider(): AIProvider {
  return unconfiguredProvider;
}

export const isAIConfigured = false;
