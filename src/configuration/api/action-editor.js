import uuid from 'uuid';
import * as operations from '../../operation';
import deepcopy from '../../operation/helper/deepcopy';

function array_move(arr, old_index, new_index) {
  if (new_index >= arr.length) {
    new_index = 0;
  } else if (new_index < 0) {
    new_index = arr.length - 1;
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}

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

    const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
    const newConfig = {
      id: uuid(),
      systemName: systemName,
      operationData: operationData,
    };
    startOperations.push(newConfig);
    this.actionConfig.startOperations = startOperations;
    return new OperationEditor(newConfig, this);
  }

  editStartOperation(id) {
    const { startOperations } = this.actionConfig;
    const operation = startOperations.find(o => o.id === id);
    if (operation) {
      return new OperationEditor(operation, this);
    }
    throw new Error(`operation not found for id ${id}`);
  }

  removeStartOperation(id) {
    const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
    const operation = startOperations.find(o => o.id === id);
    const idx = startOperations.indexOf(operation);
    if (idx > -1) {
      startOperations.splice(idx, 1);
      this.actionConfig.startOperations = startOperations;
    }
    return this;
  }

  moveStartOperation(id, direction) {
    const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
    const operation = startOperations.find(o => o.id === id);
    const idx = startOperations.indexOf(operation);
    if (idx > -1) {
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      array_move(startOperations, idx, newIdx);
      this.actionConfig.startOperations = startOperations;
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

    const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
    const newConfig = {
      id: uuid(),
      systemName: systemName,
      operationData: operationData,
    };
    endOperations.push(newConfig);
    this.actionConfig.endOperations = endOperations;
    return new OperationEditor(newConfig, this);
  }

  editEndOperation(id) {
    const { endOperations } = this.actionConfig;
    const operationConfig = endOperations.find(o => o.id === id);
    if (operationConfig) {
      return new OperationEditor(operationConfig, this);
    }
    throw new Error(`operation not found for id ${id}`);
  }

  removeEndOperation(id) {
    const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
    const operation = endOperations.find(o => o.id === id);
    const idx = endOperations.indexOf(operation);
    if (idx > -1) {
      endOperations.splice(idx, 1);
      this.actionConfig.endOperations = endOperations;
    }
    return this;
  }

  moveEndOperation(id, direction) {
    const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
    const operation = endOperations.find(o => o.id === id);
    const idx = endOperations.indexOf(operation);
    if (idx > -1) {
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      array_move(endOperations, idx, newIdx);
      this.actionConfig.endOperations = endOperations;
    }
    return this;
  }
}

export class TimelineActionEditor extends EndableActionEditor {
  setDuration(start, end) {
    if (end != undefined && start > end) {
      throw Error('start position cannot be higher than end position');
    }
    const duration = {
      start,
    };
    if (end) {
      duration.end = end;
    }
    this.actionConfig = {
      ...this.actionConfig,
      duration,
    };
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
    this.operationConfig = {
      ...this.operationConfig,
      systemName,
    };
    return this;
  }

  setOperationData(operationData) {
    this.operationConfig = {
      ...this.operationConfig,
      operationData,
    };
    return this;
  }

  setOperationDataItem(key, value) {
    const { operationData } = this.operationConfig;
    if (!operationData) {
      operationData = {};
    }
    operationData = {
      ...operationData,
      [key]: value,
    };
    return this.setOperationData(operationData);
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
