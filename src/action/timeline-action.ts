import {EndableAction} from '@action/endable-action.ts';
import type {ITimelineAction} from '@action/types.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';
import type {IStrictDuration} from '../types.ts';

type TRun = () => Promise<TOperationData>;

export class TimelineAction extends EndableAction implements ITimelineAction {
  private _active: boolean = false;
  /** True while start or end operations of this action are running */
  private _running = false;
  /** Starts and ends called while operations were running, in call order */
  private _waiting: Array<() => void> = [];
  /**
   * Finishes the run that `_execute` is starting; handed to the operations
   * run (see `_runOperations`) so it is called the moment they settle.
   */
  private _finishPending: (() => void) | undefined;

  /**
   * True from the moment `start()` is called until `end()` is called, whether
   * or not the action has end operations. Both transitions happen
   * synchronously, so a second dispatch of the same start or end (a seek
   * while playing, a revisited key) is a no-op.
   */
  public get active() {
    return this._active;
  }

  constructor(
    name: string,
    startOperations: IResolvedOperation[],
    endOperations: IResolvedOperation[],
    public duration: IStrictDuration,
    eventBus: IEventbus
  ) {
    super(name, startOperations, endOperations, eventBus);
  }

  /**
   * Starts the action, unless it is already active.
   *
   * `active` becomes true at once. When the operations of an earlier start
   * or end are still running (an asynchronous end at a loop wrap, a start
   * awaiting a fetch when its range is skipped), these start operations run
   * once those have finished, so the start and end operations of one action
   * never interleave. Otherwise they run right away.
   *
   * @param initOperationData - Operation data the first start operation receives
   * @returns The operation data of the last start operation
   */
  start(initOperationData?: TOperationData): Promise<TOperationData> {
    if (this._active) {
      return Promise.resolve({});
    }

    this._active = true;
    return this._sequence(() => super.start(initOperationData));
  }

  /**
   * Ends the action, unless it is not active.
   *
   * `active` becomes false at once. Like {@link start}, the end operations
   * wait for operations of this action that are still running.
   *
   * @param initOperationData - Operation data the first end operation receives
   * @returns The operation data of the last end operation
   */
  end(initOperationData?: TOperationData): Promise<TOperationData> {
    if (!this._active) {
      return Promise.resolve({});
    }

    this._active = false;
    return this._sequence(() => super.end(initOperationData));
  }

  private _sequence(run: TRun): Promise<TOperationData> {
    if (!this._running) {
      return this._execute(run);
    }
    return new Promise<TOperationData>((resolve, reject) => {
      this._waiting.push(() => {
        this._execute(run).then(resolve, reject);
      });
    });
  }

  /**
   * Runs `run`, marking the action as running until its operations settle.
   * Operations that complete synchronously finish the run synchronously, so
   * a start and end called back to back both run within the same call stack.
   */
  private _execute(run: TRun): Promise<TOperationData> {
    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      this._running = false;
      this._waiting.shift()?.();
    };

    this._running = true;
    this._finishPending = finish;
    let result: Promise<TOperationData>;
    try {
      result = run();
    } catch (error) {
      result = Promise.reject(error);
    }
    if (this._finishPending === finish) {
      // No operations ran (an end without end operations)
      this._finishPending = undefined;
      finish();
    }
    return result;
  }

  protected override _runOperations(
    operations: IResolvedOperation[],
    initOperationData?: TOperationData,
    onSettled?: () => void
  ): Promise<TOperationData> {
    const finish = this._finishPending;
    this._finishPending = undefined;
    return super._runOperations(operations, initOperationData, () => {
      onSettled?.();
      finish?.();
    });
  }
}
