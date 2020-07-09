import { IResolvedEngineConfiguration } from './types';
import { IEventbus } from './eventbus/types';

export class ChronoTriggerFlowController {
  timelineFlow = null;

  constructor(private configuration: IResolvedEngineConfiguration, private eventbus: IEventbus) {
    this.timelineFlow = configuration.timelineFlow;
  }
}
