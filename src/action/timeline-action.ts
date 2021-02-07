import { IResolvedOperation } from '../configuration/types';
import { IEventbus } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { IStrictDuration } from '../types';
import { EndableAction } from './endable-action';

export class TimelineAction extends EndableAction {
  public active = false;

  constructor(
    name: string,
    startOperations: IResolvedOperation[],
    endOperations: IResolvedOperation[],
    public duration: IStrictDuration,
    eventBus: IEventbus
  ) {
    super(name, startOperations, endOperations, eventBus);
  }

  start(initOperationData: TOperationData): Promise<TOperationData> {
    if (!this.active || this.duration.end < 0) {
      this.active = this.duration.end > -1;
      return super.start(initOperationData);
    }
    return new Promise<void>((resolve) => {
      resolve();
    });
  }

  end(initOperationData: TOperationData): Promise<TOperationData> {
    this.active = false;
    return super.end(initOperationData);
  }
}
