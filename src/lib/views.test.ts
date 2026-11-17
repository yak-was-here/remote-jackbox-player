import { describe, expect, it } from 'vitest'

import { layoutForView } from './views'

describe('view layouts', () => {
	it('lets scroll view move between two full-height panes', () => {
		const layout = layoutForView('scroll', true)
		expect(layout.playerClass).toContain('overflow-y-auto')
		expect(layout.streamClass).toContain('h-full')
		expect(layout.gameClass).toContain('h-full')
		expect(layout.swapVisibility).toBe('never')
	})

	it('shows the swap control on small default screens and always in swap view', () => {
		expect(layoutForView('default', true).swapVisibility).toBe('small')
		expect(layoutForView('swap', true).swapVisibility).toBe('always')
		expect(layoutForView('split', true).swapVisibility).toBe('never')
	})

	it('puts the stream pane in front until the panes swap', () => {
		expect(layoutForView('swap', true).streamClass).toContain('z-20')
		expect(layoutForView('swap', false).streamClass).toContain('z-10')
		expect(layoutForView('swap', false).gameClass).toContain('z-20')
	})
})
