class ChronoTriggerFlowController {
  timelineFlow = null;

  constructor(configuration, eventbus) {
    this.configuration = configuration;
    this._eventbus = eventbus;
    this.timelineFlow = configuration.timelineFlow;
  }
}
