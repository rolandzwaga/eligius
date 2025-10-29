import type {
  IResolvedEngineConfiguration,
  ITimelineFlow,
} from './configuration/types.ts';
import type {IEventbus} from './eventbus/types.ts';

export class EligiusFlowController {
  timelineFlow?: ITimelineFlow;

  constructor(
    configuration: IResolvedEngineConfiguration,
    _eventbus: IEventbus
  ) {
    this.timelineFlow = configuration.timelineFlow;
  }
}
