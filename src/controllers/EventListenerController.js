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
				const [isStart, name] = this._isStartAction(actionName);
				const resultCallback = (actionInstance) => {
					this.actionInstanceInfos.push({ start: isStart, action: actionInstance });
				};

				eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, [name, resultCallback]);
			});
			if (this._getElementTagName(selectedElement) === "SELECT") {
				selectedElement.on(eventName, this._selectEventHandler.bind(this));
			} else {
				selectedElement.on(eventName, this._eventHandler.bind(this));
			}
		}
	}

	_getElementTagName(element) {
		const tagName = (element.length) ? element[0].tagName : element.tagName;
		return tagName.toUpperCase();
	}

	_isStartAction(actionName) {
		const prefix = actionName.substr(0, "end:".length);
		if (prefix === "end:") {
			return [false, actionName.substr("end:".length)];
		} else {
			return [true, actionName];
		}
	}

	_eventHandler(event) {
		const copy = (this.operationData.actionOperationData) ? deepcopy(this.operationData.actionOperationData) : {};
		if (event.target) {
			copy.targetValue = event.target.value;
		}
		this._executeAction(this.actionInstanceInfos, copy, 0);
	}

	_executeAction(actions, operationData, idx) {
		if (idx < actions.length) {
			const actionInfo = actions[idx];
			const { action } = actionInfo;
			const method = (actionInfo.start) ? action.start.bind(action) : action.end.bind(action);
			method(operationData)
				.then((resultOperationData) => {
					return this._executeAction(actions, Object.assign(operationData, resultOperationData), ++idx);
				});
		}
	}

	_selectEventHandler(event) {
		const options = event.target;
		for (let i = 0, l = options.length; i < l; i++) {
			const opt = options[i];
			if (opt.selected) {
				const copy = (this.operationData.actionOperationData) ? deepcopy(this.operationData.actionOperationData) : {};
				this._executeAction(this.actionInstanceInfos, Object.assign({ eventArgs: [opt.value] }, copy), 0);
				break;
			}
		}
	}

	detach(eventbus) {
		this.operationData.selectedElement.off(this.operationData.eventName);
	}

}

export default EventListenerController;
