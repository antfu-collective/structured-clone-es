import { deserialize } from './deserialize'
import { serialize } from './serialize'

const { parse: $parse, stringify: $stringify } = JSON
const options = { json: true, lossy: true }

/**
 * Revive a previously stringified structured clone.
 * @param str previously stringified data as string.
 */
export function parse(str: string): any {
  return deserialize($parse(str))
}

/**
 * Represent a structured clone value as string.
 * @param any some clone-able value to stringify.
 */
export function stringify(any: any): string {
  return $stringify(serialize(any, options))
}
