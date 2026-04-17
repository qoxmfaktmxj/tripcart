import { describe, expect, it } from 'vitest'
import { resolveAiProvider } from './ai-provider'

describe('resolveAiProvider', () => {
  it('returns unconfigured when no supported key exists', () => {
    expect(resolveAiProvider({})).toEqual({
      provider: null,
      apiKey: null,
      status: 'missing_key',
    })
  })

  it('uses Anthropic when only ANTHROPIC_API_KEY is present', () => {
    const secretValue = 'dummy-anthropic'
    const result = resolveAiProvider({ ANTHROPIC_API_KEY: secretValue })

    expect(result).toMatchObject({ provider: 'anthropic', status: 'ready' })
    expect(result.apiKey).toBe(secretValue)
  })

  it('uses OpenAI when only OPENAI_API_KEY is present', () => {
    const secretValue = 'dummy-openai'
    const result = resolveAiProvider({ OPENAI_API_KEY: secretValue })

    expect(result).toMatchObject({ provider: 'openai', status: 'ready' })
    expect(result.apiKey).toBe(secretValue)
  })

  it('honors explicit AI_PROVIDER when both keys are present', () => {
    const anthropicSecret = 'dummy-anthropic'
    const result = resolveAiProvider({
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: anthropicSecret,
      OPENAI_API_KEY: 'dummy-openai',
    })

    expect(result).toMatchObject({ provider: 'anthropic', status: 'ready' })
    expect(result.apiKey).toBe(anthropicSecret)
  })

  it('reports missing key when explicit provider has no matching key', () => {
    expect(
      resolveAiProvider({
        AI_PROVIDER: 'openai',
        ANTHROPIC_API_KEY: 'dummy-anthropic',
      }),
    ).toEqual({
      provider: 'openai',
      apiKey: null,
      status: 'missing_key',
    })
  })
})
