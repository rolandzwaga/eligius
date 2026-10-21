import type {IController} from '@controllers/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {
  type ISetElementContentOperationData,
  setElementContent,
} from '@operation/set-element-content.ts';
import {applyOperation, createDefaultScope} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test, vi} from 'vitest';

class TimeListeningController implements IController<any> {
  name = 'TimeListeningController';
  onTime = vi.fn();
  detach = vi.fn((_eventbus: IEventbus) => {
    this.remover?.();
  });
  private remover?: () => void;

  init() {}

  attach(eventbus: IEventbus) {
    this.remover = eventbus.on('timeline-time', this.onTime);
  }
}

class MockElement {
  htmlContent: string = '';
  appendContent: string = '';
  prependContent: string = '';

  children() {
    return $();
  }

  html(content: string) {
    this.htmlContent = content;
  }

  append(content: string) {
    this.appendContent = content;
  }

  prepend(content: string) {
    this.prependContent = content;
  }
}

describe('setElementContent', () => {
  test('should set the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
      insertionType: 'overwrite',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.htmlContent).toBe('<div/>');
  });
  test('should append the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'append',
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.appendContent).toBe('<div/>');
  });
  test('should prepend the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'prepend',
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.prependContent).toBe('<div/>');
  });

  test('should remove the insertionType and template properties from operation data', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'prepend',
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
    };

    // test
    const newData = applyOperation(setElementContent, operationData);

    // expect
    expect('insertionType' in newData).toBe(false);
    expect('template' in newData).toBe(false);
  });

  describe('controllers in replaced content', () => {
    function setup() {
      document.body.innerHTML =
        '<div id="stage"><div id="bar"><span id="inner"></span></div></div>';
      const eventbus = new Eventbus();
      const scope = {...createDefaultScope(), eventbus};
      const onStage = new TimeListeningController();
      const onBar = new TimeListeningController();
      const onInner = new TimeListeningController();
      applyOperation(
        addControllerToElement,
        {selectedElement: $('#stage'), controllerInstance: onStage},
        scope
      );
      applyOperation(
        addControllerToElement,
        {selectedElement: $('#bar'), controllerInstance: onBar},
        scope
      );
      applyOperation(
        addControllerToElement,
        {selectedElement: $('#inner'), controllerInstance: onInner},
        scope
      );
      return {eventbus, scope, onStage, onBar, onInner};
    }

    test('given controllers inside the selected element, when content is overwritten, then they are detached and the element keeps its own controller', () => {
      // given
      const {eventbus, scope, onStage, onBar, onInner} = setup();

      // test
      applyOperation(
        setElementContent,
        {
          selectedElement: $('#stage'),
          template: '<p>new</p>',
          insertionType: 'overwrite',
        },
        scope
      );
      eventbus.broadcast('timeline-time', [1]);

      // expect
      expect($('#stage').html()).toBe('<p>new</p>');
      expect(onBar.detach).toHaveBeenCalledWith(eventbus);
      expect(onInner.detach).toHaveBeenCalledWith(eventbus);
      expect(onBar.onTime).not.toHaveBeenCalled();
      expect(onStage.detach).not.toHaveBeenCalled();
      expect(onStage.onTime).toHaveBeenCalledWith(1);
    });

    test('given controllers inside the selected element, when content is appended, then no controller is detached', () => {
      // given
      const {scope, onBar, onInner} = setup();

      // test
      applyOperation(
        setElementContent,
        {
          selectedElement: $('#stage'),
          template: '<p>new</p>',
          insertionType: 'append',
        },
        scope
      );

      // expect
      expect(onBar.detach).not.toHaveBeenCalled();
      expect(onInner.detach).not.toHaveBeenCalled();
    });

    test('given a controller whose detach throws, when content is overwritten, then the content is replaced and an AggregateError naming setElementContent is thrown', () => {
      // given
      const {scope, onBar} = setup();
      onBar.detach.mockImplementation(() => {
        throw new Error('boom');
      });

      // test & expect
      expect(() =>
        applyOperation(
          setElementContent,
          {
            selectedElement: $('#stage'),
            template: '<p>new</p>',
            insertionType: 'overwrite',
          },
          scope
        )
      ).toThrow(/^setElementContent:/);
      expect($('#stage').html()).toBe('<p>new</p>');
    });
  });
});
