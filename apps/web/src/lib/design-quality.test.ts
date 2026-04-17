import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve(process.cwd(), '../..')

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

describe('TripCart design quality guardrails', () => {
  test('places cards keep place names readable on small screens', () => {
    const source = readRepoFile('apps/web/src/app/places/page.tsx')

    expect(source).not.toContain('text-[2rem] font-bold tracking-tight text-primary-900')
    expect(source).toContain('min-w-0 flex-1')
    expect(source).toContain('break-keep')
    expect(source).toContain('h-11 items-center justify-center rounded-full bg-neutral-100')
  })

  test('web screens avoid ad-hoc brand hex classes for core UI controls', () => {
    const files = [
      'apps/web/src/app/page.tsx',
      'apps/web/src/app/places/page.tsx',
      'apps/web/src/app/plans/page.tsx',
      'apps/web/src/app/plans/[id]/page.tsx',
      'apps/web/src/app/saved-places/page.tsx',
    ]
    const disallowed = [
      '#2f8a88',
      '#2a7674',
      '#2f6f73',
      '#e8f4ef',
      '#eaf8f5',
      '#6ca8a2',
    ]

    for (const file of files) {
      const source = readRepoFile(file).toLowerCase()
      for (const value of disallowed) {
        expect(source, `${file} should use design tokens instead of ${value}`).not.toContain(value)
      }
    }
  })

  test('web screens stay within the canonical radius scale', () => {
    const files = [
      'apps/web/src/app/page.tsx',
      'apps/web/src/app/places/page.tsx',
      'apps/web/src/app/plans/page.tsx',
      'apps/web/src/app/plans/[id]/page.tsx',
      'apps/web/src/app/saved-places/page.tsx',
    ]
    const oversizedRadii = [
      'rounded-[1.65rem]',
      'rounded-[1.75rem]',
      'rounded-[1.85rem]',
      'rounded-[1.9rem]',
      'rounded-[2rem]',
    ]

    for (const file of files) {
      const source = readRepoFile(file)
      for (const value of oversizedRadii) {
        expect(source, `${file} should use canonical radius tokens instead of ${value}`).not.toContain(value)
      }
    }
  })

  test('plan detail does not expose developer-only API navigation', () => {
    const source = readRepoFile('apps/web/src/app/plans/[id]/page.tsx')

    expect(source).not.toContain('API 보기')
    expect(source).not.toContain('kind: \'api\'')
    expect(source).not.toContain('kind === \'api\'')
  })

  test('mobile Pressables expose accessible button semantics', () => {
    const files = [
      'apps/mobile/app/(tabs)/index.tsx',
      'apps/mobile/app/(tabs)/plans.tsx',
      'apps/mobile/app/(tabs)/search.tsx',
    ]

    for (const file of files) {
      const source = readRepoFile(file)
      const pressableCount = source.match(/<Pressable\b/g)?.length ?? 0
      const roleCount = source.match(/accessibilityRole="button"/g)?.length ?? 0
      const labelCount = source.match(/accessibilityLabel="/g)?.length ?? 0

      expect(roleCount, `${file} should label every Pressable as a button`).toBe(pressableCount)
      expect(labelCount, `${file} should give every Pressable a Korean accessibility label`).toBe(pressableCount)
    }
  })
})
