import { describe, expect, it } from 'vitest'

import { SESSION_KEYS } from './storage'
import {
	JACKBOX_GAMES,
	advanceCursor,
	buildAuthorizeUrl,
	consumeOauthHashScript,
	createOauthState,
	findSmallJackboxStream,
	formatViewerCount,
	hasFollowScope,
	isLowViewerStream,
	listFollowedJackboxStreams,
	oauthStateMatches,
	parseOauthCallback,
	parseStream,
	parseValidation,
	pickRandomItem,
	redirectUriForLocation,
	revokeToken,
	validateToken,
	type TwitchStream,
} from './twitch'

const stream = (overrides: Partial<TwitchStream> = {}): TwitchStream => ({
	id: '1',
	user_id: '10',
	user_login: 'coolname',
	user_name: 'CoolName',
	game_id: '493174',
	game_name: 'Jackbox Party Packs',
	type: 'live',
	title: 'Party',
	viewer_count: 3,
	started_at: '2026-01-01T00:00:00Z',
	language: 'en',
	thumbnail_url: 'https://example.com/thumb.jpg',
	tags: ['Party'],
	is_mature: false,
	...overrides,
})

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	})
}

describe('oauth', () => {
	it('parses an implicit grant and an access denial', () => {
		const grant = parseOauthCallback('#access_token=abc&scope=user%3Aread%3Afollows&state=xyz&token_type=bearer&expires_in=3600')
		expect(grant).toEqual({
			type: 'token',
			grant: {
				accessToken: 'abc',
				tokenType: 'bearer',
				scope: ['user:read:follows'],
				state: 'xyz',
				expiresIn: 3600,
			},
		})
		const denied = parseOauthCallback('#error=access_denied&error_description=The+user+denied+you+access&state=xyz')
		expect(denied?.type).toBe('error')
		if (denied?.type === 'error') expect(denied.error.errorDescription).toBe('The user denied you access')
	})

	it('rejects a callback whose state does not match', () => {
		expect(oauthStateMatches('expected', 'expected')).toBe(true)
		expect(oauthStateMatches('expected', 'other')).toBe(false)
		expect(oauthStateMatches(null, 'expected')).toBe(false)
	})

	it('builds an implicit authorize url with a scope and no client secret', () => {
		const url = new URL(
			buildAuthorizeUrl({
				clientId: 'public-id',
				redirectUri: 'http://localhost:3000/',
				state: 'state-1',
				forceVerify: true,
			}),
		)
		expect(url.origin + url.pathname).toBe('https://id.twitch.tv/oauth2/authorize')
		expect(url.searchParams.get('response_type')).toBe('token')
		expect(url.searchParams.get('client_secret')).toBeNull()
		expect(url.searchParams.get('scope')).toBe('user:read:follows')
		expect(url.searchParams.get('force_verify')).toBe('true')
		expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/')
	})

	it('builds the redirect uri from the current origin and path', () => {
		expect(redirectUriForLocation({ origin: 'http://localhost:3000', pathname: '/' })).toBe('http://localhost:3000/')
		expect(redirectUriForLocation({ origin: 'http://127.0.0.1:3000', pathname: '' })).toBe('http://127.0.0.1:3000/')
		expect(
			redirectUriForLocation({
				origin: 'https://remote-jackbox-player-git-preview-team-yak-was-here.vercel.app',
				pathname: '/',
			}),
		).toBe('https://remote-jackbox-player-git-preview-team-yak-was-here.vercel.app/')
		expect(
			redirectUriForLocation({
				origin: 'https://remote-jackbox-player.vercel.app',
				pathname: '/player',
			}),
		).toBe('https://remote-jackbox-player.vercel.app/player')
		const preview = redirectUriForLocation({
			origin: 'https://remote-jackbox-player-k5qexjpdr-team-yak-was-here.vercel.app',
			pathname: '/',
		})
		expect(preview).toBe('https://remote-jackbox-player-k5qexjpdr-team-yak-was-here.vercel.app/')
		expect(preview).not.toContain('isaacyakl.com')
		expect(preview).not.toContain('?')
		expect(preview).not.toContain('#')
	})

	it('strips the token hash into session storage before analytics can read it', () => {
		expect(consumeOauthHashScript).toContain(SESSION_KEYS.oauthCallback)
		expect(consumeOauthHashScript).toContain('history.replaceState')
		expect(consumeOauthHashScript).not.toContain('console.log')
	})

	it('creates an opaque state', () => {
		const state = createOauthState(() => new Uint8Array([1, 2, 15]))
		expect(state).toBe('01020f')
	})
})

