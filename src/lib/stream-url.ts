export const DOCUMENT_TITLE = 'Remote Jackbox Player'
export const DEFAULT_GAME_URL = 'https://jackbox.tv/'

export type StreamResolution =
	| { kind: 'empty' }
	| { kind: 'protocol'; value: string }
	| { kind: 'howto'; value: string }
	| { kind: 'twitch'; value: string; channel: string }
	| { kind: 'unknown'; value: string }

export type StreamCommit = 'set' | 'clear' | 'ignore'

export function normalizeStreamInput(raw: string): string {
	if (raw === '' || 'https://'.startsWith(raw)) return raw
	const stripped = raw.replace(/https?:\/\//g, '')
	return `https://${stripped}`
}

export function twitchChannelFromUrl(url: string): string {
	return url.split('/')[3] ?? ''
}

export function resolveStreamInput(raw: string): StreamResolution {
	if (raw === '') return { kind: 'empty' }
	if ('https://'.startsWith(raw)) return { kind: 'protocol', value: raw }
	const value = normalizeStreamInput(raw)
	if (value.includes('remote-jackbox-player')) return { kind: 'howto', value }
	if (value.includes('twitch.tv')) {
		const channel = twitchChannelFromUrl(value)
		if (channel === '') return { kind: 'unknown', value }
		return { kind: 'twitch', value, channel }
	}
	return { kind: 'unknown', value }
}

export function streamCommitAction(previous: string, next: string): StreamCommit {
	if (next !== previous && next.length > 8) return 'set'
	if (next.length < 9) return 'clear'
	return 'ignore'
}

export function documentTitleForStream(streamUrl: string): string {
	if (streamUrl === '') return DOCUMENT_TITLE
	return `${DOCUMENT_TITLE} - ${streamUrl}`
}

export function shareUrl(origin: string, pathname: string, streamUrl: string): string {
	const url = new URL(pathname, origin)
	url.hash = ''
	if (streamUrl.length > 8) url.searchParams.set('streamURL', streamUrl)
	return url.toString()
}
