import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import {
	browserLocalStorage,
	browserSessionStorage,
	clearAfterAuthAction,
	clearToken,
	readAfterAuthAction,
	readToken,
	readView,
	SESSION_KEYS,
	STORAGE_KEYS,
	writeAfterAuthAction,
	writeToken,
	writeView,
	type ViewId,
} from '@/lib/storage'
import { documentTitleForStream, normalizeStreamInput, resolveStreamInput, shareUrl, streamCommitAction, type StreamResolution } from '@/lib/stream-url'
import {
	buildAuthorizeUrl,
	createOauthState,
	expiresAtFromSeconds,
	findSmallJackboxStream,
	hasFollowScope,
	listFollowedJackboxStreams,
	oauthStateMatches,
	parseOauthCallback,
	redirectUriForLocation,
	revokeToken,
	TWITCH_CLIENT_ID,
	USER_DENIED_ACCESS,
	validateToken,
	VALIDATION_INTERVAL_MS,
	type FollowedJackboxStream,
} from '@/lib/twitch'

export const PEEK_MS = 1250

export interface PlayerSearch {
	streamURL?: string
	error?: string
	error_description?: string
}

interface Session {
	token: string | null
	expiresAt: number | null
	scopes: string[]
	userId: string | null
}

const emptySession = (): Session => ({ token: null, expiresAt: null, scopes: [], userId: null })

function confirmUnload(event: BeforeUnloadEvent) {
	event.preventDefault()
	event.returnValue = ''
}

function isLocalHost(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1'
}

async function copyText(value: string): Promise<void> {
	if (navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(value)
			return
		} catch {
			// The textarea path below covers browsers that block the async clipboard API.
		}
	}
	const el = document.createElement('textarea')
	el.value = value
	el.setAttribute('readonly', '')
	el.style.position = 'absolute'
	el.style.left = '-9999px'
	document.body.appendChild(el)
	el.select()
	document.execCommand('copy')
	document.body.removeChild(el)
}

