import { SESSION_KEYS } from './storage'

/** Public OAuth client id for the implicit grant. This is not a client secret. */
export const TWITCH_CLIENT_ID = '0h2wo7u731sh7c2r3st47cf6dtpnn9'

export const TWITCH_SCOPE = 'user:read:follows'
export const LOW_VIEWER_LIMIT = 8
export const MAX_HELIX_PAGES = 10
export const VALIDATION_INTERVAL_MS = 60 * 60 * 1000
export const USER_DENIED_ACCESS = 'The user denied you access'

export const JACKBOX_GAMES = [
	{ game_name: 'Jackbox Party Packs', game_id: '493174' },
	{ game_name: 'Drawful 2', game_id: '492935' },
	{ game_name: 'Quiplash', game_id: '490414' },
	{ game_name: 'Fibbage', game_id: '476477' },
] as const

export type JackboxGame = (typeof JACKBOX_GAMES)[number]

export const consumeOauthHashScript = `(function(){try{var hash=location.hash.charAt(0)==="#" ? location.hash.slice(1) : location.hash;if(!hash||(hash.indexOf("access_token=")===-1&&hash.indexOf("error=")===-1))return;sessionStorage.setItem(${JSON.stringify(SESSION_KEYS.oauthCallback)},hash);history.replaceState(null,"",location.pathname+location.search);}catch(e){}})();`

export interface ImplicitGrant {
	accessToken: string
	tokenType: string
	scope: string[]
	state: string
	expiresIn: number | null
}

export interface OauthError {
	error: string
	errorDescription: string
	state: string
}

export type OauthCallback = { type: 'token'; grant: ImplicitGrant } | { type: 'error'; error: OauthError }

export interface TwitchValidation {
	client_id: string
	login: string | null
	scopes: string[]
	user_id: string | null
	expires_in: number
}

export interface TwitchStream {
	id: string
	user_id: string
	user_login: string
	user_name: string
	game_id: string
	game_name: string
	type: string
	title: string
	viewer_count: number
	started_at: string
	language: string
	thumbnail_url: string
	tags: string[] | null
	is_mature: boolean
}

export interface TwitchUser {
	id: string
	login: string
	display_name: string
	profile_image_url: string
}

export interface FollowedJackboxStream {
	userName: string
	userLogin: string
	gameName: string
	viewerCount: number
	profileImageUrl: string
	title: string
}

export type ApiReason = 'unauthorized' | 'rate-limited' | 'error' | 'empty' | 'missing-user'

export interface ApiFailure {
	ok: false
	status: number
	reason: ApiReason
	message: string
}

export interface RandomStreamSuccess {
	ok: true
	url: string
	stream: TwitchStream
}

export type RandomStreamResult = RandomStreamSuccess | ApiFailure

export interface FollowedStreamsSuccess {
	ok: true
	streams: FollowedJackboxStream[]
}

export type FollowedStreamsResult = FollowedStreamsSuccess | ApiFailure

interface HelixPage<T> {
	data: T[]
	cursor: string | null
}

