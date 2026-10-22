import {syncInPlace} from '@configuration/api/sync-in-place.ts';
import {afterEach, describe, expect, test} from 'vitest';

describe('syncInPlace', () => {
  test('given nested objects, when synced, then target equals source and keeps its nested object identities', () => {
    const settings = {animation: {positionSource: {systemName: 'Raf'}}};
    const target: Record<string, any> = {a: 1, removed: true, settings};
    const source = {
      a: 2,
      settings: {animation: {positionSource: {systemName: 'Scroll'}}},
    };

    syncInPlace(target, source);

    expect(target).toEqual(source);
    expect(target.settings).toBe(settings);
  });

  test('given arrays of entries with ids, when the source reorders, removes and adds entries, then matched entries keep their identity', () => {
    const a = {id: 'a', name: 'A'};
    const b = {id: 'b', name: 'B'};
    const c = {id: 'c', name: 'C'};
    const list = [a, b, c];
    const target = {list};

    syncInPlace(target, {
      list: [
        {id: 'c', name: 'C2'},
        {id: 'a', name: 'A'},
        {id: 'd', name: 'D'},
      ],
    });

    expect(target.list).toBe(list);
    expect(target.list.map(x => x.name)).toEqual(['C2', 'A', 'D']);
    expect(target.list[0]).toBe(c);
    expect(target.list[1]).toBe(a);
  });

  test('given an entry whose id changed at the same position, when synced, then it is replaced rather than merged', () => {
    const original = {id: 'a', extra: 1};
    const target = {list: [original]};

    syncInPlace(target, {list: [{id: 'z'}]} as any);

    expect(target.list[0]).not.toBe(original);
    expect(target.list[0]).toEqual({id: 'z'});
  });

  test('given a primitive replaced by an object, when synced, then the object is assigned', () => {
    const target: Record<string, unknown> = {value: 1};

    syncInPlace(target, {value: {nested: true}});

    expect(target.value).toEqual({nested: true});
  });

  describe('unsafe keys', () => {
    afterEach(() => {
      // Keep a failing test from leaking pollution into the next one
      delete (Object.prototype as any).polluted;
    });

    function expectPrototypesUntouched() {
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
      expect(({} as any).constructor).toBe(Object);
    }

    test('given a target without a __proto__ key and a source with an own __proto__ key from JSON.parse, when synced, then Object.prototype is not modified and the key is skipped', () => {
      // given
      const target: Record<string, unknown> = {selector: '#a'};
      const source = JSON.parse(
        '{"selector":"#b","__proto__":{"polluted":"yes"}}'
      );

      // test
      syncInPlace(target, source);

      // expect
      expectPrototypesUntouched();
      expect(target.selector).toBe('#b');
      expect(Object.hasOwn(target, '__proto__')).toBe(false);
    });

    test('given nested operationData, when the source has an own __proto__ key inside it, then Object.prototype is not modified and the operationData keeps its identity', () => {
      // given
      const operationData = {selector: '#a'};
      const target: Record<string, any> = {
        startOperations: [{id: 'op', systemName: 'x', operationData}],
      };
      const source = JSON.parse(
        '{"startOperations":[{"id":"op","systemName":"x","operationData":{"selector":"#b","__proto__":{"polluted":"yes"}}}]}'
      );

      // test
      syncInPlace(target, source);

      // expect
      expectPrototypesUntouched();
      expect(target.startOperations[0].operationData).toBe(operationData);
      expect(operationData).toEqual({selector: '#b'});
      expect(Object.hasOwn(operationData, '__proto__')).toBe(false);
    });

    test('given new entries that carry own __proto__ keys at several nesting levels, when synced, then those keys are removed from the inserted values', () => {
      // given
      const target: Record<string, any> = {list: []};
      const source = JSON.parse(
        '{"list":[{"id":"a","__proto__":{"polluted":"yes"},"deep":{"__proto__":{"polluted":"yes"},"items":[{"__proto__":{"polluted":"yes"}}]}}]}'
      );

      // test
      syncInPlace(target, source);
      // Copying the inserted values with Object.assign must not pollute either
      const merged = Object.assign({}, target.list[0], target.list[0].deep);

      // expect
      expectPrototypesUntouched();
      expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
      expect(Object.hasOwn(target.list[0], '__proto__')).toBe(false);
      expect(Object.hasOwn(target.list[0].deep, '__proto__')).toBe(false);
      expect(Object.hasOwn(target.list[0].deep.items[0], '__proto__')).toBe(
        false
      );
    });

    test('given a source with constructor and prototype keys, when synced, then they are skipped and Object.prototype.constructor is untouched', () => {
      // given
      const target: Record<string, any> = {nested: {a: 1}};
      const source = JSON.parse(
        '{"constructor":{"prototype":{"polluted":"yes"}},"nested":{"a":2,"constructor":{"polluted":"yes"},"prototype":{"polluted":"yes"}}}'
      );

      // test
      syncInPlace(target, source);

      // expect
      expectPrototypesUntouched();
      expect(Object.hasOwn(target, 'constructor')).toBe(false);
      expect(target.nested).toEqual({a: 2});
      expect(Object.hasOwn(target.nested, 'prototype')).toBe(false);
    });
  });
});
