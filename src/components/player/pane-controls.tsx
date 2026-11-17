import { ArrowLeftRight, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { layoutForView } from '@/lib/views'

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

	return (
		<div
			id={kind === 'stream' ? 'streamControls' : 'gameControls'}
			className="pane-controls controls absolute right-0 z-50 flex w-10 flex-col text-2xl"
			role="menubar"
			onMouseEnter={player.stopPeek}
		>
			<div className={cn('swapViewButtonWrapper flex flex-row justify-end', swapClass)}>
				<span className={cn('help-label mt-1 mr-1 h-8 overflow-hidden rounded-tr rounded-l px-1 text-xl shadow-lg', player.uiOpen ? 'opacity-100' : 'opacity-0')}>
					Swap Views
				</span>
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
			</div>
			<div className="flex flex-row justify-end">
				<span className={cn('help-label mt-1 mr-1 h-8 overflow-hidden rounded-tr rounded-l px-1 text-xl shadow-lg', player.uiOpen ? 'opacity-100' : 'opacity-0')}>
					{kind === 'stream' ? 'Reload Stream' : 'Reload Game'}
				</span>
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
			</div>
		</div>
	)
}
