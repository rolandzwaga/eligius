import { expect } from 'chai';
import { suite } from 'uvu';
import { EventListenerController } from '../../../controllers/event-listener-controller';
import { IEventbus } from '../../../eventbus';

class MockAction {
  name: string;
  startOperationData: any;
  endOperationData: any;
  constructor(actionName: string) {
    this.name = actionName;
  }

  start(operationData: any) {
    this.startOperationData = operationData;
    return new Promise((resolve) => resolve(operationData));
  }

  end(operationData: any) {
    this.endOperationData = operationData;
    return new Promise((resolve) => resolve(operationData));
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

const EventListenerControllerSuite = suite<{
  controller: EventListenerController;
  eventbus: IEventbus;
  selectedElement: MockElement;
  operationData: any;
}>('EventListenerController');

EventListenerControllerSuite.before.each((context) => {
  context.controller = new EventListenerController();
  context.eventbus = new MockEventbus() as unknown as IEventbus;
  context.selectedElement = new MockElement();
  context.operationData = {
    selectedElement: context.selectedElement,
    eventName: 'test',
    actions: ['actionName1', 'actionName2'],
    actionOperationData: {
      test: 'test',
    },
  };
});

EventListenerControllerSuite(
  'should create the EventListenerController',
  (context) => {
    // given
    const { controller } = context;

    expect(controller.name).to.equal('EventListenerController');
    expect(controller.operationData).to.be.undefined;
    expect(controller.actionInstanceInfos).to.be.undefined;
  }
);

EventListenerControllerSuite(
  'should initialize the EventListenerController',
  (context) => {
    // given
    const { controller, operationData } = context;
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
    expect(controller.operationData?.actionOperationData?.test).to.equal(
      'test'
    );
  }
);

EventListenerControllerSuite('should attach properly', (context) => {
  // given
  const { controller, operationData, eventbus } = context;

  controller.init(operationData);

  // test
  controller.attach(eventbus);

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

EventListenerControllerSuite('should detach properly', (context) => {
  // given
  const { controller, operationData, eventbus } = context;

  controller.init(operationData);

  // test
  controller.detach(eventbus as any as IEventbus);

  // expect
  expect(operationData.selectedElement.eventName).to.equal('test');
});

EventListenerControllerSuite(
  'should call the select event handler',
  async (context) => {
    // given
    const { controller, operationData, eventbus } = context;

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

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });

    expect(
      (controller.actionInstanceInfos?.[0].action as unknown as MockAction)
        .startOperationData
    ).to.eql(expectedOperatonData);
    expect(
      (controller.actionInstanceInfos?.[1].action as unknown as MockAction)
        .startOperationData
    ).to.eql(expectedOperatonData);
  }
);

EventListenerControllerSuite(
  'should call the textinput event handler',
  async (context) => {
    // given
    const { controller, operationData, eventbus } = context;

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
      controller.operationData?.actionOperationData
    );

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });

    expect(
      (controller.actionInstanceInfos?.[0].action as unknown as MockAction)
        .startOperationData
    ).to.eql(expectedOperatonData);
    expect(
      (controller.actionInstanceInfos?.[1].action as unknown as MockAction)
        .startOperationData
    ).to.eql(expectedOperatonData);
  }
);

EventListenerControllerSuite.run();
