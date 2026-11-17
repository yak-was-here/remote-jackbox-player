export interface TwitchEmbedPlayer {
	play(): void
}

export interface TwitchEmbedInstance {
	addEventListener(event: string, listener: () => void): void
	getPlayer(): TwitchEmbedPlayer
}

export interface TwitchEmbedOptions {
	allowfullscreen?: boolean
	width: string | number
	height: string | number
	channel: string
	theme?: 'dark' | 'light'
	layout?: 'video' | 'video-with-chat'
	autoplay?: boolean
}

export interface TwitchEmbedConstructor {
	new (elementId: string, options: TwitchEmbedOptions): TwitchEmbedInstance
	VIDEO_READY: string
}

declare global {
	interface Window {
		Twitch?: {
			Embed: TwitchEmbedConstructor
		}
	}
}

let embedPromise: Promise<void> | null = null

export function loadTwitchEmbed(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve()
	if (window.Twitch?.Embed) return Promise.resolve()
	if (embedPromise) return embedPromise
	embedPromise = new Promise((resolve, reject) => {
		const existing = document.getElementById('ttvEmbedScript')
		if (existing) {
			existing.addEventListener('load', () => resolve(), { once: true })
			existing.addEventListener('error', () => reject(new Error('Twitch embed failed to load')), { once: true })
			return
		}
		const script = document.createElement('script')
		script.id = 'ttvEmbedScript'
		script.src = 'https://embed.twitch.tv/embed/v1.js'
		script.async = true
		script.onload = () => resolve()
		script.onerror = () => {
			embedPromise = null
			reject(new Error('Twitch embed failed to load'))
		}
		document.body.appendChild(script)
	})
	return embedPromise
}
