import { describe, expect, it } from 'vitest'

import {
	documentTitleForStream,
	normalizeStreamInput,
	resolveStreamInput,
	shareUrl,
	streamCommitAction,
} from './stream-url'
import { layoutForView, toggleStreamInFront } from './views'

describe('stream urls', () => {
	it('adds https and strips a duplicated protocol', () => {
		expect(normalizeStreamInput('twitch.tv/bob')).toBe('https://twitch.tv/bob')
		expect(normalizeStreamInput('http://example.com/watch')).toBe('https://example.com/watch')
		expect(normalizeStreamInput('https://')).toBe('https://')
	})

	it('recognizes twitch channels, inception, and other urls', () => {
		expect(resolveStreamInput('')).toEqual({ kind: 'empty' })
		expect(resolveStreamInput('https://twitch.tv/CoolName')).toEqual({
			kind: 'twitch',
			value: 'https://twitch.tv/CoolName',
			channel: 'CoolName',
		})
		expect(resolveStreamInput('https://www.twitch.tv/coolname')).toMatchObject({ channel: 'coolname' })
		expect(resolveStreamInput('https://remote-jackbox-player.isaacyakl.com').kind).toBe('howto')
		expect(resolveStreamInput('https://example.com/live').kind).toBe('unknown')
		expect(resolveStreamInput('https://twitch.tv').kind).toBe('unknown')
	})

	it('commits a real url and clears a partial protocol', () => {
		expect(streamCommitAction('', 'https://twitch.tv/a')).toBe('set')
		expect(streamCommitAction('https://twitch.tv/a', 'https://twitch.tv/a')).toBe('ignore')
		expect(streamCommitAction('https://twitch.tv/a', 'https://')).toBe('clear')
	})

	it('builds a share url without a hash', () => {
		expect(documentTitleForStream('https://twitch.tv/a')).toBe('Remote Jackbox Player - https://twitch.tv/a')
		const shared = new URL(shareUrl('https://remote-jackbox-player.isaacyakl.com', '/', 'https://twitch.tv/a'))
		expect(shared.searchParams.get('streamURL')).toBe('https://twitch.tv/a')
		expect(shared.hash).toBe('')
	})
})

describe('views', () => {
	it('shows both panes side by side in split view and hides swap controls', () => {
		const layout = layoutForView('split', true)
		expect(layout.playerClass).toContain('flex-row')
		expect(layout.streamClass).toContain('w-1/2')
		expect(layout.gameClass).toContain('w-1/2')
		expect(layout.swapVisibility).toBe('never')
	})

	it('stacks swap view and flips which pane is in front', () => {
		const streamFront = layoutForView('swap', true)
		expect(streamFront.streamClass).toContain('z-20')
		expect(streamFront.gameClass).toContain('z-10')
		const gameFront = layoutForView('swap', toggleStreamInFront(true))
		expect(gameFront.gameClass).toContain('z-20')
		expect(gameFront.swapVisibility).toBe('always')
	})

	it('keeps the default mobile game pane hidden until the large breakpoint', () => {
		const layout = layoutForView('default', true)
		expect(layout.gameClass).toContain('hidden')
		expect(layout.gameClass).toContain('lg:block')
		expect(layout.swapVisibility).toBe('small')
	})
})
