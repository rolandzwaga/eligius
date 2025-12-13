import {OperationMetadataProvider} from '@configuration/api/name-providers.ts';
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
});
