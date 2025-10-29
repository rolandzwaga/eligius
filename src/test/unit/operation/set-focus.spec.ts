import {expect} from 'chai';
import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type ISetFocusOperationData,
  setFocus,
} from '../../../operation/set-focus.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('setFocus', () => {
  let dom: JSDOM;
  let window: Window;
  let document: Document;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window as unknown as Window;
    document = window.document;
    (global as any).window = window;
    (global as any).document = document;
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should set focus to element', () => {
    document.body.innerHTML = '<input id="test" type="text" />';
    const $input = $(document).find('#test');
    let focusCalled = false;
    ($input[0] as any).focus = () => {
      focusCalled = true;
    };

    const operationData: ISetFocusOperationData = {
      selectedElement: $input as any,
    };

    applyOperation(setFocus, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(focusCalled).to.be.true;
  });

  test('should throw error if selectedElement not provided', () => {
    const operationData: ISetFocusOperationData = {
      selectedElement: null as any,
    };

    expect(() => {
      applyOperation(setFocus, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('selectedElement is required');
  });
});
