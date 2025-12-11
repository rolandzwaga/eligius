import {
  OperationMetadataProvider,
  TimeLineEventNamesProvider,
} from '@configuration/api/name-providers.ts';
import {describe, expect, test} from 'vitest';

describe('name-providers', () => {
  test('should return a list of event names', () => {
    // given
    const provider = new TimeLineEventNamesProvider();

    // test
    const eventNames = provider.getEventNames();

    // expect
    expect(eventNames).not.toBeUndefined();
    expect(eventNames.length).toBeGreaterThan(0);
  });
  test('should return the metadata for the given operation name', () => {
    // given
    const provider = new OperationMetadataProvider();

    // test
    const metadata = provider.getOperationMetadata('addClass');

    // expect
    expect(metadata).not.toBeUndefined();
  });
});
