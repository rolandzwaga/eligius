import * as operations from '../../operation';

export class ActionEditor {
    
    actionConfig = null;
    configurationFactory = null;

    constructor(configurationFactory, actionConfig) {
        this.actionConfig = actionConfig;
        this.configurationFactory = configurationFactory;
    }

    setName(name) {
        this.actionConfig.name = name;
        return this;
    }

    editStartOperation(id) {
        const operation = this.actionConfig.startOperations.find(o => o.id === id);
        if (operation) {
            return new OperationEditor(this, operation);
        }
        throw new Error(`operation not found for id ${id}`);
    }

    removeStartOperation(id) {
        const operation = this.actionConfig.startOperations.find(o => o.id === id);
        const idx = this.actionConfig.startOperations.indexOf(operation);
        if (idx > -1) {
            this.actionConfig.startOperations.splice(idx, 1);
        }
        return this;
    }

    next() {
        return this.configurationFactory;
    }
}

export class EndableActionEditor extends ActionEditor {
    
    editEndOperation(id) {
        const operationConfig = this.actionConfig.endOperations.find(o => o.id === id);
        if (operationConfig) {
            return new OperationEditor(operationConfig);
        }
        throw new Error(`operation not found for id ${id}`);
    }

    removeEndOperation(id) {
        const operation = this.actionConfig.endOperations.find(o => o.id === id);
        const idx = this.actionConfig.endOperations.indexOf(operation);
        if (idx > -1) {
            this.actionConfig.endOperations.splice(idx, 1);
        }
        return this;
    }
}

export class TimelineActionEditor extends EndableActionEditor {
    setDuration(start, end) {
        this.actionConfig.duration = {
            start: start
        };
        if (end) {
            this.actionConfig.duration.end = end;
        }
        return this;
    }
}

export class OperationEditor {

    operationConfig = null;
    actionEditor = null;

    constructor(actionEditor, operationConfig) {
        this.actionEditor = actionEditor;
        this.operationConfig = operationConfig;
    }

    setSystemName(systemName) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        this.operationConfig.systemName = systemName;
        return this;
    }

    setOperationData(operationData) {
        this.operationConfig.operationData = operationData;
        return this;
    }

    next() {
        return this.actionEditor;
    }
}