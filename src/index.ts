import _structuredClone from '@ungap/structured-clone'
import { parse as _parse, stringify as _stringify } from '@ungap/structured-clone/json'

/**
 * Represent a structured clone value as string.
 */
export const stringify: (obj: any) => string = _stringify

/**
 * Revive a previously stringified structured clone.
 */
export const parse: (str: string) => unknown = _parse

export const structuredClone = _structuredClone as typeof globalThis.structuredClone
