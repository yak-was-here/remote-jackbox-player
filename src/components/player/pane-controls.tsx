import { ArrowLeftRight, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { layoutForView } from '@/lib/views'

import { Hint } from './hint'
import type { PlayerController } from './use-player'

export function PaneControls({
	player,
	kind,
}: {
	player: PlayerController
	kind: 'stream' | 'game'
}) {
	const layout = layoutForView(player.view, player.streamInFront)
	const swapClass = layout.swapVisibility === 'never' ? 'hidden' : layout.swapVisibility === 'small' ? 'lg:hidden' : ''
	const reloadRound = layout.swapVisibility === 'always' ? 'rounded-bl' : 'rounded-l'
	const paneShown = kind === 'stream' || player.view !== 'default' || player.wide
	const swapShown = layout.swapVisibility === 'always' || (layout.swapVisibility === 'small' && !player.wide)
	const reveal = player.hintsOpen && paneShown

	return (
		<div
			id={kind === 'stream' ? 'streamControls' : 'gameControls'}
			className="pane-controls controls absolute right-0 z-50 flex w-10 flex-col text-2xl"
			role="menubar"
			onMouseEnter={player.stopPeek}
		>
			<div className={cn('swapViewButtonWrapper flex flex-row justify-end', swapClass)}>
				<Hint label="Swap Views" revealed={reveal && swapShown} side="left">
					<Button
						type="button"
						variant="control"
						size="control"
						className="swapViewButton player-control rounded-none rounded-tl"
						aria-label="Swap views"
						onClick={player.onSwapPanes}
					>
						<ArrowLeftRight />
					</Button>
				</Hint>
			</div>
			<div className="flex flex-row justify-end">
				<Hint label={kind === 'stream' ? 'Reload Stream' : 'Reload Game'} revealed={reveal} side="left">
					<Button
						id={kind === 'stream' ? 'reloadStreamButton' : 'reloadGameButton'}
						type="button"
						variant="control"
						size="control"
						className={cn('player-control rounded-none', reloadRound)}
						aria-label={kind === 'stream' ? 'Reload stream' : 'Reload game'}
						onClick={() => {
							if (kind === 'stream') player.onReloadStream()
							else player.setReloadOpen(true)
						}}
					>
						<RotateCw />
					</Button>
				</Hint>
			</div>
		</div>
	)
}