interface HelixSuccess<T> {
	ok: true
	data: T[]
	cursor: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | null {
	return typeof value === 'string' ? value : null
}

function readNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBoolean(value: unknown): boolean | null {
	return typeof value === 'boolean' ? value : null
}

function readStringList(value: unknown): string[] | null {
	if (!Array.isArray(value)) return null
	const items: string[] = []
	for (const item of value) {
		if (typeof item !== 'string') return null
		items.push(item)
	}
	return items
}

export function parseOauthCallback(hash: string): OauthCallback | null {
	const raw = hash.startsWith('#') ? hash.slice(1) : hash
	if (raw === '') return null
	const params = new URLSearchParams(raw)
	const accessToken = params.get('access_token')
	if (accessToken !== null && accessToken !== '') {
		const expiresRaw = params.get('expires_in')
		const expiresIn = expiresRaw === null ? null : Number(expiresRaw)
		const scope = params.get('scope') ?? ''
		return {
			type: 'token',
			grant: {
				accessToken,
				tokenType: params.get('token_type') ?? 'bearer',
				scope: scope.split(/[+\s]/).filter((item) => item !== ''),
				state: params.get('state') ?? '',
				expiresIn: expiresIn !== null && Number.isFinite(expiresIn) ? expiresIn : null,
			},
		}
	}
	const error = params.get('error')
	if (error === null) return null
	return {
		type: 'error',
		error: {
			error,
			errorDescription: params.get('error_description') ?? '',
			state: params.get('state') ?? '',
		},
	}
}

export function oauthStateMatches(expected: string | null, received: string): boolean {
	return expected !== null && expected !== '' && expected === received
}

export function createOauthState(randomBytes?: (length: number) => Uint8Array): string {
	const bytes = randomBytes ? randomBytes(16) : cryptoRandomBytes(16)
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function cryptoRandomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return bytes
}

export function buildAuthorizeUrl(options: {
	clientId: string
	redirectUri: string
	state: string
	scope?: string
	forceVerify?: boolean
}): string {
	const params = new URLSearchParams({
		client_id: options.clientId,
		redirect_uri: options.redirectUri,
		response_type: 'token',
		scope: options.scope ?? TWITCH_SCOPE,
		state: options.state,
	})
	if (options.forceVerify) params.set('force_verify', 'true')
	return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`
}

/** OAuth redirect for this page. Search and hash are ignored so the value stays a stable, registrable URI. */
export function redirectUriForLocation(location: { origin: string; pathname: string }): string {
	const path = location.pathname.startsWith('/') ? location.pathname : `/${location.pathname}`
	return `${location.origin}${path}`
}

export function expiresAtFromSeconds(expiresIn: number, now = Date.now()): number {
	return now + expiresIn * 1000
}

export function hasFollowScope(scopes: readonly string[]): boolean {
	return scopes.includes(TWITCH_SCOPE)
}

export function parseValidation(value: unknown): TwitchValidation | null {
	if (!isRecord(value)) return null
	const clientId = readString(value.client_id)
	const expiresIn = readNumber(value.expires_in)
	const scopes = readStringList(value.scopes)
	if (clientId === null || expiresIn === null || scopes === null) return null
	const login = value.login === null ? null : readString(value.login)
	const userId = value.user_id === null ? null : readString(value.user_id)
	if (value.login !== null && login === null) return null
	if (value.user_id !== null && userId === null) return null
	return { client_id: clientId, login, scopes, user_id: userId, expires_in: expiresIn }
}

export function parseStream(value: unknown): TwitchStream | null {
	if (!isRecord(value)) return null
	const id = readString(value.id)
	const userId = readString(value.user_id)
	const userLogin = readString(value.user_login)
	const userName = readString(value.user_name)
	const gameId = readString(value.game_id)
	const gameName = readString(value.game_name)
	const type = readString(value.type)
	const title = readString(value.title)
	const viewerCount = readNumber(value.viewer_count)
	const startedAt = readString(value.started_at)
	const language = readString(value.language)
	const thumbnailUrl = readString(value.thumbnail_url)
	const isMature = readBoolean(value.is_mature)
	if (
		id === null ||
		userId === null ||
		userLogin === null ||
		userName === null ||
		gameId === null ||
		gameName === null ||
		type === null ||
		title === null ||
		viewerCount === null ||
		startedAt === null ||
		language === null ||
		thumbnailUrl === null ||
		isMature === null
	) {
		return null
	}
	const tags = value.tags === null ? null : readStringList(value.tags)
	if (value.tags !== null && tags === null) return null
	return {
		id,
		user_id: userId,
		user_login: userLogin,
		user_name: userName,
		game_id: gameId,
		game_name: gameName,
		type,
		title,
		viewer_count: viewerCount,
		started_at: startedAt,
		language,
		thumbnail_url: thumbnailUrl,
		tags,
		is_mature: isMature,
	}
}

export function parseUser(value: unknown): TwitchUser | null {
	if (!isRecord(value)) return null
	const id = readString(value.id)
	const login = readString(value.login)
	const displayName = readString(value.display_name)
	const profileImageUrl = readString(value.profile_image_url)
	if (id === null || login === null || displayName === null || profileImageUrl === null) return null
	return { id, login, display_name: displayName, profile_image_url: profileImageUrl }
}

export function parseHelixPage<T>(value: unknown, parseItem: (item: unknown) => T | null): HelixPage<T> | null {
	if (!isRecord(value) || !Array.isArray(value.data)) return null
	const data: T[] = []
	for (const item of value.data) {
		const parsed = parseItem(item)
		if (parsed !== null) data.push(parsed)
	}
	let cursor: string | null = null
	if (value.pagination !== undefined) {
		if (!isRecord(value.pagination)) return null
		if (value.pagination.cursor !== undefined) {
			const parsedCursor = readString(value.pagination.cursor)
			if (parsedCursor === null) return null
			cursor = parsedCursor
		}
	}
	return { data, cursor }
}

export function isLowViewerStream(stream: TwitchStream, limit = LOW_VIEWER_LIMIT): boolean {
	return stream.viewer_count < limit
}

export function advanceCursor(seen: ReadonlySet<string>, cursor: string | null): string | null {
	if (cursor === null || cursor === '' || seen.has(cursor)) return null
	return cursor
}

export function pickRandomItem<T>(items: readonly T[], random: () => number): T | null {
	if (items.length === 0) return null
	const index = Math.floor(random() * items.length)
	return items[index] ?? null
}

export function gameNameForId(gameId: string, games: readonly JackboxGame[] = JACKBOX_GAMES): string {
	return games.find((game) => game.game_id === gameId)?.game_name ?? 'Jackbox'
}

export function formatViewerCount(count: number): string {
	if (count === 1) return '1 viewer'
	if (count === 0) return 'No viewers'
	return `${count.toLocaleString()} viewers`
}

export function formatViewerTitle(count: number): string {
	if (count === 1) return '1 viewer'
	if (count === 0) return 'no one.'
	return `${count.toLocaleString()} viewers.`
}

export function jackboxGameIds(games: readonly JackboxGame[] = JACKBOX_GAMES): Set<string> {
	return new Set(games.map((game) => game.game_id))
}

async function helixGet<T>(
	url: URL,
	token: string,
	clientId: string,
	parse: (value: unknown) => HelixPage<T> | null,
	fetchImpl: typeof fetch,
): Promise<HelixSuccess<T> | ApiFailure> {
	let response: Response
	try {
		response = await fetchImpl(url, {
			headers: {
				'Client-ID': clientId,
				Authorization: `Bearer ${token}`,
			},
		})
	} catch {
		return { ok: false, status: 0, reason: 'error', message: 'Network error talking to Twitch.' }
	}
	if (response.status === 401) {
		return { ok: false, status: 401, reason: 'unauthorized', message: 'Twitch rejected the access token.' }
	}
	if (response.status === 429) {
		return {
			ok: false,
			status: 429,
			reason: 'rate-limited',
			message: 'Twitch rate limit reached. Try again in a moment.',
		}
	}
	if (!response.ok) {
		return { ok: false, status: response.status, reason: 'error', message: `Twitch request failed (${response.status}).` }
	}
	let body: unknown
	try {
		body = await response.json()
	} catch {
		return { ok: false, status: response.status, reason: 'error', message: 'Twitch returned an unreadable response.' }
	}
	const page = parse(body)
	if (page === null) {
		return { ok: false, status: response.status, reason: 'error', message: 'Twitch returned an unexpected response.' }
	}
	return { ok: true, data: page.data, cursor: page.cursor }
}

export async function validateToken(
	token: string,
	fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; validation: TwitchValidation } | { ok: false; status: number }> {
	let response: Response
	try {
		response = await fetchImpl('https://id.twitch.tv/oauth2/validate', {
			headers: { Authorization: `OAuth ${token}` },
		})
	} catch {
		return { ok: false, status: 0 }
	}
	if (!response.ok) return { ok: false, status: response.status }
	let body: unknown
	try {
		body = await response.json()
	} catch {
		return { ok: false, status: response.status }
	}
	const validation = parseValidation(body)
	if (validation === null) return { ok: false, status: response.status }
	return { ok: true, validation }
}

export async function revokeToken(clientId: string, token: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
	try {
		const response = await fetchImpl('https://id.twitch.tv/oauth2/revoke', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ client_id: clientId, token }),
		})
		return response.ok
	} catch {
		return false
	}
}

export async function findSmallJackboxStream(options: {
	token: string
	clientId?: string
	games?: readonly JackboxGame[]
	fetchImpl?: typeof fetch
	random?: () => number
	maxPages?: number
}): Promise<RandomStreamResult> {
	const clientId = options.clientId ?? TWITCH_CLIENT_ID
	const games = options.games ?? JACKBOX_GAMES
	const fetchImpl = options.fetchImpl ?? fetch
	const random = options.random ?? Math.random
	const maxPages = options.maxPages ?? MAX_HELIX_PAGES
	const pool: TwitchStream[] = []

	for (const game of games) {
		const collected: TwitchStream[] = []
		const seen = new Set<string>()
		let cursor: string | null = null
		for (let page = 0; page < maxPages && collected.length < 30; page += 1) {
			const url = new URL('https://api.twitch.tv/helix/streams')
			url.searchParams.set('language', 'en')
			url.searchParams.set('first', '30')
			url.searchParams.set('game_id', game.game_id)
			if (cursor !== null) url.searchParams.set('after', cursor)
			const result = await helixGet(url, options.token, clientId, (value) => parseHelixPage(value, parseStream), fetchImpl)
			if (!result.ok) return result
			for (const stream of result.data) {
				if (isLowViewerStream(stream)) collected.push(stream)
			}
			const next = advanceCursor(seen, result.cursor)
			if (next === null) break
			seen.add(next)
			cursor = next
		}
		pool.push(...collected)
	}

	const stream = pickRandomItem(pool, random)
	if (stream === null) {
		return { ok: false, status: 0, reason: 'empty', message: 'No small Jackbox streams are live right now.' }
	}
	const login = stream.user_login || stream.user_name
	return { ok: true, url: `https://twitch.tv/${login}`, stream }
}

export async function listFollowedJackboxStreams(options: {
	token: string
	userId: string | null
	clientId?: string
	games?: readonly JackboxGame[]
	fetchImpl?: typeof fetch
	maxPages?: number
}): Promise<FollowedStreamsResult> {
	if (options.userId === null || options.userId === '') {
		return { ok: false, status: 0, reason: 'missing-user', message: 'Twitch did not return a user id for this token.' }
	}
	const clientId = options.clientId ?? TWITCH_CLIENT_ID
	const games = options.games ?? JACKBOX_GAMES
	const fetchImpl = options.fetchImpl ?? fetch
	const maxPages = options.maxPages ?? MAX_HELIX_PAGES
	const gameIds = jackboxGameIds(games)
	const matches: TwitchStream[] = []
	const seen = new Set<string>()
	let cursor: string | null = null

	for (let page = 0; page < maxPages; page += 1) {
		const url = new URL('https://api.twitch.tv/helix/streams/followed')
		url.searchParams.set('user_id', options.userId)
		url.searchParams.set('first', '100')
		if (cursor !== null) url.searchParams.set('after', cursor)
		const result = await helixGet(url, options.token, clientId, (value) => parseHelixPage(value, parseStream), fetchImpl)
		if (!result.ok) return result
		for (const stream of result.data) {
			if (gameIds.has(stream.game_id)) matches.push(stream)
		}
		const next = advanceCursor(seen, result.cursor)
		if (next === null) break
		seen.add(next)
		cursor = next
	}

	const images = await profileImages(
		matches.map((stream) => stream.user_id),
		options.token,
		clientId,
		fetchImpl,
	)
	const streams = matches
		.map((stream) => ({
			userName: stream.user_name,
			userLogin: stream.user_login,
			gameName: gameNameForId(stream.game_id, games),
			viewerCount: stream.viewer_count,
			profileImageUrl: images.get(stream.user_id) ?? '',
			title: `${stream.user_name} playing ${gameNameForId(stream.game_id, games)} for ${formatViewerTitle(stream.viewer_count)}`,
		}))
		.sort((left, right) => right.viewerCount - left.viewerCount)

	return { ok: true, streams }
}

async function profileImages(
	userIds: readonly string[],
	token: string,
	clientId: string,
	fetchImpl: typeof fetch,
): Promise<Map<string, string>> {
	const images = new Map<string, string>()
	const unique = [...new Set(userIds)]
	for (let index = 0; index < unique.length; index += 100) {
		const chunk = unique.slice(index, index + 100)
		if (chunk.length === 0) continue
		const url = new URL('https://api.twitch.tv/helix/users')
		for (const id of chunk) url.searchParams.append('id', id)
		const result = await helixGet(url, token, clientId, (value) => parseHelixPage(value, parseUser), fetchImpl)
		if (!result.ok) return images
		for (const user of result.data) images.set(user.id, user.profile_image_url)
	}
	return images
}
