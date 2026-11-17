import type { ViewId } from './storage'

export type SwapVisibility = 'always' | 'small' | 'never'

export interface ViewLayout {
	playerClass: string
	streamClass: string
	gameClass: string
	swapVisibility: SwapVisibility
}

export function layoutForView(view: ViewId, streamInFront: boolean): ViewLayout {
	switch (view) {
		case 'split':
			return {
				playerClass: 'flex h-screen w-screen flex-row',
				streamClass: 'relative w-1/2',
				gameClass: 'relative w-1/2',
				swapVisibility: 'never',
			}
		case 'swap':
			return {
				playerClass: 'h-screen w-screen',
				streamClass: streamInFront ? 'absolute z-20 size-full' : 'absolute z-10 size-full',
				gameClass: streamInFront ? 'absolute z-10 size-full' : 'absolute z-20 size-full',
				swapVisibility: 'always',
			}
		case 'scroll':
			return {
				playerClass: 'overflow-y-auto',
				streamClass: 'relative h-full w-full',
				gameClass: 'relative h-full w-full',
				swapVisibility: 'never',
			}
		case 'swipe':
			return {
				playerClass: 'flex h-screen w-screen flex-nowrap overflow-x-auto',
				streamClass: 'relative h-full w-full shrink-0',
				gameClass: 'relative h-full w-full shrink-0',
				swapVisibility: 'never',
			}
		case 'default':
			return {
				playerClass: 'flex w-screen overflow-hidden lg:flex-row',
				streamClass: 'relative h-full w-full lg:w-1/2',
				gameClass: 'relative hidden h-full w-full lg:block lg:w-1/2',
				swapVisibility: 'small',
			}
	}
}

export function toggleStreamInFront(streamInFront: boolean): boolean {
	return !streamInFront
}
