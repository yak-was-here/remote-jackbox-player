import { Ban, Bug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { PlayerController } from './use-player'
import { TwitchGlyph } from './twitch-glyph'

export function HowTo({ player }: { player: PlayerController }) {
	return (
		<div id="howTo" className="how-to-pane absolute inset-0 overflow-hidden text-lg">
			<ScrollArea className="size-full">
				<div className="mx-auto flex max-w-3xl flex-col gap-4 px-10 pt-14 pb-24">
					<h1 className="text-center text-3xl font-bold">
						🎮
						<br />
						Remote Jackbox Player
					</h1>
					<h2 className="text-center text-sm font-medium uppercase">
						Watch & play on <strong className="font-medium">one</strong> screen
					</h2>
					<p className="mt-4 text-center">
						Find and play Jackbox games remotely (even if you don't own any) all on a single screen! This website allows you to simultaneously watch a Jackbox stream and join the fun from one mobile device.
					</p>
					<ul className="mx-auto mt-4 flex max-w-fit flex-col gap-4 text-center">
						<li>
							👾
							<br />
							Play games even if you don't own any
						</li>
						<li>
							📱
							<br />
							Watch and play on your smartphone or tablet
						</li>
						<li>
							📺
							<br />
							Find game sessions on Twitch
						</li>
						<li>
							🤝🏼
							<br />
							Make new friends
						</li>
					</ul>
					<h2 className="mt-4 rounded bg-secondary p-1 text-center font-bold text-primary">How to play</h2>
					<p className="text-center">Hit random in the top right to find a game session (requires a Twitch account).</p>
					<p className="text-center font-bold">OR</p>
					<p className="text-center">Paste a stream URL in the field above (or select one from the drop-down that appears).</p>
					<p className="text-center font-bold">THEN</p>
					<p className="text-center">
						Find or ask for the 4-letter room code.
					</p>
					<p className="text-center">
						Enter the room code in the Jackbox{' '}
						<a href="#gameFrame" className="game-pane-btn" onClick={(event) => {
							event.preventDefault()
							player.onShowGame()
						}}>
							game pane
						</a>
						.
					</p>
					<p className="text-center">Game on!</p>
					<div className="mt-8 flex flex-col items-center gap-4">
						{player.revokePhase !== 'hidden' ? (
							<Button
								id="revokeTwitchBtn"
								type="button"
								variant="secondary"
								className="rounded-full"
								disabled={player.revokePhase === 'done'}
								onClick={() => void player.onRevoke()}
							>
								{player.revokePhase === 'done' ? (
									'Done'
								) : (
									<>
										<Ban data-icon="inline-start" /> Revoke <TwitchGlyph data-icon="inline-start" /> access
									</>
								)}
							</Button>
						) : null}
						<Button asChild variant="secondary" className="rounded-full">
							<a href="https://github.com/isaacyakl/remote-jackbox-player/issues/new/choose" target="_blank" rel="noopener noreferrer">
								Report a <Bug data-icon="inline-end" />
							</a>
						</Button>
						<p className="text-center">
							Created by{' '}
							<a href="https://isaacyakl.com" target="_blank" rel="noopener noreferrer">
								yak
							</a>
							<br />
							<a href="https://twitter.com/isaacyakl/" target="_blank" rel="noopener noreferrer">
								Twitter
							</a>{' '}
							<a href="https://github.com/isaacyakl/" target="_blank" rel="noopener noreferrer">
								GitHub
							</a>
						</p>
					</div>
				</div>
			</ScrollArea>
		</div>
	)
}
