import Action from './action';

class EndableAction extends Action {

	constructor(actionConfigration, eventBus) {
		super(actionConfigration, eventBus);
		this.endOperations = actionConfigration.endOperations;
	}

	end(initOperationData) {
		if ((this.endOperations) && (this.endOperations.length)) {
			const idx = 0;
			const result = new Promise((resolve, reject) => {
				this.executeOperation(this.endOperations, idx, resolve, reject, initOperationData);
			}).catch((e) => {
				console.error(`Error in action end'${this.name}'`);
				throw e;
			});
			return result;
		}
		return new Promise((resolve) => {
			resolve(initOperationData);
		});
	}

}

export default EndableAction;
