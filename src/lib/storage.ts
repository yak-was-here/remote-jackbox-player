export const STORAGE_KEYS = {
	activeView: 'rjp-activeView',
	twitchAuthToken: 'rjp-twitchAuthToken',
	afterAuthAction: 'rjp-afterAuthAction',
	tokenExpiresAt: 'rjp-twitchTokenExpiresAt',
} as const

export const SESSION_KEYS = {
	oauthState: 'rjp-oauthState',
	oauthCallback: 'rjp-oauthCallback',
} as const

export const VIEW_IDS = ['default', 'split', 'swap', 'scroll', 'swipe'] as const

export type ViewId = (typeof VIEW_IDS)[number]

export interface KeyValueStore {
	getItem(key: string): string | null
	setItem(key: string, value: string): void
	removeItem(key: string): void
}

export function isViewId(value: string | null): value is ViewId {
	return VIEW_IDS.some((view) => view === value)
}

export function readView(store: KeyValueStore): ViewId {
	const value = store.getItem(STORAGE_KEYS.activeView)
	return isViewId(value) ? value : 'default'
}

export function writeView(store: KeyValueStore, view: ViewId): void {
	store.setItem(STORAGE_KEYS.activeView, view)
}

export function readExpiresAt(store: KeyValueStore): number | null {
	const raw = store.getItem(STORAGE_KEYS.tokenExpiresAt)
	if (raw === null) return null
	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : null
}

export function isTokenExpired(expiresAt: number | null, now = Date.now()): boolean {
	return expiresAt !== null && now >= expiresAt
}

export function readToken(store: KeyValueStore, now = Date.now()): string | null {
	const token = store.getItem(STORAGE_KEYS.twitchAuthToken)
	if (token === null || token === '') return null
	if (isTokenExpired(readExpiresAt(store), now)) {
		clearToken(store)
		return null
	}
	return token
}

export function writeToken(store: KeyValueStore, token: string, expiresAt: number | null): void {
	store.setItem(STORAGE_KEYS.twitchAuthToken, token)
	if (expiresAt === null) store.removeItem(STORAGE_KEYS.tokenExpiresAt)
	else store.setItem(STORAGE_KEYS.tokenExpiresAt, String(expiresAt))
}

export function clearToken(store: KeyValueStore): void {
	store.removeItem(STORAGE_KEYS.twitchAuthToken)
	store.removeItem(STORAGE_KEYS.tokenExpiresAt)
}

export function readAfterAuthAction(store: KeyValueStore): string | null {
	return store.getItem(STORAGE_KEYS.afterAuthAction)
}

export function writeAfterAuthAction(store: KeyValueStore, action: string): void {
	store.setItem(STORAGE_KEYS.afterAuthAction, action)
}

export function clearAfterAuthAction(store: KeyValueStore): void {
	store.removeItem(STORAGE_KEYS.afterAuthAction)
}

export function browserLocalStorage(): KeyValueStore | null {
	if (typeof window === 'undefined') return null
	return window.localStorage
}

export function browserSessionStorage(): KeyValueStore | null {
	if (typeof window === 'undefined') return null
	return window.sessionStorage
}
