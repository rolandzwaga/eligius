import {LabelController} from '@controllers/label-controller.ts';
import {addGlobalsToOperation} from '@operation/add-globals-to-operation.ts';
import {
  clearGlobals,
  getGlobals,
  setGlobals,
} from '@operation/helper/globals.ts';
import {setGlobalData} from '@operation/set-global-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('globals', () => {
  test('should get the globals', () => {
    const cache = getGlobals();
    expect(cache).not.toBeUndefined();
  });
  test('should get the global by name', () => {
    let cache = getGlobals();
    const value = 'test';
    cache['test'] = value;
    cache = getGlobals('test');
    expect(cache).toBe(value);
  });
  test('should set the given globals', () => {
    setGlobals({foo: 'bar', bar: 'foo'});

    const cache = getGlobals();

    expect(cache['foo']).toBe('bar');
    expect(cache['bar']).toBe('foo');
  });

  test('given a stored non-empty jQuery selectedElement, when getGlobals is called with its name, then the same jQuery instance is returned without throwing', () => {
    const selectedElement = $(document.createElement('div'));
    setGlobals({selectedElement});

    expect(getGlobals('selectedElement')).toBe(selectedElement);
  });

  test('given a stored function, when getGlobals is called with its name, then the same function is returned', () => {
    const fn = () => 1;
    setGlobals({fn});

    expect(getGlobals('fn')).toBe(fn);
  });

  test('given stored plain data, when getGlobals is called with its name, then a copy is returned', () => {
    const data = {a: {b: 1}};
    setGlobals({data});

    const result = getGlobals('data');

    expect(result).toEqual(data);
    expect(result).not.toBe(data);
  });

  test('given stored globals, when clearGlobals is called, then the store is empty', () => {
    setGlobals({toClear: 1});

    clearGlobals();

    expect(getGlobals()).toEqual({});
  });
});

describe('globals store hardening', () => {
  test('given a controller instance with registered listener removers stored via setGlobalData, when addGlobalsToOperation reads it with globalProperties [controllerInstance], then the same controller instance is returned without throwing DataCloneError', () => {
    // given
    const controllerInstance = new LabelController();
    (controllerInstance as any).eventListeners = [() => {}];
    applyOperation(setGlobalData, {
      propertyNames: ['controllerInstance'],
      controllerInstance,
    } as any);

    // test
    const result: any = applyOperation(addGlobalsToOperation, {
      globalProperties: ['controllerInstance'],
    });

    // expect
    expect(result.controllerInstance).toBe(controllerInstance);
    clearGlobals();
  });

  test('given stored plain data, when the operation data it came from is changed in place, then the stored value is unchanged', () => {
    // given
    const settings = {theme: 'light'};
    setGlobals({settings});

    // test
    settings.theme = 'dark';

    // expect
    expect(getGlobals('settings').theme).toBe('light');
    clearGlobals();
  });

  test('given the name constructor, when getGlobals is called with it, then undefined is returned instead of an inherited member', () => {
    expect(getGlobals('constructor')).toBeUndefined();
    expect(getGlobals('toString')).toBeUndefined();
  });

  test('given a JSON-parsed object with a __proto__ key, when it is passed to setGlobals, then it throws and the store keeps its prototype', () => {
    // given
    const values = JSON.parse('{"__proto__": {"polluted": "yes"}}');

    // test & expect
    expect(() => setGlobals(values)).toThrow(
      "setGlobals: global name '__proto__' is not allowed"
    );
    expect(getGlobals().polluted).toBeUndefined();
  });

  test('given a forbidden name, when addGlobalsToOperation reads it, then it throws naming the operation', () => {
    expect(() =>
      applyOperation(addGlobalsToOperation, {
        globalProperties: ['constructor'],
      })
    ).toThrow(
      "addGlobalsToOperation: global name 'constructor' is not allowed"
    );
  });
});
