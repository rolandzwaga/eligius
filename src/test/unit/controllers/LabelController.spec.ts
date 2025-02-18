import { expect } from 'chai';
import { suite } from 'uvu';
import {
  type ILabelControllerMetadata,
  LabelController,
} from '../../../controllers/label-controller.ts';
import { Eventbus, type IEventbus } from '../../../eventbus/index.ts';
import { TimelineEventNames } from '../../../timeline-event-names.ts';
class MockElement {
  content: string = '';
  html(content: string) {
    this.content = content;
  }
}

const LabelControllerSuite = suite<{
  controller: LabelController;
  eventbus: IEventbus;
  selectedElement: JQuery;
  operationData: ILabelControllerMetadata;
}>('LabelController');

LabelControllerSuite.before.each((context) => {
  context.controller = new LabelController();
  context.eventbus = new Eventbus();
  context.selectedElement = new MockElement() as unknown as JQuery;
  context.operationData = {
    selectedElement: context.selectedElement,
    labelId: 'test',
  };
});

LabelControllerSuite('should create the LabelController', (context) => {
  // given
  const { controller } = context;

  expect(controller.name).to.equal('LabelController');
  expect(controller.listeners).to.not.be.null;
  expect(controller.listeners.length).to.equal(0);
  expect(controller.currentLanguage).to.be.null;
  expect(controller.operationData).to.be.null;
  expect(controller.labelData).to.not.be.null;
});

LabelControllerSuite(
  'should clone the operationData in init method',
  (context) => {
    // given
    const { controller, operationData } = context;
    // test
    controller.init(operationData);
    // expect
    expect(operationData).to.not.equal(controller.operationData);
  }
);

LabelControllerSuite('should attach properly', (context) => {
  // given
  const { controller, operationData, eventbus } = context;
  controller.init(operationData);
  eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, (...args: any[]) => {
    args[0]('en-GB');
  });

  eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, (...args: any[]) => {
    args[1]([
      {
        id: '1111',
        languageCode: 'nl-NL',
        label: 'hallo',
      },
      {
        id: '2222',
        languageCode: 'en-GB',
        label: 'hello',
      },
    ]);
  });

  // test
  controller.attach(eventbus);

  // expect
  expect(
    (operationData.selectedElement as unknown as MockElement).content
  ).to.equal('hello');
});

LabelControllerSuite('should set the text based on the new id', (context) => {
  // given
  const { controller, operationData, eventbus } = context;
  controller.init(operationData);
  eventbus.on(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, (...args: any[]) => {
    args[0]('en-GB');
  });

  const firstLabels = (...args: any[]) => {
    args[1]([
      {
        id: '1111',
        languageCode: 'nl-NL',
        label: 'hallo',
      },
      {
        id: '2222',
        languageCode: 'en-GB',
        label: 'hello',
      },
    ]);
  };
  eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, firstLabels);

  // test
  controller.attach(eventbus);
  eventbus.off(TimelineEventNames.REQUEST_LABEL_COLLECTION, firstLabels);
  eventbus.on(TimelineEventNames.REQUEST_LABEL_COLLECTION, (...args: any[]) => {
    args[1]([
      {
        id: '3333',
        languageCode: 'nl-NL',
        label: 'tot ziens',
      },
      {
        id: '4444',
        languageCode: 'en-GB',
        label: 'goodbye',
      },
    ]);
  });
  controller.setLabelId('test2');

  // expect
  expect(
    (operationData.selectedElement as unknown as MockElement).content
  ).to.equal('goodbye');
});

LabelControllerSuite.run();
