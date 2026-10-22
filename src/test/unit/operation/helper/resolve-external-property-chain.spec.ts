import {getGlobals} from '@operation/helper/globals.ts';
import {removeGlobal} from '@operation/helper/remove-global.ts';
import {
  type ExternalProperty,
  findDeclaringScope,
  findRootScope,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import type {IOperationScope} from '@operation/index.ts';
import {setData} from '@operation/set-data.ts';
import {setGlobalData} from '@operation/set-global-data.ts';
import {setOperationData} from '@operation/set-operation-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';

describe('resolveExternalPropertyChain', () => {
  beforeAll(() => {
    setGlobal('foo', 'bar');
  });
  afterAll(() => {
    removeGlobal('foo');
  });
  test('should resolve the operation data argument values', () => {
    // given
    const operationData = {
      extractedValue: 'test',
      operationDataArgument: '$operationdata.extractedValue',
    };
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe(operationData.extractedValue);
  });
  test('should resolve the global data argument values', () => {
    // given
    const operationData = {
      operationDataArgument: '$globaldata.foo',
    };
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe('bar');
  });
  test('should resolve a bracket array-index in an operationdata chain', () => {
    // given: the shape an `on event` handler sees — args land on eventArgs[]
    const operationData = {eventArgs: ['#first', '#second']};
    const operationScope = {} as IOperationScope;

    // test / expect — bracket notation resolves the array element
    expect(
      resolveExternalPropertyChain(
        operationData,
        operationScope,
        '$operationdata.eventArgs[0]' as ExternalProperty
      )
    ).toBe('#first');
    expect(
      resolveExternalPropertyChain(
        operationData,
        operationScope,
        '$operationdata.eventArgs[1]' as ExternalProperty
      )
    ).toBe('#second');
  });
  test('should resolve the scope argument values', () => {
    // given
    const operationData = {
      operationDataArgument: '$scope.currentIndex',
    };
    const operationScope = {currentIndex: 100} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe(100);
  });
  test('should resolve a $scope variable declared on a parent scope', () => {
    // given: a child scope (as forEach/when create) whose parent holds the variable
    const parent = {
      variables: {items: ['a', 'b', 'c']},
    } as unknown as IOperationScope;
    const child = {parent} as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.items' as ExternalProperty
    );

    // expect
    expect(value).toEqual(['a', 'b', 'c']);
  });
  test('should resolve through multiple parent scopes', () => {
    // given
    const grandparent = {
      variables: {greeting: 'hi'},
    } as unknown as IOperationScope;
    const parent = {parent: grandparent} as unknown as IOperationScope;
    const child = {parent} as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.greeting' as ExternalProperty
    );

    // expect
    expect(value).toBe('hi');
  });
  test('should let an inner scope shadow an outer scope variable', () => {
    // given: same variable name on both scopes — the nearest one wins
    const parent = {
      variables: {x: 'outer'},
    } as unknown as IOperationScope;
    const child = {
      variables: {x: 'inner'},
      parent,
    } as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.x' as ExternalProperty
    );

    // expect
    expect(value).toBe('inner');
  });
  test('should throw when a $scope variable exists on no scope in the chain', () => {
    // given
    const child = {
      parent: {} as IOperationScope,
    } as unknown as IOperationScope;

    // test / expect
    expect(() =>
      resolveExternalPropertyChain(
        {},
        child,
        '$scope.variables.missing' as ExternalProperty
      )
    ).toThrow(/cannot be resolved/);
  });
  test('should return null if argumentValue is null', () => {
    // given
    const operationData = {};
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      null
    );

    // expect
    expect(value).toBeNull();
  });
  test('should return argumentValue when argumentValue is complex value', () => {
    // given
    const operationData = {};
    const arg = {};
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      arg
    );

    // expect
    expect(value).toBe(arg);
  });

  test('given a $operationdata.__proto__ chain run by an operation, when it is resolved, then it throws naming the operation and the full chain', () => {
    const scope = {
      currentIndex: 0,
      operations: [{systemName: 'setOperationData'}],
    } as unknown as IOperationScope;

    expect(() =>
      resolveExternalPropertyChain(
        {},
        scope,
        '$operationdata.x.__proto__.polluted'
      )
    ).toThrow(
      "setOperationData: property chain '$operationdata.x.__proto__.polluted' contains forbidden segment '__proto__'"
    );
    expect(({} as any).polluted).toBeUndefined();
  });

  test('given a $globaldata.constructor chain, when it is resolved, then it throws', () => {
    expect(() =>
      resolveExternalPropertyChain(
        {},
        {} as IOperationScope,
        '$globaldata.constructor.prototype'
      )
    ).toThrow(/forbidden segment 'constructor'/);
  });

  test('given a $scope.constructor chain, when it is resolved, then it throws', () => {
    expect(() =>
      resolveExternalPropertyChain(
        {},
        {} as IOperationScope,
        '$scope.constructor.constructor'
      )
    ).toThrow(/forbidden segment 'constructor'/);
  });
});

describe('resolveExternalPropertyChain global data copies', () => {
  test('given setGlobalData stored settings {theme: light}, when setOperationData resolves cfg from $globaldata.settings and setData writes $operationdata.cfg.theme = dark, then getGlobals(settings).theme is still light', () => {
    // given
    applyOperation(setGlobalData, {
      propertyNames: ['settings'],
      settings: {theme: 'light'},
    } as any);

    // test
    const withCfg = applyOperation(setOperationData, {
      properties: {cfg: '$globaldata.settings'},
    });
    applyOperation(setData, {
      ...withCfg,
      properties: {'$operationdata.cfg.theme': 'dark'},
    } as any);

    // expect
    expect(getGlobals('settings').theme).toBe('light');
    removeGlobal('settings');
  });
});

describe('findDeclaringScope', () => {
  test('given a child scope without variables, when the variables head is looked up, then the parent that declares it is returned', () => {
    const root = {variables: {a: 1}} as unknown as IOperationScope;
    const child = {parent: root} as unknown as IOperationScope;

    expect(findDeclaringScope('variables', child)).toBe(root);
    expect(findDeclaringScope('missing', child)).toBeUndefined();
    expect(findRootScope(child)).toBe(root);
  });
});
