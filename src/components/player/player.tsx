import { useEffect } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DEFAULT_GAME_URL } from '@/lib/stream-url'
import { loadTwitchEmbed } from '@/lib/twitch-embed'
import { cn } from '@/lib/utils'
import { layoutForView } from '@/lib/views'

import { HowTo } from './how-to'
import { PaneControls } from './pane-controls'
import { StreamBar } from './stream-bar'
import type { PlayerController } from './use-player'
import { ViewMenu } from './view-menu'

export function Player({ player }: { player: PlayerController }) {
	const layout = layoutForView(player.view, player.streamInFront)
	const channel = player.resolution.kind === 'twitch' ? player.resolution.channel : ''

	useEffect(() => {
		if (channel === '') return
		let cancelled = false
		void loadTwitchEmbed()
			.then(() => {
				if (cancelled || !window.Twitch) return
				const host = document.getElementById('twitchStream')
				if (!host) return
				host.replaceChildren()
				try {
					const embed = new window.Twitch.Embed('twitchStream', {
						allowfullscreen: false,
						width: '100%',
						height: '100%',
						channel,
						theme: 'dark',
						layout: 'video-with-chat',
						autoplay: true,
					})
					embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
						embed.getPlayer().play()
					})
				} catch (error) {
					console.error('Twitch embed setup error', error)
				}
			})
			.catch((error: unknown) => {
				console.error('Twitch embed setup error', error)
			})
		return () => {
			cancelled = true
		}
	}, [channel, player.embedNonce])

	const showHowTo = player.resolution.kind === 'howto' || player.resolution.kind === 'empty' || player.resolution.kind === 'protocol'
	const showUnknown = player.resolution.kind === 'unknown'
	const showTwitch = player.resolution.kind === 'twitch'

	return (
		<main
			id="player"
			data-view={player.view}
			className={cn(layout.playerClass, player.height === null && 'h-dvh')}
			style={player.height === null ? undefined : { height: player.height }}
		>
			<section id="streamPane" className={cn('min-h-0', layout.streamClass)}>
				{showHowTo ? <HowTo player={player} /> : null}
				{showUnknown && player.resolution.kind === 'unknown' ? (
					<iframe id="unknownStream" title="Stream" className="absolute inset-0 size-full" src={player.resolution.value} />
				) : null}
				{showTwitch ? <div id="twitchStream" className="absolute inset-0 size-full" /> : <div id="twitchStream" className="hidden" />}
				<StreamBar player={player} />
				<ViewMenu player={player} />
				<PaneControls player={player} kind="stream" />
			</section>
			<section id="gamePane" className={cn('min-h-0', layout.gameClass)}>
				<iframe id="gameFrame" title="Jackbox" className="z-10 size-full" src={DEFAULT_GAME_URL} key={player.gameNonce} />
				<PaneControls player={player} kind="game" />
			</section>
			<AlertDialog open={player.reloadOpen} onOpenChange={player.setReloadOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reload the game?</AlertDialogTitle>
						<AlertDialogDescription>You may lose your spot in the lobby.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={player.onConfirmReloadGame}>Reload</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	)
}
