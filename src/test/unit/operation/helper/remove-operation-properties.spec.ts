import {removeProperties} from '@operation/helper/remove-operation-properties.js';
import {describe, expect, it} from 'vitest';

describe('removeProperties', () => {
  it('should remove 1 property successfully', () => {
    const operationData = {
      prop1: 'value1',
      prop2: 'value2',
      prop3: 'value3',
    };

    const result = removeProperties(operationData, 'prop1');

    expect(result).toBe(operationData); // Same reference
    expect(result).toEqual({prop2: 'value2', prop3: 'value3'});
    expect('prop1' in result).toBe(false);
  });

  it('should remove 2 properties successfully', () => {
    const operationData = {
      animationEasing: 'ease-in',
      animationDuration: 500,
      selectedElement: {} as any,
    };

    const result = removeProperties(
      operationData,
      'animationEasing',
      'animationDuration'
    );

    expect(result).toBe(operationData); // Same reference
    expect(result).toEqual({selectedElement: {}});
    expect('animationEasing' in result).toBe(false);
    expect('animationDuration' in result).toBe(false);
  });

  it('should remove 5 properties successfully', () => {
    const operationData = {
      prop1: 'value1',
      prop2: 'value2',
      prop3: 'value3',
      prop4: 'value4',
      prop5: 'value5',
      remaining: 'keep-me',
    };

    const result = removeProperties(
      operationData,
      'prop1',
      'prop2',
      'prop3',
      'prop4',
      'prop5'
    );

    expect(result).toBe(operationData); // Same reference
    expect(result).toEqual({remaining: 'keep-me'});
    expect(Object.keys(result)).toEqual(['remaining']);
  });

  it('should verify TypeScript return type correctness (Omit<T, K>)', () => {
    interface TestData {
      toRemove1: string;
      toRemove2: number;
      keep1: boolean;
      keep2: string[];
    }

    const operationData: TestData = {
      toRemove1: 'delete-me',
      toRemove2: 42,
      keep1: true,
      keep2: ['a', 'b'],
    };

    // TypeScript should infer the return type as Omit<TestData, 'toRemove1' | 'toRemove2'>
    const result = removeProperties(operationData, 'toRemove1', 'toRemove2');

    // Runtime verification
    expect(result).toEqual({keep1: true, keep2: ['a', 'b']});

    // Type assertion to verify TypeScript type system
    // If TypeScript types are correct, this should compile without errors
    const typed: Omit<TestData, 'toRemove1' | 'toRemove2'> = result;
    expect(typed.keep1).toBe(true);
    expect(typed.keep2).toEqual(['a', 'b']);
  });

  it('should verify original object is mutated (not copied)', () => {
    const operationData = {
      remove: 'delete-me',
      keep: 'keep-me',
    };

    const originalReference = operationData;
    const result = removeProperties(operationData, 'remove');

    // Verify same reference (mutated in place)
    expect(result).toBe(originalReference);
    expect(result).toBe(operationData);

    // Verify mutation
    expect('remove' in originalReference).toBe(false);
    expect(originalReference.keep).toBe('keep-me');
  });

  it('should test with various property types (string, number, object, array)', () => {
    const operationData = {
      stringProp: 'hello',
      numberProp: 123,
      objectProp: {nested: 'value'},
      arrayProp: [1, 2, 3],
      booleanProp: true,
      nullProp: null,
      undefinedProp: undefined,
      remaining: 'keep',
    };

    const result = removeProperties(
      operationData,
      'stringProp',
      'numberProp',
      'objectProp',
      'arrayProp',
      'booleanProp',
      'nullProp',
      'undefinedProp'
    );

    expect(result).toBe(operationData);
    expect(result).toEqual({remaining: 'keep'});
    expect(Object.keys(result)).toEqual(['remaining']);

    // Verify all properties removed
    expect('stringProp' in result).toBe(false);
    expect('numberProp' in result).toBe(false);
    expect('objectProp' in result).toBe(false);
    expect('arrayProp' in result).toBe(false);
    expect('booleanProp' in result).toBe(false);
    expect('nullProp' in result).toBe(false);
    expect('undefinedProp' in result).toBe(false);
  });
});
