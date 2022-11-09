import { IResolvedOperation } from '../configuration/types';
import { IEventbus } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { IStrictDuration } from '../types';
import { EndableAction } from './endable-action';
import { ITimelineAction } from './types';

export class TimelineAction extends EndableAction implements ITimelineAction {
  private _active: boolean = false;
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
    if (!this.active || this.duration.end < 0) {
      this._active = this.endOperations.length > 0;
      return super.start(initOperationData);
    }

    return Promise.resolve({});
  }

  end(initOperationData: TOperationData): Promise<TOperationData> {
    this._active = false;
    return super.end(initOperationData);
  }
}