export function usePlayer(search: PlayerSearch) {
	const navigate = useNavigate()
	const initialUrl = search.streamURL ?? ''
	const [view, setViewState] = useState<ViewId>('default')
	const [streamInFront, setStreamInFront] = useState(true)
	const [draft, setDraft] = useState(initialUrl)
	const [activeUrl, setActiveUrl] = useState(initialUrl)
	const [forceHowTo, setForceHowTo] = useState(false)
	const [uiOpen, setUiOpen] = useState(true)
	const [menuOpen, setMenuOpen] = useState(true)
	const [shareNotice, setShareNotice] = useState(false)
	const [followedOpen, setFollowedOpen] = useState(false)
	const [searching, setSearching] = useState(false)
	const [statusMessage, setStatusMessage] = useState<string | null>(null)
	const [gameNonce, setGameNonce] = useState(0)
	const [embedNonce, setEmbedNonce] = useState(0)
	const [reloadOpen, setReloadOpen] = useState(false)
	const [authed, setAuthed] = useState(false)
	const [revokePhase, setRevokePhase] = useState<'hidden' | 'ready' | 'done'>('hidden')
	const [followedStatus, setFollowedStatus] = useState<string | null>(null)
	const [followedStreams, setFollowedStreams] = useState<FollowedJackboxStream[]>([])
	const [followedNeedsAuth, setFollowedNeedsAuth] = useState(false)
	const [barOpacity, setBarOpacity] = useState(1)
	const [height, setHeight] = useState<number | null>(null)

	const sessionRef = useRef<Session>(emptySession())
	const activeUrlRef = useRef(initialUrl)
	const draftRef = useRef(initialUrl)
	const followedCountRef = useRef(0)
	const peekTimer = useRef<number | undefined>(undefined)
	const shareTimer = useRef<number | undefined>(undefined)
	const followedTimer = useRef<number | undefined>(undefined)
	const inputRef = useRef<HTMLInputElement>(null)

	function rememberSession(next: Session) {
		sessionRef.current = next
		const store = browserLocalStorage()
		if (store && next.token) writeToken(store, next.token, next.expiresAt)
		setAuthed(next.token !== null)
		setRevokePhase(next.token ? 'ready' : 'hidden')
	}

	function forgetSession() {
		const store = browserLocalStorage()
		if (store) clearToken(store)
		sessionRef.current = emptySession()
		setAuthed(false)
	}

	async function refreshValidation(token: string) {
		const result = await validateToken(token)
		if (!result.ok) {
			if (result.status === 401) forgetSession()
			return
		}
		rememberSession({
			token,
			expiresAt: expiresAtFromSeconds(result.validation.expires_in),
			scopes: result.validation.scopes,
			userId: result.validation.user_id,
		})
	}

	function pushStream(url: string) {
		const searchUpdate: PlayerSearch = {}
		if (url.length > 8) searchUpdate.streamURL = url
		void navigate({ to: '/', search: searchUpdate })
	}

	function commitUrl(raw: string, reloadGame: boolean) {
		const normalized = normalizeStreamInput(raw)
		draftRef.current = normalized
		setDraft(normalized)
		const action = streamCommitAction(activeUrlRef.current, normalized)
		if (action === 'set') {
			activeUrlRef.current = normalized
			setActiveUrl(normalized)
			setForceHowTo(false)
			document.title = documentTitleForStream(normalized)
			if (reloadGame) setGameNonce((value) => value + 1)
			pushStream(normalized)
		} else if (action === 'clear') {
			const alreadyClear = activeUrlRef.current.length < 9
			activeUrlRef.current = ''
			setActiveUrl('')
			document.title = documentTitleForStream('')
			if (!alreadyClear) pushStream('')
		} else {
			setActiveUrl(normalized)
			activeUrlRef.current = normalized
		}
	}

	function stopPeek() {
		window.clearTimeout(peekTimer.current)
		peekTimer.current = undefined
	}

	function openUi() {
		setUiOpen(true)
		setMenuOpen(true)
	}

	function closeUi() {
		setUiOpen(false)
		setMenuOpen(false)
	}

	function peekUi() {
		openUi()
		stopPeek()
		peekTimer.current = window.setTimeout(() => closeUi(), PEEK_MS)
	}

	function startAuth(action: 'random' | 'stream', forceVerify = false) {
		const local = browserLocalStorage()
		const session = browserSessionStorage()
		if (!local || !session) return
		const state = createOauthState()
		session.setItem(SESSION_KEYS.oauthState, state)
		writeAfterAuthAction(local, action === 'random' ? 'random' : draftRef.current)
		window.removeEventListener('beforeunload', confirmUnload)
		window.location.assign(
			buildAuthorizeUrl({
				clientId: TWITCH_CLIENT_ID,
				redirectUri: redirectUriForLocation(window.location),
				state,
				forceVerify,
			}),
		)
	}

	async function loadFollowed(token: string, userId: string | null, scopes: string[]) {
		if (!hasFollowScope(scopes)) {
			setFollowedNeedsAuth(true)
			setFollowedStreams([])
			setFollowedStatus(null)
			return
		}
		setFollowedNeedsAuth(false)
		setFollowedStatus(followedCountRef.current === 0 ? 'Generating list...' : 'Updating list...')
		const result = await listFollowedJackboxStreams({ token, userId })
		setFollowedStatus(null)
		if (!result.ok) {
			if (result.reason === 'unauthorized') {
				const validation = await validateToken(token)
				if (!validation.ok) {
					forgetSession()
					setFollowedNeedsAuth(true)
					return
				}
				rememberSession({
					token,
					expiresAt: expiresAtFromSeconds(validation.validation.expires_in),
					scopes: validation.validation.scopes,
					userId: validation.validation.user_id,
				})
				setFollowedNeedsAuth(!hasFollowScope(validation.validation.scopes))
				return
			}
			setStatusMessage(result.message)
			return
		}
		followedCountRef.current = result.streams.length
		setFollowedStreams(result.streams)
	}

	async function findRandom() {
		const token = sessionRef.current.token
		if (!token) {
			startAuth('random')
			return
		}
		setSearching(true)
		setDraft('Searching...')
		setStatusMessage(null)
		const result = await findSmallJackboxStream({ token })
		setSearching(false)
		if (!result.ok) {
			setDraft(activeUrlRef.current)
			draftRef.current = activeUrlRef.current
			if (result.reason === 'unauthorized') {
				forgetSession()
				startAuth('random')
				return
			}
			setStatusMessage(result.message)
			return
		}
		commitUrl(result.url, true)
	}

	useEffect(() => {
		const next = search.streamURL ?? ''
		if (next === activeUrlRef.current) return
		activeUrlRef.current = next
		draftRef.current = next
		setActiveUrl(next)
		setDraft(next)
		setForceHowTo(false)
		document.title = documentTitleForStream(next.length > 8 ? next : '')
	}, [search.streamURL])

	useEffect(() => {
		const local = browserLocalStorage()
		const sessionStore = browserSessionStorage()
		if (!local || !sessionStore) return

		const savedView = readView(local)
		setViewState(savedView)
		if (local.getItem(STORAGE_KEYS.activeView) === null) writeView(local, 'default')

		const storedToken = readToken(local)
		if (storedToken) {
			sessionRef.current = { ...emptySession(), token: storedToken, expiresAt: null }
			setAuthed(true)
			setRevokePhase('ready')
		}

		const callbackRaw = sessionStore.getItem(SESSION_KEYS.oauthCallback)
		if (callbackRaw !== null) sessionStore.removeItem(SESSION_KEYS.oauthCallback)
		const callback = callbackRaw === null ? null : parseOauthCallback(callbackRaw)
		const expectedState = sessionStore.getItem(SESSION_KEYS.oauthState)
		if (callback) sessionStore.removeItem(SESSION_KEYS.oauthState)

		let tokenForValidation = storedToken
		if (callback?.type === 'token' && oauthStateMatches(expectedState, callback.grant.state)) {
			const expiresAt = callback.grant.expiresIn === null ? null : expiresAtFromSeconds(callback.grant.expiresIn)
			writeToken(local, callback.grant.accessToken, expiresAt)
			sessionRef.current = {
				token: callback.grant.accessToken,
				expiresAt,
				scopes: callback.grant.scope,
				userId: null,
			}
			tokenForValidation = callback.grant.accessToken
			setAuthed(true)
			setRevokePhase('ready')
		} else if (callback?.type === 'error' && oauthStateMatches(expectedState, callback.error.state)) {
			if (callback.error.errorDescription === USER_DENIED_ACCESS) {
				if (readAfterAuthAction(local) === 'random') clearAfterAuthAction(local)
			} else {
				clearToken(local)
				sessionRef.current = emptySession()
				setAuthed(false)
				startAuth('stream')
				return
			}
		}

		const action = readAfterAuthAction(local)
		if (action !== null) {
			clearAfterAuthAction(local)
			if (action === 'random') void findRandom()
			else commitUrl(action, false)
		}

		if (tokenForValidation) void refreshValidation(tokenForValidation)

		const hasStream = (search.streamURL ?? '') !== '' || (action !== null && action !== 'random')
		if (hasStream) peekUi()
		else if (window.innerWidth < 768) {
			openUi()
			window.setTimeout(() => setMenuOpen(false), PEEK_MS)
		} else openUi()

		if (!isLocalHost(window.location.hostname)) window.addEventListener('beforeunload', confirmUnload)

		const onResize = () => setHeight(window.innerHeight)
		onResize()
		window.addEventListener('resize', onResize)

		let lastValidation = Date.now()
		const interval = window.setInterval(() => {
			const token = sessionRef.current.token
			if (!token) return
			lastValidation = Date.now()
			void refreshValidation(token)
		}, VALIDATION_INTERVAL_MS)
		const onVisible = () => {
			if (document.visibilityState !== 'visible') return
			if (Date.now() - lastValidation < VALIDATION_INTERVAL_MS) return
			const token = sessionRef.current.token
			if (!token) return
			lastValidation = Date.now()
			void refreshValidation(token)
		}
		document.addEventListener('visibilitychange', onVisible)

		return () => {
			window.removeEventListener('beforeunload', confirmUnload)
			window.removeEventListener('resize', onResize)
			window.clearInterval(interval)
			document.removeEventListener('visibilitychange', onVisible)
			stopPeek()
		}
	}, [])

	const resolution: StreamResolution = forceHowTo ? { kind: 'howto', value: activeUrl } : resolveStreamInput(activeUrl)

	function chooseView(next: ViewId) {
		setViewState(next)
		const store = browserLocalStorage()
		if (store) writeView(store, next)
	}

	return {
		view,
		streamInFront,
		draft,
		searching,
		uiOpen,
		menuOpen,
		shareNotice,
		followedOpen,
		statusMessage,
		gameNonce,
		embedNonce,
		reloadOpen,
		authed,
		revokePhase,
		followedStatus,
		followedStreams,
		followedNeedsAuth,
		barOpacity,
		height,
		resolution,
		inputRef,
		setReloadOpen,
		setBarOpacity,
		stopPeek,
		onDraftChange(value: string) {
			commitUrl(value, true)
		},
		onDraftFocus() {
			stopPeek()
			setBarOpacity(1)
			setFollowedOpen(true)
			commitUrl(draftRef.current, true)
			const session = sessionRef.current
			if (!session.token) {
				setFollowedNeedsAuth(true)
				return
			}
			void loadFollowed(session.token, session.userId, session.scopes)
		},
		onDraftBlur() {
			commitUrl(draftRef.current, true)
			window.clearTimeout(followedTimer.current)
			followedTimer.current = window.setTimeout(() => setFollowedOpen(false), 3000)
		},
		onSubmit(event: { preventDefault(): void }) {
			event.preventDefault()
			commitUrl(draftRef.current, true)
			closeUi()
		},
		async onShare() {
			stopPeek()
			const current = activeUrlRef.current.length > 8 ? activeUrlRef.current : draftRef.current
			await copyText(shareUrl(window.location.origin, window.location.pathname, current))
			setShareNotice(true)
			window.clearTimeout(shareTimer.current)
			shareTimer.current = window.setTimeout(() => {
				setShareNotice(false)
				closeUi()
			}, 3000)
		},
		onRandom() {
			void findRandom()
		},
		onHowTo() {
			const current = resolveStreamInput(activeUrlRef.current)
			const showingHowTo = forceHowTo || current.kind === 'empty' || current.kind === 'howto' || current.kind === 'protocol'
			if (!showingHowTo) {
				setMenuOpen(false)
				setForceHowTo(true)
				return
			}
			setForceHowTo(false)
			commitUrl(draftRef.current, false)
		},
		onMenu() {
			if (!menuOpen) {
				openUi()
				if (!/Android|iPhone/i.test(navigator.userAgent)) {
					window.setTimeout(() => inputRef.current?.focus(), 1000)
				}
				return
			}
			closeUi()
			inputRef.current?.blur()
		},
		onSelectView(next: ViewId) {
			if (next === 'swap' && view === 'swap') {
				setStreamInFront((value) => !value)
				return
			}
			chooseView(next)
		},
		onSwapPanes() {
			if (view !== 'swap') chooseView('swap')
			setStreamInFront((value) => !value)
		},
		onShowGame() {
			if (view === 'swap') setStreamInFront(false)
		},
		onReloadStream() {
			setEmbedNonce((value) => value + 1)
			setForceHowTo(false)
		},
		onConfirmReloadGame() {
			setGameNonce((value) => value + 1)
			setReloadOpen(false)
		},
		onPickStream(login: string) {
			commitUrl(`https://twitch.tv/${login}`, true)
			setFollowedOpen(false)
		},
		onAuthorize() {
			startAuth('stream', authed && !hasFollowScope(sessionRef.current.scopes))
		},
		async onRevoke() {
			const token = sessionRef.current.token
			setRevokePhase('done')
			if (token) await revokeToken(TWITCH_CLIENT_ID, token)
			forgetSession()
			setFollowedNeedsAuth(true)
			setFollowedStreams([])
			window.setTimeout(() => setRevokePhase('hidden'), 3000)
		},
	}
}

export type PlayerController = ReturnType<typeof usePlayer>
