import type { SVGProps } from 'react'

export function TwitchGlyph(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
			<path fill="currentColor" d="M4 2 2 6v12h5v4l4-4h4l6-6V2H4zm15 9-3 3h-4l-2 2v-2H6V4h13v7z" />
			<path fill="currentColor" d="M16 6h2v5h-2zm-4 0h2v5h-2z" />
		</svg>
	)
}
