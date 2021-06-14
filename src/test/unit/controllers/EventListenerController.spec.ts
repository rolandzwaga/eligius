import { expect } from 'chai';
import { EventListenerController } from '../../../controllers/event-listener-controller';
import { IEventbus } from '../../../eventbus';

class MockAction {
  actionName: string;
  startOperationData: any;
  endOperationData: any;
  constructor(actionName: string) {
    this.actionName = actionName;
  }

  start(operationData: any) {
    this.startOperationData = operationData;
    return new Promise(resolve => resolve(operationData));
  }

  end(operationData: any) {
    this.endOperationData = operationData;
    return new Promise(resolve => resolve(operationData));
  }
}

class MockEventbus {
  eventname: string = '';
  args: any;
  broadcast(eventName: string, args: any[]) {
    this.eventname = eventName;
    this.args = args;
    const [actionName, callBack] = args;
    callBack(new MockAction(actionName));
  }
}

class MockElement {
  eventName: string = '';
  eventHandler: Function = () => '';
  tagName = 'select';

  on(eventName: string, eventHandler: Function) {
    this.eventName = eventName;
    this.eventHandler = eventHandler;
  }

  off(eventName: string) {
    this.eventName = eventName;
  }
}

describe('EventListenerController', () => {
  let controller = new EventListenerController();
  let eventbus = new MockEventbus();
  let selectedElement = new MockElement();
  let operationData: any = {};

  beforeEach(() => {
    controller = new EventListenerController();
    eventbus = new MockEventbus();
    selectedElement = new MockElement();
    operationData = {
      selectedElement: selectedElement,
      eventName: 'test',
      actions: ['actionName1', 'actionName2'],
      actionOperationData: {
        test: 'test',
      },
    };
  });

  it('should create the EventListenerController', () => {
    expect(controller.name).to.equal('EventListenerController');
    expect(controller.operationData).to.be.undefined;
    expect(controller.actionInstanceInfos).to.be.undefined;
  });

  it('should initialize the EventListenerController', () => {
    // given
    // test
    controller.init(operationData);

    // expect
    expect(controller.operationData?.selectedElement).to.equal(
      operationData.selectedElement
    );
    expect(controller.operationData?.eventName).to.equal(
      operationData.eventName
    );
    expect(controller.operationData?.actions.length).to.equal(2);
    expect(controller.operationData?.actionOperationData.test).to.equal('test');
  });

  it('should attach properly', () => {
    // given
    controller.init(operationData);

    // test
    controller.attach(eventbus as any);

    // expect
    expect(controller.actionInstanceInfos?.length).to.equal(2);
    expect(controller.actionInstanceInfos?.[0].action?.name).to.equal(
      'actionName1'
    );
    expect(controller.actionInstanceInfos?.[1].action?.name).to.equal(
      'actionName2'
    );
    expect(controller.actionInstanceInfos?.[0].start).to.be.true;
    expect(controller.actionInstanceInfos?.[1].start).to.be.true;
    expect(operationData.selectedElement.eventName).to.equal('test');
  });

  it('should detach properly', () => {
    // given
    controller.init(operationData);

    // test
    controller.detach((eventbus as any) as IEventbus);

    // expect
    expect(operationData.selectedElement.eventName).to.equal('test');
  });

  it('should call the select event handler', done => {
    // given
    const event = {
      target: {
        value: 'test',
      },
    };
    controller.init(operationData);
    controller.attach(eventbus as any);

    // test
    operationData.selectedElement.eventHandler(event);

    // expect
    const expectedOperatonData = Object.assign(
      { targetValue: 'test' },
      controller.operationData?.actionOperationData
    );
    setTimeout(() => {
      expect(
        controller.actionInstanceInfos?.[0].action.startOperationData
      ).to.eql(expectedOperatonData);
      expect(
        controller.actionInstanceInfos?.[1].action.startOperationData
      ).to.eql(expectedOperatonData);
      done();
    }, 100);
  });

  it('should call the textinput event handler', done => {
    // given
    const event = {
      target: {
        value: 'testTextInput',
      },
    };
    operationData.selectedElement.tagName = 'input';
    controller.init(operationData);
    controller.attach(eventbus as any);

    // test
    operationData.selectedElement.eventHandler(event);

    // expect
    const expectedOperatonData = Object.assign(
      { targetValue: 'testTextInput' },
      controller.operationData.actionOperationData
    );
    setTimeout(() => {
      expect(
        controller.actionInstanceInfos[0].action.startOperationData
      ).to.eql(expectedOperatonData);
      expect(
        controller.actionInstanceInfos[1].action.startOperationData
      ).to.eql(expectedOperatonData);
      done();
    }, 100);
  });
});
