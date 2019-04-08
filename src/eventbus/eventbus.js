class Eventbus {

	constructor() {
		this.clear();
	}

	clear() {
		this.eventHandlers = {};
		this.eventListeners = [];
		this.eventInterceptors = {};
	}

	getEventInterceptors(eventName, eventTopic) {
		if ((eventTopic) && (eventTopic.length)) {
			eventName = `${eventName}:${eventTopic}`;
		}
		if (!this.eventInterceptors[eventName]) {
			this.eventInterceptors[eventName] = [];
		}
		return this.eventInterceptors[eventName];
	}

	getEventHandlers(eventName, eventTopic) {
		if ((eventTopic) && (eventTopic.length)) {
			eventName = `${eventName}:${eventTopic}`;
		}
		if (!this.eventHandlers[eventName]) {
			this.eventHandlers[eventName] = [];
		}
		return this.eventHandlers[eventName];
	}

	on(eventName, eventHandler, eventTopic) {
		this.getEventHandlers(eventName, eventTopic).push(eventHandler);
		return () => {
			this.off(eventName, eventHandler, eventTopic);
		}
	}

	once(eventName, eventHandler, eventTopic) {
		const eventHandlerDecorator = () => {
			eventHandler.call(...arguments);
			this.off(eventName, eventHandler, eventTopic);
		};
		on(eventName, eventHandlerDecorator, eventTopic);
	}

	off(eventName, eventHandler, eventTopic) {
		const handlers = this.getEventHandlers(eventName, eventTopic);
		if (handlers) {
			const idx = handlers.indexOf(eventHandler);
			if (idx > -1) {
				handlers.splice(idx, 1);
			}
		}
	}

	broadcast(eventName, args) {
		this.callHandlers(eventName, null, args);
	}

	broadcastForTopic(eventName, eventTopic, args) {
		this.callHandlers(eventName, eventTopic, args);
	}

	registerEventlistener(eventbusListener) {
		this.eventListeners.push(eventbusListener);
	}

	registerInterceptor(eventName, interceptor, eventTopic) {
		const interceptors = this.getEventInterceptors(eventName, eventTopic);
		interceptors.push(interceptor);
	}

	callHandlers(eventName, eventTopic, args=[]) {
		const interceptors = this.getEventInterceptors(eventName, eventTopic);
		interceptors.forEach((interceptor) => {
			args = interceptor.intercept(args);
		});
		this.eventListeners.forEach((listener) => {
			listener.handleEvent(eventName, eventTopic, args);
		});
		const handlers = this.getEventHandlers(eventName, eventTopic);
		if (handlers) {
			for (let i = 0, l = handlers.length; i < l; i++) {
				const h = handlers[i];
				const len = args.length;
				switch (len) {
					case 0:
						h();
						break;
					case 1:
						h(args[0]);
						break;
					case 2:
						h(args[0], args[1]);
						break;
					case 3:
						h(args[0], args[1], args[2]);
						break;
					case 4:
						h(args[0], args[1], args[2], args[3]);
						break;
					case 5:
						h(args[0], args[1], args[2], args[3], args[4]);
						break;
					case 6:
						h(args[0], args[1], args[2], args[3], args[4], args[5]);
						break;
					default:
						return;
				}
			}
		}
	}

}

export default Eventbus;
