import {
  ControllerNamesProvider,
  OperationMetadataProvider,
  OperationNamesProvider,
} from '@configuration/api/name-providers.ts';
import {describe, expect, test} from 'vitest';

describe('name-providers', () => {
  test('should return the metadata for the given operation name', () => {
    // given
    const provider = new OperationMetadataProvider();

    // test
    const metadata = provider.getOperationMetadata('addClass');

    // expect
    expect(metadata).not.toBeUndefined();
  });

  test('given the operation names provider, when getOperationNames is called, then it returns an array of operation names', () => {
    // test
    const names: string[] = new OperationNamesProvider().getOperationNames();

    // expect
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain('selectElement');
  });

  test('given the controller names provider, when getControllerNames is called, then it returns an array of controller names', () => {
    // test
    const names: string[] = new ControllerNamesProvider().getControllerNames();

    // expect
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain('LabelController');
  });
});
