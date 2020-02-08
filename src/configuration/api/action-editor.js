import uuid from 'uuid';
import * as operations from '../../operation';
import deepcopy from '../../operation/helper/deepcopy';

export class ActionEditor {
  actionConfig = null;
  configurationFactory = null;

  constructor(actionConfig, configurationFactory) {
    this.actionConfig = actionConfig;
    this.configurationFactory = configurationFactory;
  }

  getConfiguration(callBack) {
    const copy = deepcopy(this.actionConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.actionConfig = newConfig;
    }
    return this;
  }

  setName(name) {
    this.actionConfig.name = name;
    return this;
  }

  getName() {
    return this.actionConfig.name;
  }

  addStartOperation(systemName, operationData) {
    if (!operations[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    const { startOperations } = this.actionConfig;
    const newConfig = {
      id: uuid(),
      systemName: systemName,
      operationData: operationData,
    };
    startOperations.push(newConfig);
    return new OperationEditor(newConfig, this);
  }

  editStartOperation(id) {
    const operation = this.actionConfig.startOperations.find(o => o.id === id);
    if (operation) {
      return new OperationEditor(operation, this);
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
  addEndOperation(systemName, operationData) {
    if (!operations[systemName]) {
      throw Error(`Unknown operation: ${systemName}`);
    }

    let { endOperations } = this.actionConfig;
    if (!endOperations) {
      endOperations = this.actionConfig.endOperations = [];
    }
    const newConfig = {
      id: uuid(),
      systemName: systemName,
      operationData: operationData,
    };
    endOperations.push(newConfig);
    return new OperationEditor(newConfig, this);
  }

  editEndOperation(id) {
    const operationConfig = this.actionConfig.endOperations.find(o => o.id === id);
    if (operationConfig) {
      return new OperationEditor(operationConfig, this);
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
    if (end != undefined && start > end) {
      throw Error('start position cannot be higher than end position');
    }
    this.actionConfig.duration = {
      start: start,
    };
    if (end) {
      this.actionConfig.duration.end = end;
    } else {
      delete this.actionConfig.duration.end;
    }
    return this;
  }
}

export class OperationEditor {
  operationConfig = null;
  actionEditor = null;

  constructor(operationConfig, actionEditor) {
    this.actionEditor = actionEditor;
    this.operationConfig = operationConfig;
  }

  getConfiguration(callBack) {
    const copy = deepcopy(this.operationConfig);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.operationConfig = newConfig;
    }
    return this;
  }

  getSystemName() {
    return this.operationConfig.systemName;
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

  setOperationDataItem(key, value) {
    const { operationData } = this.operationConfig;
    if (!operationData) {
      operationData = this.operationConfig.operationData = {};
    }
    operationData[key] = value;
    return this;
  }

  getOperationDataKeys() {
    const { operationData } = this.operationConfig;
    return operationData ? Object.keys(operationData) : [];
  }

  getOperationDataValue(key) {
    const { operationData } = this.operationConfig;
    return operationData ? operationData[key] : null;
  }

  next() {
    return this.actionEditor;
  }
}
