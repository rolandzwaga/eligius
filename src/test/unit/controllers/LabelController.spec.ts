import {
  type ILabelControllerMetadata,
  LabelController,
} from '@controllers/label-controller.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

class MockElement {
  content: string = '';
  attributes: Record<string, string> = {};

  html(content: string) {
    this.content = content;
  }

  attr(name: string, value: string) {
    this.attributes[name] = value;
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
      translationKey: 'nav.home',
    };
  });

  test<LabelControllerSuiteContext>('should create the LabelController', context => {
    // given
    const {controller} = context;

    expect(controller.name).toBe('LabelController');
    expect(controller.operationData).toBeNull();
  });

  test<LabelControllerSuiteContext>('should clone the operationData in init method', context => {
    // given
    const {controller, operationData} = context;
    // test
    controller.init(operationData);
    // expect
    expect(operationData).not.toBe(controller.operationData);
  });

  test<LabelControllerSuiteContext>('given translationKey, when attached, then uses request-translation', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-translation', () => 'Home');

    // test
    controller.attach(eventbus);

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('Home');
  });

  test<LabelControllerSuiteContext>('given translationKey, when request-translation returns null, then uses empty string', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);
    eventbus.onRequest('request-translation', () => null);

    // test
    controller.attach(eventbus);

    // expect
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('');
  });

  test<LabelControllerSuiteContext>('given translationKey mode, when language changes, then re-renders translation', context => {
    // given
    const {controller, selectedElement, eventbus} = context;
    const translationKeyData = {
      selectedElement,
      translationKey: 'nav.home',
    };

    controller.init(translationKeyData);

    // Simulate locale-aware translation responses
    let currentTranslation = 'Home';
    eventbus.onRequest('request-translation', () => currentTranslation);

    controller.attach(eventbus);
    expect((selectedElement as unknown as MockElement).content).toBe('Home');

    // test - change language and simulate new translation
    currentTranslation = 'Thuis';
    eventbus.broadcast('language-change', ['nl-NL']);

    // expect
    expect((selectedElement as unknown as MockElement).content).toBe('Thuis');
  });

  test<LabelControllerSuiteContext>('given translationKey mode, when setTranslationKey called, then updates content', context => {
    // given
    const {controller, selectedElement, eventbus} = context;
    const translationKeyData = {
      selectedElement,
      translationKey: 'nav.home',
    };

    controller.init(translationKeyData);

    // Return different translations based on key
    eventbus.onRequest('request-translation', (key: string) => {
      if (key === 'nav.home') return 'Home';
      if (key === 'nav.about') return 'About Us';
      return '';
    });

    controller.attach(eventbus);
    expect((selectedElement as unknown as MockElement).content).toBe('Home');

    // test
    controller.setTranslationKey('nav.about');

    // expect
    expect((selectedElement as unknown as MockElement).content).toBe(
      'About Us'
    );
  });

  test<LabelControllerSuiteContext>('should not attach when operationData is not initialized', context => {
    // given
    const {controller, eventbus} = context;
    // Don't call init() - operationData will be null

    let translationRequestCalled = false;
    eventbus.onRequest('request-translation', () => {
      translationRequestCalled = true;
      return 'Home';
    });

    // test
    controller.attach(eventbus);

    // expect - should return early without requesting
    expect(translationRequestCalled).toBe(false);
  });

  test<LabelControllerSuiteContext>('should detach properly and not update on language change', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);

    let currentTranslation = 'Home';
    eventbus.onRequest('request-translation', () => currentTranslation);

    controller.attach(eventbus);
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('Home');

    // test - detach and then try to trigger language change
    controller.detach(eventbus);
    currentTranslation = 'Thuis';
    eventbus.broadcast('language-change', ['nl-NL']);

    // expect - content should NOT change since we detached
    expect(
      (operationData.selectedElement as unknown as MockElement).content
    ).toBe('Home');
  });

  test<LabelControllerSuiteContext>('given attributeName, when attached, then sets attribute instead of innerHTML', context => {
    // given
    const {controller, eventbus} = context;
    const mockElement = new MockElement() as unknown as JQuery;
    const operationData = {
      selectedElement: mockElement,
      translationKey: 'button.submit',
      attributeName: 'title',
    };

    controller.init(operationData);
    eventbus.onRequest('request-translation', () => 'Submit Form');

    // test
    controller.attach(eventbus);

    // expect - should set attribute, not innerHTML
    expect((mockElement as unknown as MockElement).content).toBe('');
    expect((mockElement as unknown as MockElement).attributes.title).toBe(
      'Submit Form'
    );
  });

  test<LabelControllerSuiteContext>('setTranslationKey should not update if operationData is null', context => {
    // given
    const {controller} = context;
    // Don't call init() - operationData will be null

    // test & expect - should not throw
    expect(() => controller.setTranslationKey('new.key')).not.toThrow();
  });
});
