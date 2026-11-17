import { Share2, Shuffle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatViewerCount } from '@/lib/twitch'

import type { PlayerController } from './use-player'
import { TwitchGlyph } from './twitch-glyph'

export function StreamBar({ player }: { player: PlayerController }) {
	return (
		<div
			id="streamURLBar"
			className={cn(
				'absolute top-0 left-0 z-50 flex max-h-full w-full flex-col overflow-hidden text-2xl transition-all duration-1000',
				player.uiOpen ? 'w-full' : 'w-0',
			)}
			style={{ opacity: player.barOpacity }}
			onMouseEnter={() => {
				player.stopPeek()
				player.setBarOpacity(1)
			}}
			onMouseLeave={() => {
				if (player.draft !== '') player.setBarOpacity(0.5)
			}}
		>
			<div id="streamURLBarControls" className="flex min-h-10 w-full items-stretch shadow-lg" role="navigation">
				<form id="streamURLForm" className="min-w-0 flex-1" autoComplete="off" onSubmit={player.onSubmit}>
					<Field className="gap-0">
						<FieldLabel htmlFor="streamURL" className="sr-only">
							Stream URL
						</FieldLabel>
						<InputGroup className="h-10 rounded-none border-0 bg-input shadow-none">
							<InputGroupInput
								ref={player.inputRef}
								id="streamURL"
								type="url"
								name="streamURL"
								placeholder="Tap to browse your streams"
								pattern="https://.*"
								title="Enter a stream URL"
								required
								value={player.draft}
								disabled={player.searching}
								className="h-10 rounded-none border-0 bg-transparent text-center text-base placeholder:font-semibold"
								onChange={(event) => player.onDraftChange(event.target.value)}
								onFocus={player.onDraftFocus}
								onBlur={player.onDraftBlur}
							/>
							<InputGroupAddon align="inline-end" className="gap-0 p-0">
								<InputGroupButton
									id="randomStreamButton"
									type="button"
									variant="control"
									size="icon-sm"
									className="player-control size-10 rounded-none"
									aria-label="Random stream"
									onClick={player.onRandom}
								>
									<Shuffle data-icon="inline-start" />
								</InputGroupButton>
								<InputGroupButton
									id="shareButton"
									type="button"
									variant="control"
									size="icon-sm"
									className="player-control size-10 rounded-none rounded-r"
									aria-label="Share"
									onClick={() => void player.onShare()}
								>
									<Share2 data-icon="inline-start" />
								</InputGroupButton>
							</InputGroupAddon>
						</InputGroup>
					</Field>
				</form>
				<div
					id="shareText"
					role="alert"
					className={cn(
						'flex h-10 items-center overflow-hidden bg-accent text-base text-accent-foreground transition-all duration-1000',
						player.shareNotice ? 'w-40 px-1' : 'w-0',
					)}
				>
					URL Copied
				</div>
			</div>
			<div
				className={cn('flex w-full justify-end gap-1 overflow-hidden transition-all', player.uiOpen ? 'h-20' : 'h-0')}
				role="navigation"
			>
				<span className={cn('help-label vertical-text mt-1 h-20 w-8 rounded-b rounded-tl py-1 text-xl shadow-lg', player.uiOpen ? 'opacity-100' : 'opacity-0')}>
					Random
				</span>
				<span className={cn('help-label vertical-text mt-1 h-16 w-8 rounded-b rounded-tl py-1 text-xl shadow-lg', player.uiOpen ? 'opacity-100' : 'opacity-0')}>
					Share
				</span>
				<span className={cn('overflow-hidden', player.shareNotice ? 'w-40' : 'w-0')} />
			</div>
			{player.statusMessage ? (
				<Alert>
					<AlertDescription>{player.statusMessage}</AlertDescription>
				</Alert>
			) : null}
			<div
				id="followedStreamsListWrapper"
				className={cn(
					'origin-top overflow-hidden bg-popover text-base text-popover-foreground shadow-md transition-transform',
					player.followedOpen ? 'scale-y-100' : 'scale-y-0',
				)}
				onMouseDown={(event) => event.preventDefault()}
			>
				<ScrollArea className="max-h-64">
					<div id="followedStreamsList">
						{player.followedNeedsAuth ? (
							<div className="p-2 text-center">
								Want to see which of your followed Twitch streams are playing Jackbox games?
								<br />
								<Button id="authorizeTwitchAccessButton" type="button" className="mt-1" onClick={player.onAuthorize}>
									Authorize <TwitchGlyph data-icon="inline-end" /> access
								</Button>
							</div>
						) : null}
						{!player.followedNeedsAuth && player.followedStreams.length === 0 && player.followedStatus === null && player.followedOpen ? (
							<div className="p-2 text-center">Sorry, none of your followed streams are playing a Jackbox game.</div>
						) : null}
						{player.followedStreams.map((stream) => (
							<button
								key={stream.userLogin}
								type="button"
								className="followedStream flex w-full cursor-pointer items-center gap-2 border-b border-border p-2 text-left hover:bg-accent"
								title={stream.title}
								data-stream-name={stream.userLogin}
								onClick={() => player.onPickStream(stream.userLogin)}
							>
								<span className="flex w-4/12 items-center gap-2 truncate text-left">
									<Avatar className="size-6">
										{stream.profileImageUrl ? <AvatarImage src={stream.profileImageUrl} alt="" /> : null}
										<AvatarFallback>{stream.userName.slice(0, 1)}</AvatarFallback>
									</Avatar>
									<span className="truncate font-bold">{stream.userName}</span>
								</span>
								<span className="min-w-0 flex-1 truncate text-left underline">{stream.gameName}</span>
								<span className="w-3/12 text-right">{formatViewerCount(stream.viewerCount)}</span>
							</button>
						))}
					</div>
				</ScrollArea>
				{player.followedStatus ? (
					<div id="followedStreamsListStatus" className="bg-accent p-2 text-center text-accent-foreground">
						{player.followedStatus}
					</div>
				) : (
					<div id="followedStreamsListStatus" className="hidden" />
				)}
			</div>
		</div>
	)
}
