import EndableAction from './endableaction';

class TimelineAction extends EndableAction {

	constructor(actionData, eventBus) {
		super(actionData, eventBus);
		this.active = false;
		this.duration = actionData.duration;
		this.duration.start = +this.duration.start;
		this.duration.end = +this.duration.end;
	}

	start(initOperationData) {
		if ((!this.active) || (this.duration.end < 0)) {
			this.active = (this.duration.end > -1);
			return super.start(initOperationData);
		}
		return new Promise((resolve) => {
			resolve();
		});
	}

	end(initOperationData) {
		this.active = false;
		return super.end(initOperationData);
	}

	resize(operationData) {
		if ((this.active) || (this.duration.end < 0)) {
			return super.resize(operationData);
		}
		return new Promise((resolve) => {
			resolve();
		});
	}

}

export default TimelineAction;
