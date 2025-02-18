import { expect } from 'chai';
import { suite } from 'uvu';
import { removeEventDataFromOperationData } from '../../../../operation/helper/remove-event-data-from-operation-data.ts';

const RemoveEventDataFromOperationDataSuite = suite(
  'removeEventDataFromOperationData'
);

RemoveEventDataFromOperationDataSuite(
  'should remove the event data from the given operation data',
  () => {
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
    expect(operationData.hasOwnProperty('eventName')).to.be.false;
    expect(operationData.hasOwnProperty('eventTopic')).to.be.false;
    expect(operationData.hasOwnProperty('eventArgs')).to.be.false;
    expect(operationData.hasOwnProperty('test')).to.be.true;
  }
);

RemoveEventDataFromOperationDataSuite.run();
