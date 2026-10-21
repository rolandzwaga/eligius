import {syncInPlace} from '@configuration/api/sync-in-place.ts';
import {describe, expect, test} from 'vitest';

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
});