describe('helix parsing', () => {
	it('parses a validation payload', () => {
		expect(
			parseValidation({
				client_id: 'public-id',
				login: 'yak',
				scopes: ['user:read:follows'],
				user_id: '42',
				expires_in: 99,
			}),
		).toMatchObject({ user_id: '42', expires_in: 99 })
		expect(parseValidation({ client_id: 'x' })).toBeNull()
		expect(hasFollowScope(['user:read:follows'])).toBe(true)
		expect(hasFollowScope([])).toBe(false)
	})

	it('drops malformed streams instead of trusting them', () => {
		expect(parseStream(stream())?.user_login).toBe('coolname')
		expect(parseStream({ id: '1' })).toBeNull()
		expect(isLowViewerStream(stream({ viewer_count: 7 }))).toBe(true)
		expect(isLowViewerStream(stream({ viewer_count: 8 }))).toBe(false)
	})

	it('stops pagination when the cursor repeats', () => {
		const seen = new Set<string>(['cursor-a'])
		expect(advanceCursor(seen, 'cursor-a')).toBeNull()
		expect(advanceCursor(seen, 'cursor-b')).toBe('cursor-b')
		expect(advanceCursor(seen, null)).toBeNull()
		expect(pickRandomItem([stream()], () => 0)?.user_login).toBe('coolname')
		expect(pickRandomItem([], () => 0)).toBeNull()
	})

	it('formats viewer counts the way the list and title did', () => {
		expect(formatViewerCount(0)).toBe('No viewers')
		expect(formatViewerCount(1)).toBe('1 viewer')
		expect(formatViewerCount(1200)).toBe('1,200 viewers')
	})
})

describe('twitch requests', () => {
	it('validates a token and treats 401 as signed out', async () => {
		const ok = await validateToken('token', async () =>
			jsonResponse({
				client_id: 'public-id',
				login: 'yak',
				scopes: ['user:read:follows'],
				user_id: '42',
				expires_in: 10,
			}),
		)
		expect(ok.ok).toBe(true)
		const denied = await validateToken('token', async () => jsonResponse({ status: 401, message: 'invalid access token' }, 401))
		expect(denied).toEqual({ ok: false, status: 401 })
	})

	it('reports revoke failure without throwing', async () => {
		expect(await revokeToken('public-id', 'token', async () => new Response(null, { status: 200 }))).toBe(true)
		expect(await revokeToken('public-id', 'token', async () => Promise.reject(new Error('cors')))).toBe(false)
	})

	it('stops a random search on 401 instead of looping', async () => {
		let calls = 0
		const result = await findSmallJackboxStream({
			token: 'token',
			games: [JACKBOX_GAMES[0]],
			fetchImpl: async () => {
				calls += 1
				return jsonResponse({ message: 'invalid' }, 401)
			},
		})
		expect(result).toMatchObject({ ok: false, reason: 'unauthorized' })
		expect(calls).toBe(1)
	})

	it('stops a random search on 429', async () => {
		let calls = 0
		const result = await findSmallJackboxStream({
			token: 'token',
			games: JACKBOX_GAMES,
			fetchImpl: async () => {
				calls += 1
				return jsonResponse({ message: 'slow down' }, 429)
			},
		})
		expect(result).toMatchObject({ ok: false, reason: 'rate-limited' })
		expect(calls).toBe(1)
	})

	it('picks a low-viewer stream and skips crowded ones', async () => {
		const result = await findSmallJackboxStream({
			token: 'token',
			games: [JACKBOX_GAMES[0]],
			random: () => 0,
			fetchImpl: async () =>
				jsonResponse({
					data: [stream({ viewer_count: 40, user_login: 'big' }), stream({ id: '2', viewer_count: 2, user_login: 'small', user_name: 'Small' })],
					pagination: {},
				}),
		})
		expect(result).toMatchObject({ ok: true, url: 'https://twitch.tv/small' })
	})

	it('says when no small stream is live', async () => {
		const result = await findSmallJackboxStream({
			token: 'token',
			games: [JACKBOX_GAMES[0]],
			fetchImpl: async () => jsonResponse({ data: [stream({ viewer_count: 80 })], pagination: {} }),
		})
		expect(result).toMatchObject({ ok: false, reason: 'empty' })
	})

	it('lists followed jackbox streams from the current followed-streams endpoint', async () => {
		const calls: string[] = []
		const result = await listFollowedJackboxStreams({
			token: 'token',
			userId: '42',
			fetchImpl: async (input) => {
				const url = String(input)
				calls.push(url)
				if (url.includes('/streams/followed')) {
					expect(url).not.toContain('/users/follows')
					return jsonResponse({
						data: [
							stream({ viewer_count: 4, user_id: '10', user_login: 'one' }),
							stream({ id: '9', game_id: '1', game_name: 'Other', user_id: '11', user_login: 'other' }),
							stream({ id: '3', viewer_count: 9, user_id: '12', user_login: 'two', game_id: '492935' }),
						],
						pagination: {},
					})
				}
				return jsonResponse({
					data: [
						{ id: '10', login: 'one', display_name: 'One', profile_image_url: 'https://example.com/one.png' },
						{ id: '12', login: 'two', display_name: 'Two', profile_image_url: 'https://example.com/two.png' },
					],
				})
			},
		})
		expect(calls[0]).toContain('https://api.twitch.tv/helix/streams/followed')
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.streams.map((item) => item.userLogin)).toEqual(['two', 'one'])
			expect(result.streams[0]?.profileImageUrl).toBe('https://example.com/two.png')
			expect(result.streams[1]?.gameName).toBe('Jackbox Party Packs')
		}
	})
})
