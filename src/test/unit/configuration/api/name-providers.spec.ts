import { expect } from 'chai';
import { suite } from 'uvu';
import {
  OperationMetadataProvider,
  TimeLineEventNamesProvider,
} from '../../../../configuration/api/name-providers';

const NameProviders = suite('name-providers');

NameProviders('should return a list of event names', () => {
  // given
  const provider = new TimeLineEventNamesProvider();

  // test
  const eventNames = provider.getEventNames();

  // expect
  expect(eventNames).to.not.be.undefined;
  expect(eventNames.length > 0).to.be.true;
});

NameProviders('should return the metadata for the given operation name', () => {
  // given
  const provider = new OperationMetadataProvider();

  // test
  const metadata = provider.getOperationMetadata('addClass');

  // expect
  expect(metadata).to.not.be.undefined;
});

NameProviders.run();
