import uuid from 'uuid';
import * as operations from '../../operation';

class ActionCreatorFactory {

    configfactory = null;

    constructor(configfactory) {
        this.configfactory = configfactory;
    }

    createAction(name) {
        const creator = new ActionCreator(this, name);
        this.configfactory.addAction(creator.actionConfig);
        return creator;
    }

    createInitAction(name) {
        const creator = new EndableActionCreator(this, name);
        this.configfactory.addInitAction(creator.actionConfig);
        return creator;
    }

    createEventAction(name) {
        const creator = new ActionCreator(this, name);
        this.configfactory.addEventAction(creator.actionConfig);
        return creator;
    }

    createTimelineAction(uri, name) {
        const creator = new TimelineActionCreator(this, name);
        this.configfactory.addTimelineAction(uri, creator.actionConfig);
        return creator;
    }

    end() {
        return this.configfactory;
    }
}

class ActionCreator {

    actionConfig = null;
    factory = null;

    constructor(factory, name) {
        this.factory = factory;
        this.actionConfig = {
            id: uuid(),
            startOperations: []
        };
        if (name) {
            this.actionConfig.name = name;
        }
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

class EndableActionCreator extends ActionCreator {

    constructor(factory, name) {
        super(factory, name);
    }

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

class TimelineActionCreator extends EndableActionCreator {

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

export default ActionCreatorFactory;
