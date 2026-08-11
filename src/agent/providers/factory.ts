import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { ProviderError } from "../../utils/errors";
import type { Config } from "../../config";

export type ProviderName = "openai" | "anthropic" | "google" | "openrouter" | "ollama" | "sglang";

/**
 * Create a language model instance for the given provider.
 * Model-agnostic: supports OpenAI, Anthropic, Google, OpenRouter, and Ollama.
 */
export function createModel(config: Config): LanguageModel {
  const { provider, model, apiKey, baseUrl } = config;

  switch (provider as ProviderName) {
    case "openai": {
      const openai = createOpenAI({
        apiKey: apiKey ?? process.env.OPENAI_API_KEY,
      });
      return openai(model);
    }

    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(model);
    }

    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(model);
    }

    case "openrouter":
    case "sglang": {
      const openrouter = createOpenAICompatible({
        name: "openrouter",
        baseURL: baseUrl ?? "https://openrouter.ai/api/v1",
        apiKey: apiKey ?? process.env.OPENROUTER_API_KEY,
      });
      return openrouter(model);
    }

    case "ollama": {
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL: baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      });
      return ollama(model);
    }

    default:
      throw new ProviderError(`Unsupported provider: ${provider}`);
  }
}

/** List of supported providers. */
export const SUPPORTED_PROVIDERS: ProviderName[] = [
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "ollama",
];
