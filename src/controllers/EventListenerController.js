import $ from 'jquery';
class EventListenerController {

	constructor() {
		this.operationData = null;
		this.actions = null;
		this.name = "EventListenerController";
	}

	init(operationData) {
		this.operationData = {
			selectedElement: operationData.selectedElement,
			eventName: operationData.eventName,
			actions: operationData.actions.slice(),
			actionOperationData: operationData.actionOperationDatab ? JSON.parse(JSON.stringify(operationData.actionOperationData)) : undefined
		}
	}

	attach(eventbus) {
		if (!this.actions) {
            this.actions = [];
			this.operationData.actions.forEach((actionName) => {
				const [doStart, name] = this.isStartAction(actionName);
                const resultCallback = (actionInstance)=> {
                    this.actions.push({ start:doStart, action: actionInstance});
                };
                eventbus.broadcast("request-action", [name, resultCallback]);
			});
		}
		if (this.operationData.selectedElement.prop("tagName") === "select") {
			this.operationData.selectedElement.on(this.operationData.eventName, this.selectEventHandler.bind(this));
		} else {
			this.operationData.selectedElement.on(this.operationData.eventName, this.eventHandler.bind(this));
		}
	}

	isStartAction(actionName) {
		const prefix = actionName.substr(0, "end:".length);
		if (prefix === "end:") {
			return [false, actionName.substr("end:".length)];
		} else {
			return [true, actionName];
		}
	}

	eventHandler(event) {
		const copy = (this.operationData.actionOperationData) ? JSON.parse(JSON.stringify(this.operationData.actionOperationData)) : {};
		if (event.target) {
			copy.targetValue = event.target.value;
		}
		this.executeAction(this.actions, copy, 0);
	}

	executeAction(actions, operationData, idx) {
		if (idx < actions.length) {
			const act = actions[idx];
			const action = act.action;
			if (act.start) {
				//console.debug("Start action: " + action.name);
				action.start(operationData)
					.then((resultOperationData) => {
						return this.executeAction(actions, $.extend(operationData, resultOperationData), ++idx);
					});
			} else {
				//console.debug("End action: " + action.name);
				action.end()
					.then((resultOperationData) => {
						return this.executeAction(actions, $.extend(operationData, resultOperationData), ++idx);
					});
			}
		}
	}

	selectEventHandler(event) {
		const options = event.target;
		for (let i = 0, l = options.length; i < l; i++) {
			const opt = options[i];
			if (opt.selected) {
				const copy = (this.operationData.actionOperationData) ? JSON.parse(JSON.stringify(this.operationData.actionOperationData)) : {};
				this.executeAction(this.actions, $.extend({ eventArgs: [opt.value] }, copy), 0);
				break;
			}
		}
	}

	detach(eventbus) {
		this.operationData.selectedElement.off(this.operationData.eventName);
	}

}

export default EventListenerController;
