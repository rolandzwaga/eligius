import EndableAction from './endableaction';
import { IEventbus } from '../eventbus/types';
import { IResolvedTimelineActionConfiguration, TOperationData } from './types';
import { IDuration } from '../types';

class TimelineAction extends EndableAction {
  id: string = '';
  active: boolean;
  duration: IDuration;

  constructor(actionConfiguration: IResolvedTimelineActionConfiguration, eventBus: IEventbus) {
    super(actionConfiguration, eventBus);
    this.active = false;
    this.duration = actionConfiguration.duration;
    this.duration.start = +this.duration.start;
    this.duration.end = +this.duration.end;
  }

  start(initOperationData: TOperationData): Promise<TOperationData> {
    if (!this.active || this.duration.end < 0) {
      this.active = this.duration.end > -1;
      return super.start(initOperationData);
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  end(initOperationData: TOperationData): Promise<TOperationData> {
    this.active = false;
    return super.end(initOperationData);
  }
}

export default TimelineAction;
