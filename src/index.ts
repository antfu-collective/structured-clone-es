import { deserialize } from './deserialize'
import { serialize } from './serialize'

/**
 * A polyfill/wrapper for the structured clone algorithm.
 * Uses native `structuredClone` when available, falls back to serialize/deserialize.
 * When `json` or `lossy` options are provided, always uses the polyfill path.
 */
export const structuredClone: typeof globalThis.structuredClone
  = typeof globalThis.structuredClone === 'function'
    ? (any: any, options?: any) => (
        options && ('json' in options || 'lossy' in options)
          ? deserialize(serialize(any, options))
          : globalThis.structuredClone(any)
      )
    : (any: any, options?: any) => deserialize(serialize(any, options))

export { deserialize } from './deserialize'
export { parse, stringify } from './json'
export { serialize } from './serialize'
