const KEY = 'mh_ai_settings';

export type AiProvider = 'none' | 'gemini' | 'ollama';

export interface AiSettings {
  provider: AiProvider;
  geminiKey: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export const AI_DEFAULTS: AiSettings = {
  provider: 'none',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'qwen3:8b',
};

export function getAiSettings(): AiSettings {
  if (typeof window === 'undefined') return AI_DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return AI_DEFAULTS;
    return { ...AI_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return AI_DEFAULTS;
  }
}

export function setAiSettings(s: AiSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function isAiConfigured(s: AiSettings): boolean {
  if (s.provider === 'gemini') return s.geminiKey.trim().length > 0;
  if (s.provider === 'ollama') return s.ollamaUrl.trim().length > 0;
  return false;
}

export function aiSettingsToHeaders(s: AiSettings): Record<string, string> {
  return {
    'x-ai-provider': s.provider,
    'x-ai-gemini-key': s.geminiKey,
    'x-ai-gemini-model': s.geminiModel,
    'x-ai-ollama-url': s.ollamaUrl,
    'x-ai-ollama-model': s.ollamaModel,
  };
}
