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

  test('home cart drawer exposes minimum dialog semantics and keyboard escape handling', () => {
    const source = readRepoFile('apps/web/src/app/page.tsx')

    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby="cart-drawer-title"')
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain('cartButtonRef.current?.focus()')
  })

  test('auth forms expose labels, described-by errors, and alert semantics', () => {
    const files = [
      'apps/web/src/app/(auth)/login/page.tsx',
      'apps/web/src/app/(auth)/signup/page.tsx',
    ]

    for (const file of files) {
      const source = readRepoFile(file)

      expect(source, `${file} should label the email input`).toContain('htmlFor="email"')
      expect(source, `${file} should label the password input`).toContain('htmlFor="password"')
      expect(source, `${file} should connect fields to error text`).toContain(
        'aria-describedby={error ? \'auth-error\' : undefined}',
      )
      expect(source, `${file} should expose validation errors to assistive tech`).toContain(
        'role="alert"',
      )
      expect(source, `${file} should use high-contrast error text`).toContain('text-coral-900')
      expect(source, `${file} should use high-contrast text links`).toContain('text-primary-700')
    }
  })

  test('guest migration banner announces migration results politely', () => {
    const source = readRepoFile('apps/web/src/components/guest-migration-banner.tsx')

    expect(source).toContain('role="status"')
    expect(source).toContain('aria-live="polite"')
    expect(source).toContain('aria-atomic="true"')
  })

  test('plan stop mutation routes map late active execution races to contract errors', () => {
    const stopRoute = readRepoFile(
      'apps/web/src/app/api/v1/plans/[id]/stops/[stopId]/route.ts',
    )
    const reorderRoute = readRepoFile(
      'apps/web/src/app/api/v1/plans/[id]/stops/reorder/route.ts',
    )

    expect(stopRoute).toContain("includes('PLAN_IN_PROGRESS')")
    expect(reorderRoute).toContain("includes('PLAN_IN_PROGRESS')")
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

  test('mobile browse and plan detail render native UI instead of reference PNGs', () => {
    const expectations = [
      {
        file: 'apps/mobile/app/(tabs)/browse.tsx',
        dataAnchor: 'PLACE_CARDS',
      },
      {
        file: 'apps/mobile/app/plan/[id].tsx',
        dataAnchor: 'PLAN_STOPS',
      },
    ]

    for (const { file, dataAnchor } of expectations) {
      const source = readRepoFile(file)

      expect(source, `${file} should not import capture-only references`).not.toContain('assets/reference')
      expect(source, `${file} should not render a single reference image`).not.toContain('<Image ')
      expect(source, `${file} should use ImageBackground as part of the native RN layout`).toContain('ImageBackground')
      expect(source, `${file} should render structured screen data`).toContain(dataAnchor)
    }
  })

  test('mobile operational screens keep touch targets and accessibility state explicit', () => {
    const files = [
      'apps/mobile/app/(tabs)/browse.tsx',
      'apps/mobile/app/plan/[id].tsx',
      'apps/mobile/app/(tabs)/plan-detail.tsx',
    ]

    for (const file of files) {
      const source = readRepoFile(file)
      const pressableCount = source.match(/<Pressable\b/g)?.length ?? 0
      const roleCount = source.match(/accessibilityRole="button"/g)?.length ?? 0
      const labelCount = source.match(/accessibilityLabel=/g)?.length ?? 0

      expect(pressableCount, `${file} should expose native Pressable interactions`).toBeGreaterThan(0)
      expect(roleCount, `${file} should label every Pressable as a button`).toBe(pressableCount)
      expect(labelCount, `${file} should give every Pressable an accessibility label`).toBeGreaterThanOrEqual(
        pressableCount,
      )
      expect(source, `${file} should keep mobile touch targets at least 44px`).toContain('minHeight: 44')
      expect(source, `${file} should expose selected or disabled state for stateful controls`).toContain('accessibilityState')
    }
  })
})
