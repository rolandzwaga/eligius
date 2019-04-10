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
		const _this = this;
		const eventHandlerDecorator = function() {
			eventHandler(...arguments)
			_this.off(eventName, eventHandlerDecorator, eventTopic);
		};
		this.on(eventName, eventHandlerDecorator, eventTopic);
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
				handlers[i](...args);
			}
		}
	}

}

export default Eventbus;
