import { describe, expect, it } from 'vitest'
import { deserialize, parse, serialize, stringify, structuredClone } from '../src'

describe('structured-clone', () => {
  const date = new Date()
  const { buffer } = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

  const obj = {
    arr: [] as any[],
    bigint: 1n,
    boolean: true,
    number: 123,
    string: '',
    undefined: void 0,
    null: null,
    buffer,
    dataview: new DataView(buffer),
    int: new Uint32Array([1, 2, 3]),
    map: new Map([['a', 123]]),
    set: new Set(['a', 'b']),
    // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
    Bool: new Boolean(false),
    // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
    Num: new Number(0),
    // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
    Str: new String(''),
    // eslint-disable-next-line prefer-regex-literals, regexp/no-useless-flag
    re: new RegExp('test', 'gim'),
    error: new Error('test'),
    // eslint-disable-next-line unicorn/new-for-builtins
    BI: Object(1n),
    date,
  }

  obj.arr.push(obj, obj, obj)

  describe('serialize / deserialize', () => {
    it('should serialize and produce correct output', () => {
      const serialized = serialize(obj)
      expect(JSON.stringify(serialized)).toBe(
        `[[2,[[1,2],[3,4],[5,6],[7,8],[9,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[24,25],[27,28],[29,30],[31,32],[33,34],[35,36],[37,38],[39,40]]],[0,"arr"],[1,[0,0,0]],[0,"bigint"],[8,"1"],[0,"boolean"],[0,true],[0,"number"],[0,123],[0,"string"],[0,""],[0,"undefined"],[-1],[0,"null"],[0,null],[0,"buffer"],["ArrayBuffer",[0,1,2,3,4,5,6,7]],[0,"dataview"],["DataView",[0,1,2,3,4,5,6,7]],[0,"int"],["Uint32Array",[1,2,3]],[0,"map"],[5,[[23,8]]],[0,"a"],[0,"set"],[6,[23,26]],[0,"b"],[0,"Bool"],["Boolean",false],[0,"Num"],["Number",0],[0,"Str"],["String",""],[0,"re"],[4,{"source":"test","flags":"gim"}],[0,"error"],[7,{"name":"Error","message":"test"}],[0,"BI"],["BigInt","1"],[0,"date"],[3,"${date.toISOString()}"]]`,
      )
    })

    it('should deserialize correctly', () => {
      const serialized = serialize(obj)
      const deserialized = deserialize(serialized)

      expect(deserialized.arr.length).toBe(3)
      expect(deserialized.arr[0]).toBe(deserialized)
      expect(deserialized.arr[1]).toBe(deserialized)
      expect(deserialized.arr[2]).toBe(deserialized)
      expect(deserialized.bigint).toBe(1n)
      expect(deserialized.boolean).toBe(true)
      expect(deserialized.number).toBe(123)
      expect(deserialized.string).toBe('')
      expect(deserialized.undefined).toBeUndefined()
      expect(deserialized.null).toBeNull()
      expect(deserialized.int).toBeInstanceOf(Uint32Array)
      expect(deserialized.int.length).toBe(3)
      expect(deserialized.int[0]).toBe(1)
      expect(deserialized.int[1]).toBe(2)
      expect(deserialized.int[2]).toBe(3)
      expect(deserialized.map.size).toBe(1)
      expect(deserialized.map.get('a')).toBe(123)
      expect(deserialized.set.size).toBe(2)
      expect([...deserialized.set].join(',')).toBe('a,b')
      expect(deserialized.Bool).toBeInstanceOf(Boolean)
      expect(deserialized.Bool.valueOf()).toBe(false)
      expect(deserialized.Num).toBeInstanceOf(Number)
      expect(deserialized.Num.valueOf()).toBe(0)
      expect(deserialized.Str).toBeInstanceOf(String)
      expect(deserialized.Str.valueOf()).toBe('')
      expect(deserialized.re).toBeInstanceOf(RegExp)
      expect(deserialized.re.source).toBe('test')
      expect(deserialized.re.flags).toBe('gim')
      expect(deserialized.error).toBeInstanceOf(Error)
      expect(deserialized.error.message).toBe('test')
      expect(deserialized.BI).toBeInstanceOf(BigInt)
      expect(deserialized.BI.valueOf()).toBe(1n)
      expect(deserialized.date).toBeInstanceOf(Date)
      expect(deserialized.date.toISOString()).toBe(date.toISOString())
    })

    it('should throw on functions in strict mode', () => {
      expect(() => serialize(() => {})).toThrow(TypeError)
    })
  })

  describe('structuredClone', () => {
    it('should clone objects', () => {
      const cloned = structuredClone(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.number).toBe(123)
      expect(cloned.bigint).toBe(1n)
    })
  })

  describe('lossy mode', () => {
    it('should handle functions, symbols, and toJSON with json option', () => {
      const lossy: any[] = structuredClone(
        [
          1,
          () => {},
          new Map([['key', Symbol('test')]]),
          new Set([Symbol('test')]),
          {
            test() {},
            sym: Symbol('test'),
          },
          {
            toJSON() {
              return 'OK'
            },
          },
        ],
        { json: true } as any,
      )

      expect(lossy[0]).toBe(1)
      expect(lossy[1]).toBeNull()
      expect(lossy[2].size).toBe(0)
      expect(lossy[3].size).toBe(0)
      expect(JSON.stringify(lossy[4])).toBe('{}')
      expect(lossy[5]).toBe('OK')
    })
  })

  describe('stringify / parse', () => {
    it('should handle undefined values', () => {
      const withUndefined = stringify({ foo: 'test', bar: undefined, foobar: null })
      expect(withUndefined).toBe('[[2,[[1,2],[3,4],[5,6]]],[0,"foo"],[0,"test"],[0,"bar"],[-1],[0,"foobar"],[0,null]]')
      expect(Object.keys(parse(withUndefined)).join(',')).toBe('foo,bar,foobar')
      expect(parse(withUndefined).bar).toBeUndefined()
    })

    it('should roundtrip lossy data', () => {
      const lossy = structuredClone(
        [
          1,
          () => {},
          new Map([['key', Symbol('test')]]),
          new Set([Symbol('test')]),
          {
            test() {},
            sym: Symbol('test'),
          },
          {
            toJSON() {
              return 'OK'
            },
          },
        ],
        { json: true } as any,
      )

      const lossy2 = parse(stringify(lossy))
      expect(lossy2[0]).toBe(1)
      expect(lossy2[1]).toBeNull()
      expect(lossy2[2].size).toBe(0)
      expect(lossy2[3].size).toBe(0)
      expect(JSON.stringify(lossy2[4])).toBe('{}')
      expect(lossy2[5]).toBe('OK')
    })
  })
})
