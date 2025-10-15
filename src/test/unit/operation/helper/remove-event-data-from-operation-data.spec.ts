import {expect} from 'chai';
import {describe, test} from 'vitest';
import {removeEventDataFromOperationData} from '../../../../operation/helper/remove-event-data-from-operation-data.ts';

describe.concurrent('removeEventDataFromOperationData', () => {
  test('should remove the event data from the given operation data', () => {
    // given
    const operationData = {
      eventName: 'eventName',
      eventTopic: 'eventTopic',
      eventArgs: ['eventArgs'],
      test: 'test',
    };

    // test
    removeEventDataFromOperationData(operationData);

    // expect
    expect(Object.hasOwn(operationData, 'eventName')).to.be.false;
    expect(Object.hasOwn(operationData, 'eventTopic')).to.be.false;
    expect(Object.hasOwn(operationData, 'eventArgs')).to.be.false;
    expect(Object.hasOwn(operationData, 'test')).to.be.true;
  });
});
