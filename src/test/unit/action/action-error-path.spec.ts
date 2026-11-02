import {Action} from '@action/action.ts';
import {EndableAction} from '@action/endable-action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {endAction} from '@operation/end-action.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {forEach} from '@operation/for-each.ts';
import {startAction} from '@operation/start-action.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

/**
 * The `operationPath` of an action error: every action frame the error
 * passes through adds exactly one entry, outermost first, and the last entry
 * is the failing operation (hand-off specs/handoff/2026-11-01-operation-error-path.md).
 */
function op(
  systemName: string,
  instance: (...args: any[]) => any,
  operationData: Record<string, unknown> = {}
): IResolvedOperation {
  return {id: systemName, systemName, operationData, instance} as any;
}

const pass = (data: any) => data;
const failing = (message: string) => () => {
  throw new Error(message);
};

/** `requestAction` stand-in: puts the callee on the operation data */
const request = (callee: Action) => (data: any) => ({
  ...data,
  actionInstance: callee,
});

function pathOf(error: any) {
  return error.operationPath;
}

describe('operation error path', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('given a direct failure, when start is called, then the path has the failing operation only', async () => {
    const action = new Action(
      'direct',
      [op('selectElement', pass), op('getControllerInstance', failing('Nope'))],
      new Eventbus()
    );

    const error: any = await action.start().catch(e => e);

    expect(error.operationSystemName).toBe('getControllerInstance');
    expect(error.operationIndex).toBe(1);
    expect(pathOf(error)).toEqual([
      {systemName: 'getControllerInstance', index: 1},
    ]);
  });

  test('given a failure in a called action at an index the caller shares, when start is called, then the path names the startAction and the inner operation', async () => {
    const eventbus = new Eventbus();
    const inner = new Action(
      'inner',
      [op('getControllerInstance', failing('NoSuchController'))],
      eventbus
    );
    const outer = new Action(
      'outer',
      [
        op('getControllerInstance', pass),
        op('requestAction', request(inner)),
        op('startAction', startAction),
      ],
      eventbus
    );

    const error: any = await outer.start().catch(e => e);

    expect(error.message).toBe('NoSuchController');
    expect(error.operationSystemName).toBe('getControllerInstance');
    expect(error.operationIndex).toBe(0);
    expect(pathOf(error)).toEqual([
      {systemName: 'startAction', index: 2},
      {systemName: 'getControllerInstance', index: 0},
    ]);
  });

  test('given three nested actions, when the innermost fails, then the path has three entries, outermost first', async () => {
    const eventbus = new Eventbus();
    const inner = new Action(
      'inner',
      [op('selectElement', pass), op('boom', failing('deep'))],
      eventbus
    );
    const middle = new Action(
      'middle',
      [op('requestAction', request(inner)), op('startAction', startAction)],
      eventbus
    );
    const outer = new Action(
      'outer',
      [
        op('selectElement', pass),
        op('selectElement', pass),
        op('requestAction', request(middle)),
        op('startAction', startAction),
      ],
      eventbus
    );

    const error: any = await outer.start().catch(e => e);

    expect(pathOf(error)).toEqual([
      {systemName: 'startAction', index: 3},
      {systemName: 'startAction', index: 1},
      {systemName: 'boom', index: 1},
    ]);
    expect(error.operationIndex).toBe(1);
  });

  test('given an inner operation that returns a rejecting promise, when start is called, then each frame adds exactly one entry', async () => {
    const eventbus = new Eventbus();
    const inner = new Action(
      'inner',
      [
        op('selectElement', pass),
        op('load', () => Promise.reject(new Error('async boom'))),
      ],
      eventbus
    );
    const outer = new Action(
      'outer',
      [op('requestAction', request(inner)), op('startAction', startAction)],
      eventbus
    );

    const error: any = await outer.start().catch(e => e);

    expect(error.message).toBe('async boom');
    expect(pathOf(error)).toEqual([
      {systemName: 'startAction', index: 1},
      {systemName: 'load', index: 1},
    ]);
  });

  test('given a synchronous failure after an earlier async operation in the same list, when start is called, then the continuation frame adds one entry only', async () => {
    const eventbus = new Eventbus();
    const inner = new Action(
      'inner',
      [
        op('wait', async (data: any) => data),
        op('selectElement', pass),
        op('boom', failing('after await')),
      ],
      eventbus
    );
    const outer = new Action(
      'outer',
      [
        op('wait', async (data: any) => data),
        op('requestAction', request(inner)),
        op('startAction', startAction),
      ],
      eventbus
    );

    const error: any = await outer.start().catch(e => e);

    expect(pathOf(error)).toEqual([
      {systemName: 'startAction', index: 2},
      {systemName: 'boom', index: 2},
    ]);
  });

  test('given a failure in the end operations of a called action, when endAction runs, then the path names endAction and the inner end operation', async () => {
    const eventbus = new Eventbus();
    const inner = new EndableAction(
      'inner',
      [op('selectElement', pass)],
      [op('selectElement', pass), op('removeElement', failing('gone'))],
      eventbus
    );
    const outer = new EndableAction(
      'outer',
      [op('requestAction', request(inner)), op('startAction', startAction)],
      [op('requestAction', request(inner)), op('endAction', endAction)],
      eventbus
    );
    await outer.start();

    const error: any = await outer.end().catch(e => e);

    expect(error.message).toBe('gone');
    expect(pathOf(error)).toEqual([
      {systemName: 'endAction', index: 1},
      {systemName: 'removeElement', index: 1},
    ]);
  });

  test('given a failure inside a forEach body, when start is called, then the index is the position in the flat operation list', async () => {
    let calls = 0;
    const action = new Action(
      'loop',
      [
        op('forEach', forEach, {collection: [1, 2, 3]}),
        op('step', (data: any) => {
          calls++;
          if (calls === 2) {
            throw new Error('second item');
          }
          return data;
        }),
        op('endForEach', endForEach),
      ],
      new Eventbus()
    );

    const error: any = await action.start().catch(e => e);

    expect(error.message).toBe('second item');
    expect(pathOf(error)).toEqual([{systemName: 'step', index: 1}]);
  });

  test('given a thrown string, when start is called, then the wrapping Error carries the path', async () => {
    const action = new Action(
      'plain',
      [
        op('only', () => {
          throw 'plain string';
        }),
      ],
      new Eventbus()
    );

    const error: any = await action.start().catch(e => e);

    expect(error).toBeInstanceOf(Error);
    expect(pathOf(error)).toEqual([{systemName: 'only', index: 0}]);
  });

  test('given the same action run twice with a reused error object, when both runs fail, then the path is rebuilt from the frames of each run', async () => {
    const reused = new Error('same object');
    const action = new Action(
      'reuse',
      [
        op('first', pass),
        op('second', () => {
          throw reused;
        }),
      ],
      new Eventbus()
    );

    const first: any = await action.start().catch(e => e);
    const second: any = await action.start().catch(e => e);

    expect(first).toBe(reused);
    // The second run prepends its own frame again: a reused error object
    // accumulates, which is why errors should not be shared between runs.
    expect(pathOf(second)).toEqual([
      {systemName: 'second', index: 1},
      {systemName: 'second', index: 1},
    ]);
  });
});
