class RequestVideoUrlInterceptor {

	constructor(eventbus) {
		this.eventbus = eventbus;
	}

	intercept(args) {
		this.eventbus.broadcast("before-request-video-url", args.slice());
		return args;
	}

}

export default RequestVideoUrlInterceptor;
