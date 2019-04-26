import $ from 'jquery';
import TimelineEventNames from "../timeline-event-names";
import deepcopy from '../operation/helper/deepcopy';

class EventListenerController {

	constructor() {
		this.operationData = null;
		this.actionInstanceInfos = null;
		this.name = "EventListenerController";
	}

	init(operationData) {
		this.operationData = {
			selectedElement: operationData.selectedElement,
			eventName: operationData.eventName,
			actions: operationData.actions.slice(),
			actionOperationData: operationData.actionOperationData ? deepcopy(operationData.actionOperationData) : undefined
		}
	}

	attach(eventbus) {
		const { selectedElement, actions, eventName } = this.operationData;
		if (!this.actionInstanceInfos) {
            this.actionInstanceInfos = [];
			actions.forEach((actionName) => {
				const [isStart, name] = this.isStartAction(actionName);
                const resultCallback = (actionInstance)=> {
                    this.actionInstanceInfos.push({ start:isStart, action: actionInstance});
				};
				
                eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, [name, resultCallback]);
			});
		}
		if (this.getElementTagName(selectedElement) === "SELECT") {
			selectedElement.on(eventName, this.selectEventHandler.bind(this));
		} else {
			selectedElement.on(eventName, this.eventHandler.bind(this));
		}
	}

	getElementTagName(element) {
		const tagName = (element.length) ? element[0].tagName : element.tagName;
		return tagName.toUpperCase();
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
		const copy = (this.operationData.actionOperationData) ? deepcopy(this.operationData.actionOperationData) : {};
		if (event.target) {
			copy.targetValue = event.target.value;
		}
		this.executeAction(this.actionInstanceInfos, copy, 0);
	}

	executeAction(actions, operationData, idx) {
		if (idx < actions.length) {
			const actionInfo = actions[idx];
			const action = actionInfo.action;
			if (actionInfo.start) {
				action.start(operationData)
					.then((resultOperationData) => {
						return this.executeAction(actions, $.extend(operationData, resultOperationData), ++idx);
					});
			} else {
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
				const copy = (this.operationData.actionOperationData) ? deepcopy(this.operationData.actionOperationData) : {};
				this.executeAction(this.actionInstanceInfos, $.extend({ eventArgs: [opt.value] }, copy), 0);
				break;
			}
		}
	}

	detach(eventbus) {
		this.operationData.selectedElement.off(this.operationData.eventName);
	}

}

export default EventListenerController;
