import { expect } from 'chai';
import { TimeLineEventNamesProvider } from '../../../src/configuration/api/name-providers';

describe('name-providers', () => {
  it('should return a list of event names', () => {
    // given
    const provider = new TimeLineEventNamesProvider();

    // test
    const eventNames = provider.getEventNames();

    console.dir(eventNames);

    // expect
    expect(eventNames).to.not.be.undefined;
    expect(eventNames.length > 0).to.be.true;
  });
});
