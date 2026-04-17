export type AiProvider = 'anthropic' | 'openai'

export type AiProviderEnv = Record<string, string | undefined> & {
  AI_PROVIDER?: string
  ANTHROPIC_API_KEY?: string
  OPENAI_API_KEY?: string
}

export type AiProviderResolution =
  | {
      provider: AiProvider
      apiKey: string
      status: 'ready'
    }
  | {
      provider: AiProvider | null
      apiKey: null
      status: 'missing_key'
    }

function normalizeProvider(value: string | undefined): AiProvider | 'auto' {
  if (value === 'anthropic' || value === 'openai') return value
  return 'auto'
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function resolveAiProvider(env: AiProviderEnv = process.env): AiProviderResolution {
  const requested = normalizeProvider(env.AI_PROVIDER)
  const anthropicKey = nonEmpty(env.ANTHROPIC_API_KEY)
  const openAiKey = nonEmpty(env.OPENAI_API_KEY)

  if (requested === 'anthropic') {
    return anthropicKey
      ? { provider: 'anthropic', apiKey: anthropicKey, status: 'ready' }
      : { provider: 'anthropic', apiKey: null, status: 'missing_key' }
  }

  if (requested === 'openai') {
    return openAiKey
      ? { provider: 'openai', apiKey: openAiKey, status: 'ready' }
      : { provider: 'openai', apiKey: null, status: 'missing_key' }
  }

  if (openAiKey) {
    return { provider: 'openai', apiKey: openAiKey, status: 'ready' }
  }

  if (anthropicKey) {
    return { provider: 'anthropic', apiKey: anthropicKey, status: 'ready' }
  }

  return { provider: null, apiKey: null, status: 'missing_key' }
}
