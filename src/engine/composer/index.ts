import {
  AICompositionRequest,
  AICompositionResponse,
} from '../../types/schema';
import { generateCover } from '../generator';
import {
  buildLlmPrompt,
  callLlmComposition,
  LlmAdapterConfig,
  parseAndValidateLlmResponse,
} from './llm-adapter';

export {
  buildLlmPrompt,
  callLlmComposition,
  parseAndValidateLlmResponse,
};
export type { LlmAdapterConfig } from './llm-adapter';

export interface ComposeCoverOptions {
  useLlm?: boolean;
  llmConfig?: LlmAdapterConfig;
}

/**
 * Universal cover orchestrator with automatic fallback:
 * 1. If useLlm is requested, tries LLM adapter.
 * 2. If LLM fails (network error, timeout, or schema invalidation), gracefully falls back to offline canonical generator.
 * 3. By default (useLlm = false), operates 100% offline in browser in <5ms producing tight 2-3 item canonical compositions.
 */
export async function composeCover(
  request: AICompositionRequest,
  options: ComposeCoverOptions = {}
): Promise<AICompositionResponse> {
  if (options.useLlm) {
    try {
      const llmResult = await callLlmComposition(request, options.llmConfig);
      return llmResult;
    } catch (err) {
      console.warn(
        '[AIComposer] LLM generation failed or unavailable. Seamlessly falling back to offline heuristics.',
        err
      );
    }
  }

  return generateCover(request);
}
