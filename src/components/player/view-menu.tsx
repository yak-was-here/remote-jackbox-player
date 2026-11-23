import { ArrowLeftRight, ArrowUpDown, CircleHelp, Columns2, Menu, MoveHorizontal, X, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ViewId } from '@/lib/storage'
import { cn } from '@/lib/utils'

import { Hint } from './hint'
import type { PlayerController } from './use-player'

const items: Array<{ id: string; label: string; view: ViewId | 'howto'; icon: LucideIcon }> = [
	{ id: 'howToButton', label: 'How-To', view: 'howto', icon: CircleHelp },
	{ id: 'setupSwapViewButton', label: 'Swap View', view: 'swap', icon: ArrowLeftRight },
	{ id: 'setupSplitViewButton', label: 'Split View', view: 'split', icon: Columns2 },
	{ id: 'setupScrollViewButton', label: 'Scroll View', view: 'scroll', icon: ArrowUpDown },
	{ id: 'setupSwipeViewButton', label: 'Swipe View', view: 'swipe', icon: MoveHorizontal },
]

export function ViewMenu({ player }: { player: PlayerController }) {
	return (
		<div
			id="menu"
			className="pointer-events-none absolute bottom-0 left-0 z-40 overflow-hidden text-2xl portrait:mb-36 landscape:mb-4"
			onMouseEnter={player.stopPeek}
		>
			<div id="menuItems" className={cn('flex flex-col overflow-hidden transition-all', player.menuOpen ? 'h-auto' : 'h-0')}>
				{items.map((item) => {
					const Icon = item.icon
					const pressed = item.view !== 'howto' && player.view === item.view
					return (
						<div key={item.id} className="menuItem flex flex-row">
							<Hint label={item.label} revealed={player.hintsOpen && player.menuOpen} side="right">
								<Button
									id={item.id}
									type="button"
									variant="control"
									size="control"
									aria-pressed={pressed}
									aria-label={item.label}
									className={cn(
										'player-control pointer-events-auto rounded-none',
										item.id === 'howToButton' && 'rounded-tr',
									)}
									onClick={() => {
										if (item.view === 'howto') player.onHowTo()
										else player.onSelectView(item.view)
									}}
								>
									<Icon />
								</Button>
							</Hint>
						</div>
					)
				})}
			</div>
			<Button
				id="menuButton"
				type="button"
				variant="control"
				size="control"
				title={player.menuOpen ? 'Close menu' : 'Open menu'}
				aria-label={player.menuOpen ? 'Close menu' : 'Open menu'}
				aria-pressed={player.menuOpen}
				className={cn(
					'player-control pointer-events-auto rounded-none',
					player.menuOpen ? 'rounded-br' : 'rounded-r',
				)}
				onClick={player.onMenu}
			>
				{player.menuOpen ? <X /> : <Menu />}
			</Button>
		</div>
	)
}
