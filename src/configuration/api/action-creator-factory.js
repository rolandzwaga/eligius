import uuid from 'uuid';
import * as operations from '../../operation';

export class ActionCreatorFactory {

    configfactory = null;

    constructor(configfactory) {
        this.configfactory = configfactory;
    }

    createAction(name) {
        const creator = new ActionCreator(name, this);
        this.configfactory.addAction(creator.actionConfig);
        return creator;
    }

    createInitAction(name) {
        const creator = new EndableActionCreator(name, this);
        this.configfactory.addInitAction(creator.actionConfig);
        return creator;
    }

    createEventAction(name) {
        const creator = new ActionCreator(name, this);
        this.configfactory.addEventAction(creator.actionConfig);
        return creator;
    }

    createTimelineAction(uri, name) {
        const creator = new TimelineActionCreator(name, this);
        this.configfactory.addTimelineAction(uri, creator.actionConfig);
        return creator;
    }

    end() {
        return this.configfactory;
    }
}

export class ActionCreator {

    actionConfig = null;
    factory = null;

    constructor(name, factory) {
        this.factory = factory;
        this.actionConfig = {
            id: uuid(),
            startOperations: []
        };
        if (name) {
            this.actionConfig.name = name;
        }
    }

    setName(name) {
        this.actionConfig.name = name;
        return this;
    }

    getConfiguration(callBack) {
        const copy = deepcopy(this.actionConfig);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.actionConfig = newConfig;
        }
        return this;
    }

    addStartOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }

        const { startOperations } = this.actionConfig;
        startOperations.push({
            id: uuid(),
            systemName: systemName,
            operationData: operationData
        });
        return this;
    }

    next() {
        return this.factory;
    }
}

export class EndableActionCreator extends ActionCreator {

    addEndOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }

        let { endOperations } = this.actionConfig;
        if (endOperations) {
            endOperations = this.actionConfig.endOperations = [];
        }
        endOperations.push({
            id: uuid(),
            systemName: systemName,
            operationData: operationData
        });
        return this;
    }
}

export class TimelineActionCreator extends EndableActionCreator {

    addDuration(start, end) {
        this.actionConfig.duration = {
            start: start
        };
        if (end) {
            this.actionConfig.duration.end = end;
        }
        return this;
    }
}
