import type {
  IResolvedEngineConfiguration,
  ITimelineFlow,
} from './configuration/types.ts';
import type { IEventbus } from './eventbus/types.ts';

export class EligiusFlowController {
  timelineFlow?: ITimelineFlow;

  constructor(
    private configuration: IResolvedEngineConfiguration,
    private eventbus: IEventbus
  ) {
    this.timelineFlow = configuration.timelineFlow;
  }
}
