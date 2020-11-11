import { expect } from 'chai';
import LabelController from '../../controllers/LabelController';
import TimelineEventNames from '../../timeline-event-names';

class MockEventbus {
  broadcast(eventName, args) {
    this.eventname = eventName;
    this.args = args;
    let result = null;
    let callBack = args[args.length - 1];
    switch (true) {
      case eventName === TimelineEventNames.REQUEST_CURRENT_LANGUAGE:
        result = 'en-GB';
        break;
      case eventName === TimelineEventNames.REQUEST_LABEL_COLLECTION:
        result = [
          {
            code: 'en-GB',
            label: 'test',
          },
          {
            code: 'nl-NL',
            label: 'tezt',
          },
        ];
        break;
    }
    callBack(result);
  }

  on(eventName, callBack) {
    this.eventName = eventName;
    this.languageChangeCallBack = callBack;
  }
}

class MockElement {
  html(content) {
    this.content = content;
  }
}

describe('LabelController', () => {
  let controller = null;
  let eventbus = null;
  let selectedElement = null;
  let operationData = null;

  beforeEach(() => {
    controller = new LabelController();
    eventbus = new MockEventbus();
    selectedElement = new MockElement();
    operationData = {
      selectedElement: selectedElement,
    };
  });

  it('should create the LabelController', () => {
    expect(controller.name).to.equal('LabelController');
    expect(controller.listeners).to.not.be.null;
    expect(controller.listeners.length).to.equal(0);
    expect(controller.currentLanguage).to.be.null;
    expect(controller.operationData).to.be.null;
    expect(controller.labelData).to.not.be.null;
  });

  it('should clone the operationData in init method', () => {
    // test
    controller.init(operationData);
    // expect
    expect(operationData).to.not.equal(controller.operationData);
  });

  it('should attach properly', () => {
    // given
    controller.init(operationData);

    // test
    controller.attach(eventbus);

    // expect
    expect(operationData.selectedElement.content).to.equal('test');
  });
});
