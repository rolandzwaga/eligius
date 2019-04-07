import TimelineEventNames from "../timeline-event-names";

class RequestVideoUriInterceptor {

	constructor(eventbus) {
		this.eventbus = eventbus;
	}

	intercept(args) {
		this.eventbus.broadcast(TimelineEventNames.BEFORE_REQUEST_TIMELINE_URI, args.slice());
		return args;
	}

}

export default RequestVideoUriInterceptor;
