import { describe, expect, it } from 'vitest'

import { memoryStore } from './memory-store'
import {
	STORAGE_KEYS,
	clearToken,
	isTokenExpired,
	readToken,
	readView,
	writeToken,
	writeView,
} from './storage'

describe('local settings', () => {
	it('keeps the original localStorage keys', () => {
		expect(STORAGE_KEYS.activeView).toBe('rjp-activeView')
		expect(STORAGE_KEYS.twitchAuthToken).toBe('rjp-twitchAuthToken')
		expect(STORAGE_KEYS.afterAuthAction).toBe('rjp-afterAuthAction')
	})

	it('restores a saved view and ignores unknown values', () => {
		const store = memoryStore({ [STORAGE_KEYS.activeView]: 'swipe' })
		expect(readView(store)).toBe('swipe')
		store.setItem(STORAGE_KEYS.activeView, 'sideways')
		expect(readView(store)).toBe('default')
	})

	it('writes the view back to the same key', () => {
		const store = memoryStore()
		writeView(store, 'split')
		expect(store.getItem(STORAGE_KEYS.activeView)).toBe('split')
	})

	it('drops an expired token and keeps a token with no recorded expiry', () => {
		const expired = memoryStore({
			[STORAGE_KEYS.twitchAuthToken]: 'old-token',
			[STORAGE_KEYS.tokenExpiresAt]: '1000',
		})
		expect(isTokenExpired(1000, 1000)).toBe(true)
		expect(readToken(expired, 1000)).toBeNull()
		expect(expired.getItem(STORAGE_KEYS.twitchAuthToken)).toBeNull()

		const legacy = memoryStore({ [STORAGE_KEYS.twitchAuthToken]: 'still-here' })
		expect(readToken(legacy, 5_000)).toBe('still-here')
	})

	it('stores a fresh token beside the original key', () => {
		const store = memoryStore()
		writeToken(store, 'fresh', 50)
		expect(store.getItem(STORAGE_KEYS.twitchAuthToken)).toBe('fresh')
		expect(readToken(store, 49)).toBe('fresh')
		clearToken(store)
		expect(readToken(store)).toBeNull()
	})
})
