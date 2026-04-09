import { expect, test } from '@playwright/test'

async function resetGuestSession(page: import('@playwright/test').Page): Promise<void> {
  await page.context().clearCookies()
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
}

test('게스트 저장과 초안 플랜은 로그인 후 계정으로 이어진다', async ({ page }, testInfo) => {
  await resetGuestSession(page)

  await expect(
    page.getByRole('heading', { name: /여행 장소를 장바구니에 담고, 실행 가능한 일정으로 정리하세요/ }),
  ).toBeVisible()

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.screenshot({
    path: testInfo.outputPath('home-desktop.png'),
    fullPage: true,
  })

  await page.setViewportSize({ width: 412, height: 915 })
  await page.screenshot({
    path: testInfo.outputPath('home-mobile.png'),
    fullPage: true,
  })

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/places')

  const firstCard = page.locator('article').first()
  const placeName = (await firstCard.locator('h2').textContent())?.trim() ?? '저장한 장소'
  await firstCard.getByRole('button', { name: '장바구니 담기' }).click()
  await expect(firstCard.getByRole('button', { name: '담음' })).toBeVisible()

  await page.goto('/saved-places')
  await expect(page.getByText(placeName)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('saved-places-guest.png'),
    fullPage: true,
  })

  const planTitle = `게스트 플랜 ${Date.now()}`
  await page.goto('/plans')
  await page.getByLabel('제목').fill(planTitle)
  await page.getByRole('button', { name: '브라우저에 초안 저장' }).click()
  await expect(page.getByText(planTitle)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('plans-guest.png'),
    fullPage: true,
  })

  await page.getByRole('link', { name: '로그인 후 계정에 가져오기' }).click()
  await expect(page).toHaveURL(/\/login\?next=(%2Fplans|\/plans)$/)
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()

  await page.getByRole('link', { name: '회원가입' }).click()
  await expect(page).toHaveURL(/\/signup\?next=(%2Fplans|\/plans)$/)
  await expect(page.getByRole('button', { name: '계정 만들기' })).toBeVisible()

  const email = `qa+${Date.now()}@tripcart.local`
  await page.getByPlaceholder('이메일').fill(email)
  await page.getByPlaceholder('비밀번호 (6자 이상)').fill('tripcart123!')
  await page.getByRole('button', { name: '계정 만들기' }).click()

  await expect(page).toHaveURL(/\/plans$/)
  await expect(page.getByText(/계정으로 가져왔습니다/)).toBeVisible()
  await expect(page.getByText(planTitle)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('plans-after-migration.png'),
    fullPage: true,
  })

  await page.goto('/saved-places')
  await expect(page.getByText(placeName)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('saved-places-after-migration.png'),
    fullPage: true,
  })

  await page.goto('/plans')
  await page.getByRole('link', { name: '플랜 열기' }).first().click()
  await expect(page.getByRole('heading', { name: '플랜 상세와 수정' })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('plan-detail-after-migration.png'),
    fullPage: true,
  })
})

test('게스트 상태는 새로고침 후에도 브라우저에 유지된다', async ({ page }, testInfo) => {
  await resetGuestSession(page)

  await page.goto('/places')
  const firstCard = page.locator('article').first()
  const placeName = (await firstCard.locator('h2').textContent())?.trim() ?? '저장한 장소'
  await firstCard.getByRole('button', { name: '장바구니 담기' }).click()

  const planTitle = `브라우저 유지 ${Date.now()}`
  await page.goto('/plans')
  await page.getByLabel('제목').fill(planTitle)
  await page.getByRole('button', { name: '브라우저에 초안 저장' }).click()
  await expect(page.getByText(planTitle)).toBeVisible()

  await page.reload()
  await expect(page.getByText(planTitle)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('plans-guest-persisted.png'),
    fullPage: true,
  })

  await page.goto('/saved-places')
  await expect(page.getByText(placeName)).toBeVisible()
  await page.reload()
  await expect(page.getByText(placeName)).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('saved-places-guest-persisted.png'),
    fullPage: true,
  })
})
