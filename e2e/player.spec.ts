import { expect, test, type Page } from '@playwright/test'

async function openReadyPlayer(page: Page) {
	await page.goto('/')
	await expect(page.locator('#player')).toHaveAttribute('style', /height:\s*\d+px/)
}

test('loads, switches panes, and keeps the saved view', async ({ page }) => {
	const pageErrors: string[] = []
	page.on('pageerror', (error) => pageErrors.push(error.message))

	await openReadyPlayer(page)
	await expect(page.getByRole('heading', { name: 'Remote Jackbox Player' })).toBeVisible()
	await expect(page.locator('#gameFrame')).toBeVisible()

	await page.locator('#setupSplitViewButton').click()
	await expect(page.locator('#player')).toHaveAttribute('data-view', 'split')
	await expect(page.locator('#howTo')).toBeVisible()
	await expect(page.locator('#gameFrame')).toBeVisible()

	await page.locator('#setupSwapViewButton').click()
	await expect(page.locator('#player')).toHaveAttribute('data-view', 'swap')

	await page.reload()
	await expect(page.locator('#player')).toHaveAttribute('data-view', 'swap')
	await expect.poll(() => page.evaluate(() => localStorage.getItem('rjp-activeView'))).toBe('swap')

	const box = await page.locator('#menuButton').boundingBox()
	expect(box).not.toBeNull()
	if (!box) return
	const hit = await page.evaluate(
		({ x, y }) => {
			const el = document.elementFromPoint(x, y)
			return el?.closest('#menu') ? 'menu' : 'outside'
		},
		{ x: box.x + box.width + 28, y: box.y + box.height / 2 },
	)
	expect(hit).toBe('outside')
	expect(pageErrors).toEqual([])
})

test('scroll view stacks both panes inside the player', async ({ page }) => {
	await openReadyPlayer(page)
	await page.locator('#setupScrollViewButton').click()
	await expect(page.locator('#player')).toHaveAttribute('data-view', 'scroll')
	const scrollable = await page.locator('#player').evaluate((element) => element.scrollHeight > element.clientHeight + 40)
	expect(scrollable).toBe(true)
	await page.locator('#player').evaluate((element) => {
		element.scrollTop = element.scrollHeight
	})
	await expect(page.locator('#gameFrame')).toBeInViewport()
})

test('shows tooltips on load, hides them after the peek, and restores one on hover', async ({ page }) => {
	await openReadyPlayer(page)
	const howTo = page.getByRole('tooltip', { name: 'How-To' })
	const random = page.getByRole('tooltip', { name: 'Random' })
	await expect(howTo).toBeVisible()
	await expect(random).toBeVisible()
	await expect(howTo).toBeHidden()
	await expect(random).toBeHidden()
	await page.locator('#howToButton').hover()
	await expect(howTo).toBeVisible()
	await page.mouse.move(480, 360, { steps: 8 })
	await expect(howTo).toBeHidden()
	await page.locator('#randomStreamButton').hover()
	await expect(random).toBeVisible()
})

test('keeps internal navigation on this host', async ({ page }) => {
	await openReadyPlayer(page)
	const host = new URL(page.url()).host
	await page.getByRole('link', { name: 'game pane' }).click()
	expect(new URL(page.url()).host).toBe(host)
	expect(page.url()).not.toContain('isaacyakl.com')
	expect(page.url()).not.toContain('remote-jackbox-player.vercel.app')

	const input = page.locator('#streamURL')
	await input.fill('https://example.com/live')
	await input.press('Enter')
	await expect(page).toHaveURL(/streamURL=https%3A%2F%2Fexample.com%2Flive/)
	expect(new URL(page.url()).host).toBe(host)

	// Submitting a stream closes the chrome and the stream iframe covers the bar.
	await page.locator('#menuButton').click()
	await expect(page.locator('#shareButton')).toBeVisible()
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
	await page.locator('#shareButton').click()
	await expect(page.getByRole('alert').filter({ hasText: 'URL Copied' })).toBeVisible()
	const copied = await page.evaluate(() => navigator.clipboard.readText())
	const shared = new URL(copied)
	expect(shared.host).toBe(host)
	expect(shared.searchParams.get('streamURL')).toBe('https://example.com/live')
	expect(shared.protocol + '//' + shared.host).not.toBe('https://remote-jackbox-player.isaacyakl.com')
})

test('keeps a stream url in the address bar and the field', async ({ page }) => {
	await openReadyPlayer(page)
	const input = page.locator('#streamURL')
	await input.fill('https://example.com/live')
	await input.press('Enter')
	await expect(page).toHaveURL(/streamURL=https%3A%2F%2Fexample.com%2Flive/)
	await page.reload()
	await expect(page.locator('#streamURL')).toHaveValue('https://example.com/live')
	await expect(page.locator('#unknownStream')).toHaveAttribute('src', 'https://example.com/live')
})
