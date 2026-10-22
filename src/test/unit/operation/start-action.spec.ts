import {Action} from '@action/action.ts';
import type {IAction} from '@action/types.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {addClass} from '@operation/add-class.ts';
import type {TOperationData} from '@operation/index.ts';
import {selectElement} from '@operation/select-element.ts';
import {startAction} from '@operation/start-action.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';

class MockAction {
  resolved: boolean = false;
  start(operationData: TOperationData) {
    this.resolved = true;
    return new Promise(resolve => {
      resolve(operationData);
    });
  }
}

describe('startAction', () => {
  test('should start the specified action', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;

    const operationData = {
      actionInstance: mockAction,
      resolved: false,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation(startAction, operationData);

    // expect
    //expect(result.resolved).toBe(true);
    expect((mockAction as any).resolved).toBe(true);
    expect((result as any).actionOperationData).toBeUndefined();
    return result;
  });

  test('should remove the actionOperationData property from tghe operation data', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;

    const operationData = {
      actionInstance: mockAction,
      resolved: false,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation(startAction, operationData);

    // expect
    //expect(result.resolved).toBe(true);
    expect('actionOperationData' in result).toBe(false);
    return result;
  });

  test('given startAction operation data without actionOperationData, when the action start resolves, then the returned promise resolves with the actionInstance and the operation data', async () => {
    // given
    const mockAction = new MockAction() as unknown as IAction;
    const operationData = {actionInstance: mockAction, other: 1} as any;

    // test
    const result = await Promise.race([
      applyOperation(startAction, operationData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('startAction hung')), 500)
      ),
    ]);

    // expect
    expect(result).toEqual({other: 1, actionInstance: mockAction});
  });

  test('given startAction operation data without actionInstance, when the operation runs, then it rejects with a clear error', async () => {
    // given
    const operationData = {actionOperationData: {}} as any;

    // test & expect
    await expect(applyOperation(startAction, operationData)).rejects.toThrow(
      'startAction: actionInstance is required'
    );
  });
});

describe('startAction with real actions', () => {
  let eventbus: Eventbus;

  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    eventbus = new Eventbus();
    eventbus.onRequest('request-engine-root', () => $('body'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function op(
    systemName: string,
    instance: any,
    operationData: TOperationData = {}
  ): IResolvedOperation {
    return {id: systemName, systemName, operationData, instance};
  }

  test('given a caller action that selects #a and then startAction on an action whose start operations select #b, when startAction resolves and the caller runs addClass done, then #a has class done and #b does not', async () => {
    // given
    const highlight = new Action(
      'Highlight',
      [
        op('selectElement', selectElement, {selector: '#b'}),
        op('addClass', addClass, {className: 'hl'}),
      ],
      eventbus
    );
    const caller = new Action(
      'Caller',
      [
        op('selectElement', selectElement, {selector: '#a'}),
        op('startAction', startAction),
        op('addClass', addClass, {className: 'done'}),
      ],
      eventbus
    );

    // test
    await caller.start({actionInstance: highlight});

    // expect
    expect($('#b').hasClass('hl')).toBe(true);
    expect($('#a').hasClass('done')).toBe(true);
    expect($('#b').hasClass('done')).toBe(false);
  });

  test('given actionOperationData that overrides a key the caller already has, when startAction resolves, then the caller keeps its own value', async () => {
    // given
    const received: unknown[] = [];
    const inner = new Action(
      'Inner',
      [
        op('record', (data: TOperationData) => {
          received.push(data.label);
          return data;
        }),
      ],
      eventbus
    );

    // test
    const result = await applyOperation(startAction, {
      actionInstance: inner,
      label: 'caller',
      actionOperationData: {label: 'inner'},
    } as any);

    // expect
    expect(received).toEqual(['inner']);
    expect((result as any).label).toBe('caller');
  });
});
