import {EndableAction} from '@action/endable-action.ts';
import type {ITimelineAction} from '@action/types.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';
import type {IStrictDuration} from '../types.ts';

export class TimelineAction extends EndableAction implements ITimelineAction {
  private _active: boolean = false;

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

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    if (this._active) {
      return Promise.resolve({});
    }

    this._active = true;
    return super.start(initOperationData);
  }

  end(initOperationData?: TOperationData): Promise<TOperationData> {
    if (!this._active) {
      return Promise.resolve({});
    }

    this._active = false;
    return super.end(initOperationData);
  }
}
