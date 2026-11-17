import type { KeyValueStore } from './storage'

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { snapshot(): Record<string, string> } {
	const values = { ...initial }
	return {
		getItem(key) {
			return Object.prototype.hasOwnProperty.call(values, key) ? (values[key] ?? null) : null
		},
		setItem(key, value) {
			values[key] = value
		},
		removeItem(key) {
			delete values[key]
		},
		snapshot() {
			return { ...values }
		},
	}
}
