import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test} from 'vitest';
import {
  type ILabelControllerMetadata,
  LabelController,
} from '../../../controllers/label-controller.ts';
import {Eventbus, type IEventbus} from '../../../eventbus/index.ts';

class MockElement {
  content: string = '';
  html(content: string) {
    this.content = content;
  }
}

type LabelControllerSuiteContext = {
  controller: LabelController;
  eventbus: IEventbus;
  selectedElement: JQuery;
  operationData: ILabelControllerMetadata;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<LabelControllerSuiteContext>('LabelController', () => {
  beforeEach(context => {
    withContext<LabelControllerSuiteContext>(context);

    context.controller = new LabelController();
    context.eventbus = new Eventbus();
    context.selectedElement = new MockElement() as unknown as JQuery;
    context.operationData = {
      selectedElement: context.selectedElement,
      labelId: 'test',
    };
  });
  test<LabelControllerSuiteContext>('should create the LabelController', context => {
    // given
    const {controller} = context;

    expect(controller.name).to.equal('LabelController');
    expect(controller.currentLanguage).to.be.null;
    expect(controller.operationData).to.be.null;
    expect(controller.labelData).to.not.be.null;
  });
  test<LabelControllerSuiteContext>('should clone the operationData in init method', context => {
    // given
    const {controller, operationData} = context;
    // test
    controller.init(operationData);
    // expect
    expect(operationData).to.not.equal(controller.operationData);
  });
  test<LabelControllerSuiteContext>('should attach properly', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.on(
      'request-current-language',
      (...args: any[]) => {
        args[0]('en-GB');
      }
    );

    eventbus.on(
      'request-label-collection',
      (...args: any[]) => {
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
      }
    );

    // test
    controller.attach(eventbus);

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).to.equal('hello');
  });
  test<LabelControllerSuiteContext>('should set the text based on the new id', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.on(
      'request-current-language',
      (...args: any[]) => {
        args[0]('en-GB');
      }
    );

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
    eventbus.on('request-label-collection', firstLabels);

    // test
    controller.attach(eventbus);
    eventbus.off('request-label-collection', firstLabels);
    eventbus.on(
      'request-label-collection',
      (...args: any[]) => {
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
      }
    );
    controller.setLabelId('test2');

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).to.equal('goodbye');
  });
});
