import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  getFocusedElement,
  type IGetFocusedElementOperationData,
} from '../../../operation/get-focused-element.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('getFocusedElement', () => {
  let dom: JSDOM;
  let window: Window;
  let document: Document;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><html><body><input id="test" /></body></html>'
    );
    window = dom.window as unknown as Window;
    document = window.document;
    (global as any).window = window;
    (global as any).document = document;
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should get currently focused element', () => {
    const operationData: IGetFocusedElementOperationData = {} as any;

    const result = applyOperation(getFocusedElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.focusedElement).to.exist;
  });
});
