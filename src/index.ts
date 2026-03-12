import { deserialize } from './deserialize'
import { serialize } from './serialize'

/**
 * A pure implementation of the structured clone algorithm using serialize/deserialize.
 */
export function structuredClone<T>(value: T, options?: { lossy?: boolean }): T {
  return deserialize(serialize(value, options))
}

export { deserialize } from './deserialize'
export { parse, stringify } from './json'
export { serialize } from './serialize'
