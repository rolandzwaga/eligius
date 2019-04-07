class ActionRegistryEventbusListener {

	constructor() {
		this.actionRegistry = {};
	}

	registerAction(action, eventName, eventTopic) {
		if ((eventTopic) && (eventTopic.length)) {
			eventName = `${eventName}:${eventTopic}`;
		}
		if (!this.actionRegistry[eventName]) {
			this.actionRegistry[eventName] = [];
		}
		this.actionRegistry[eventName].push(action);
	}

	handleEvent(eventName, eventTopic, args) {
		if ((eventTopic) && (eventTopic.length)) {
			eventName = `${eventName}:${eventTopic}`;
		}
		const actions = this.actionRegistry[eventName];
		if (actions) {
			const operationData = {
				eventArgs: args
			};
			actions.forEach((action) => {
				action.start(operationData);
			});
		}
	}
}

export default ActionRegistryEventbusListener;
