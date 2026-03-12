import { deserialize } from './deserialize'
import { serialize } from './serialize'

/**
 * A pure implementation of the structured clone algorithm using serialize/deserialize.
 */
export function structuredClone(any: any, options?: any): any {
  return deserialize(serialize(any, options))
}

export { deserialize } from './deserialize'
export { parse, stringify } from './json'
export { serialize } from './serialize'
