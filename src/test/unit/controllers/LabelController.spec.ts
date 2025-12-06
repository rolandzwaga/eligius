import {
  type ILabelControllerMetadata,
  LabelController,
} from '@controllers/label-controller.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

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

    expect(controller.name).toBe('LabelController');
    expect(controller.currentLanguage).toBeNull();
    expect(controller.operationData).toBeNull();
    expect(controller.labelData).not.toBeNull();
  });
  test<LabelControllerSuiteContext>('should clone the operationData in init method', context => {
    // given
    const {controller, operationData} = context;
    // test
    controller.init(operationData);
    // expect
    expect(operationData).not.toBe(controller.operationData);
  });
  test<LabelControllerSuiteContext>('should attach properly', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-current-language', () => 'en-GB');

    eventbus.onRequest('request-label-collection', () => [
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

    // test
    controller.attach(eventbus);

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('hello');
  });
  test<LabelControllerSuiteContext>('should set the text based on the new id', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-current-language', () => 'en-GB');

    const firstLabels = () => [
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
    ];
    const firstRemover = eventbus.onRequest('request-label-collection', firstLabels);

    // test
    controller.attach(eventbus);
    firstRemover();
    eventbus.onRequest('request-label-collection', () => [
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
    controller.setLabelId('test2');

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('goodbye');
  });

  test<LabelControllerSuiteContext>('should throw error when label id does not exist', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-current-language', () => 'en-GB');

    // Simulate label not found - return null/undefined
    eventbus.onRequest('request-label-collection', () => null);

    // test & expect
    expect(() => controller.attach(eventbus)).toThrow(
      "Label id 'test' does not exist!"
    );
  });

  test<LabelControllerSuiteContext>('should not attach when operationData is not initialized', context => {
    // given
    const {controller, eventbus} = context;
    // Don't call init() - operationData will be null

    let languageRequestCalled = false;
    eventbus.onRequest('request-current-language', () => {
      languageRequestCalled = true;
      return 'en-GB';
    });

    // test
    controller.attach(eventbus);

    // expect - should return early without requesting
    expect(languageRequestCalled).toBe(false);
  });

  test<LabelControllerSuiteContext>('should handle language change event', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-current-language', () => 'en-GB');

    eventbus.onRequest('request-label-collection', () => [
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

    controller.attach(eventbus);
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('hello');

    // test - trigger language change
    eventbus.broadcast('language-change', ['nl-NL']);

    // expect - content should update to Dutch
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('hallo');
  });

  test<LabelControllerSuiteContext>('should detach and cleanup properly', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-current-language', () => 'en-GB');

    eventbus.onRequest('request-label-collection', () => [
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

    controller.attach(eventbus);

    // test
    controller.detach(eventbus);

    // expect
    expect(controller.requestLabelDataBound).toBeUndefined();
  });
});
