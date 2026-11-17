import type { VercelConfig } from '@vercel/config/v1'

// Nitro's Vite plugin applies the Vercel preset when this project builds on
// Vercel. Pinning the framework here keeps detection on the TanStack Start
// preset without changing dashboard domains or project settings.
export const config: VercelConfig = {
	framework: 'tanstack-start',
	buildCommand: 'npm run build',
}
