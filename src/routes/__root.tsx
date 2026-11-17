import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import appCss from '../input.css?url'
import { consumeOauthHashScript } from '../lib/twitch'

const description =
	"Find and play Jackbox games remotely on a single screen/device (even if you don't own any)! This website allows you to simultaneously watch a Jackbox stream and join the fun from one mobile device."

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Remote Jackbox Player' },
			{ name: 'description', content: description },
			{ property: 'og:url', content: 'https://remote-jackbox-player.isaacyakl.com' },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:title', content: 'Remote Jackbox Player' },
			{ property: 'og:description', content: description },
			{
				property: 'og:image',
				content: 'https://remote-jackbox-player.isaacyakl.com/remote-jackbox-player-screencap.jpg',
			},
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ property: 'twitter:domain', content: 'remote-jackbox-player.isaacyakl.com' },
			{ property: 'twitter:url', content: 'https://remote-jackbox-player.isaacyakl.com' },
			{ name: 'twitter:title', content: 'Remote Jackbox Player' },
			{ name: 'twitter:description', content: description },
			{
				name: 'twitter:image',
				content: 'https://remote-jackbox-player.isaacyakl.com/remote-jackbox-player-screencap.jpg',
			},
		],
		links: [
			{
				rel: 'icon',
				href: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/google/241/video-game_1f3ae.png',
			},
			{ rel: 'stylesheet', href: appCss },
		],
		scripts: [
			{
				src: 'https://www.googletagmanager.com/gtag/js?id=G-DMM4HL3449',
				async: true,
			},
			{
				children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-DMM4HL3449');`,
			},
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<script dangerouslySetInnerHTML={{ __html: consumeOauthHashScript }} />
				<HeadContent />
			</head>
			<body>
				<noscript>
					<h1 className="pt-4 text-center text-3xl font-bold">Uhhhhh...</h1>
					<p className="m-4 text-center">
						...yeah you're gonna need JavaScript to enjoy this. Please{' '}
						<a href="https://www.whatismybrowser.com/guides/how-to-enable-javascript/" target="_blank" rel="noopener noreferrer">
							enable JavaScript
						</a>{' '}
						so you don't miss out!
					</p>
				</noscript>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
