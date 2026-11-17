import { createFileRoute } from '@tanstack/react-router'

import { Player } from '@/components/player/player'
import { usePlayer, type PlayerSearch } from '@/components/player/use-player'

export const Route = createFileRoute('/')({
	validateSearch: (search: Record<string, unknown>): PlayerSearch => {
		const result: PlayerSearch = {}
		if (typeof search.streamURL === 'string' && search.streamURL !== '') result.streamURL = search.streamURL
		if (typeof search.error === 'string' && search.error !== '') result.error = search.error
		if (typeof search.error_description === 'string' && search.error_description !== '') {
			result.error_description = search.error_description
		}
		return result
	},
	component: PlayerRoute,
})

function PlayerRoute() {
	const search = Route.useSearch()
	const player = usePlayer(search)
	return <Player player={player} />
}
