import { useState, type ReactElement } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Hint({
	label,
	revealed,
	side = 'right',
	children,
}: {
	label: string
	revealed: boolean
	side?: 'top' | 'right' | 'bottom' | 'left'
	children: ReactElement
}) {
	const [engaged, setEngaged] = useState(false)

	return (
		<Tooltip
			open={revealed || engaged}
			onOpenChange={(next) => {
				if (revealed && !next) return
				setEngaged(next)
			}}
		>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side}>{label}</TooltipContent>
		</Tooltip>
	)
}
