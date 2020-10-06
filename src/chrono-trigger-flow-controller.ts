import { IResolvedEngineConfiguration, ITimelineFlow } from './types';
import { IEventbus } from './eventbus/types';

export class ChronoTriggerFlowController {
  timelineFlow: ITimelineFlow;

  constructor(private configuration: IResolvedEngineConfiguration, private eventbus: IEventbus) {
    this.timelineFlow = configuration.timelineFlow;
  }
}
