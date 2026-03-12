import {
  ARRAY,
  BIGINT,
  DATE,
  ERROR,
  MAP,
  OBJECT,
  PRIMITIVE,
  REGEXP,
  SET,
  VOID,
} from './types'

type SerializedRecord = [type: number | string, value?: any]

const EMPTY = ''

const { toString } = {}
const { keys } = Object

function typeOf(value: any): [number, string] {
  const type = typeof value
  if (type !== 'object' || !value)
    return [PRIMITIVE, type]

  const asString = toString.call(value).slice(8, -1)
  switch (asString) {
    case 'Array':
      return [ARRAY, EMPTY]
    case 'Object':
      return [OBJECT, EMPTY]
    case 'Date':
      return [DATE, EMPTY]
    case 'RegExp':
      return [REGEXP, EMPTY]
    case 'Map':
      return [MAP, EMPTY]
    case 'Set':
      return [SET, EMPTY]
    case 'DataView':
      return [ARRAY, asString]
  }

  if (asString.includes('Array'))
    return [ARRAY, asString]

  if (asString.includes('Error'))
    return [ERROR, asString]

  return [OBJECT, asString]
}

function shouldSkip([TYPE, type]: [number, string]): boolean {
  return TYPE === PRIMITIVE
    && (type === 'function' || type === 'symbol')
}

function serializer(strict: boolean, json: boolean, $: Map<any, number>, _: SerializedRecord[]): (value: any) => number {
  const as = (out: SerializedRecord, value: any): number => {
    const index = _.push(out) - 1
    $.set(value, index)
    return index
  }

  const pair = (value: any): number => {
    if ($.has(value))
      return $.get(value)!

    let [TYPE, type] = typeOf(value)
    switch (TYPE) {
      case PRIMITIVE: {
        let entry = value
        switch (type) {
          case 'bigint':
            TYPE = BIGINT
            entry = value.toString()
            break
          case 'function':
          case 'symbol':
            if (strict)
              throw new TypeError(`unable to serialize ${type}`)
            entry = null
            break
          case 'undefined':
            return as([VOID], value)
        }
        return as([TYPE, entry], value)
      }
      case ARRAY: {
        if (type) {
          let spread = value
          if (type === 'DataView') {
            spread = new Uint8Array(value.buffer)
          }
          else if (type === 'ArrayBuffer') {
            spread = new Uint8Array(value)
          }
          return as([type, [...spread]], value)
        }

        const arr: number[] = []
        const index = as([TYPE, arr], value)
        for (const entry of value)
          arr.push(pair(entry))
        return index
      }
      case OBJECT: {
        if (type) {
          switch (type) {
            case 'BigInt':
              return as([type, value.toString()], value)
            case 'Boolean':
            case 'Number':
            case 'String':
              return as([type, value.valueOf()], value)
          }
        }

        if (json && ('toJSON' in value))
          return pair(value.toJSON())

        const entries: [number, number][] = []
        const index = as([TYPE, entries], value)
        for (const key of keys(value)) {
          if (strict || !shouldSkip(typeOf(value[key])))
            entries.push([pair(key), pair(value[key])])
        }
        return index
      }
      case DATE:
        return as([TYPE, value.toISOString()], value)
      case REGEXP: {
        const { source, flags } = value
        return as([TYPE, { source, flags }], value)
      }
      case MAP: {
        const entries: [number, number][] = []
        const index = as([TYPE, entries], value)
        for (const [key, entry] of value) {
          if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
            entries.push([pair(key), pair(entry)])
        }
        return index
      }
      case SET: {
        const entries: number[] = []
        const index = as([TYPE, entries], value)
        for (const entry of value) {
          if (strict || !shouldSkip(typeOf(entry)))
            entries.push(pair(entry))
        }
        return index
      }
    }

    const { message } = value
    return as([TYPE, { name: type, message }], value)
  }

  return pair
}

/**
 * Returns an array of serialized Records.
 */
export function serialize(value: any, options: { json?: boolean, lossy?: boolean } = {}): SerializedRecord[] {
  const _: SerializedRecord[] = []
  serializer(!(options.json || options.lossy), !!options.json, new Map(), _)(value)
  return _
}
