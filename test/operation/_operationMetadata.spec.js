import { expect } from 'chai';
import * as operations from '../../src/operation';
import * as metadata from '../../src/operation/metadata';
import ParameterTypes from '../../src/operation/metadata/ParameterTypes';
import randomstring from 'randomstring';
import { Eventbus } from '../../src/eventbus';

describe('automatic input and output tests', () => {
  it('should have equal numbers of metadata as operations', () => {
    expect(Object.keys(operations).length).to.equal(Object.keys(metadata).length);
  });

  it('should have equalnames between metadata and operations', () => {
    const operationNames = Object.keys(operations);
    const metadataNames = Object.keys(metadata);
    const isEqual = operationNames.every(name => {
      return metadataNames.includes(name);
    });
    expect(isEqual).to.be.true;
  });

  xit('should have the correct in- and output for all operations based on their metadata', () => {
    const propertyTypes = getAllPropertyTypes(metadata);
    Object.entries(operations).forEach(([name, operation]) => {
      testOperation(name, operation, metadata[name](), propertyTypes);
    });
  });

  function testOperation(operationName, operation, metadataInfo, propertyTypes) {
    const context = {};
    const eventbus = new Eventbus();
    const operationData = initializeOperationData(operationName, metadataInfo, propertyTypes);
    try {
      const result = operation.call(context, operationData, eventbus);
      expect(result).not.to.be.undefined;
      if (metadataInfo.outputProperties) {
        const resultPropertyNames = Object.keys(result);
        const outputPropertyNames = Object.keys(metadataInfo.outputProperties);
        outputPropertyNames.forEach(name => {
          expect(resultPropertyNames.includes(name)).to.be.equal(
            true,
            `${name} was not found on the result operationData: ${resultPropertyNames.join(', ')}`
          );
        });
      }
    } catch (e) {
      console.error(`${operationName} test threw an error`);
      throw e;
    }
  }

  function initializeOperationData(operationName, metadataInfo, propertyTypes) {
    let dependentProps = {};
    let props = {};
    if (metadataInfo.dependentProperties) {
      dependentProps = metadataInfo.dependentProperties.reduce((acc, propertyName) => {
        const type = propertyTypes[propertyName];
        if (!type) {
          throw new Error(
            `${operationName}: property ${propertyName} was not found in list: ${metadataInfo.dependentProperties.join(
              ', '
            )}`
          );
        }
        acc[propertyName] = createPropertyValue(type, propertyName);
        return acc;
      }, {});
    }

    if (metadataInfo.properties) {
      const propertyNames = Object.keys(metadataInfo.properties);
      props = propertyNames.reduce((acc, propertyName) => {
        const type = propertyTypes[propertyName];
        if (!type) {
          throw new Error(
            `${operationName}: property ${propertyName} was not found in list: ${propertyNames.join(', ')}`
          );
        }
        acc[propertyName] = createPropertyValue(type, propertyName);
        return acc;
      }, {});
    }

    return Object.assign(dependentProps, props);
  }

  function createPropertyValue(propertyType, propertyName) {
    if (propertyName === 'selectedElement') {
      return {
        addClass: () => {},
        data: name => [{ name: 'testController' }],
        html: () => {},
        animate: () => {},
        one: () => {},
        empty: () => {},
        innerWidth: () => 10,
        innerHeight: () => 10,
      };
    }
    if (propertyName === 'controllerInstance') {
      return {
        init: () => {},
        attach: () => {},
      };
    }
    if (propertyName === 'actionInstance') {
      return {
        start: () => new Promise(resolve => resolve()),
        end: () => new Promise(resolve => resolve()),
      };
    }
    switch (propertyType) {
      case ParameterTypes.CLASS_NAME:
      case ParameterTypes.HTML_ELEMENT_NAME:
      case ParameterTypes.SELECTOR:
      case ParameterTypes.STRING:
      case ParameterTypes.EVENT_TOPIC:
      case ParameterTypes.EVENT_NAME:
      case ParameterTypes.SYSTEM_NAME:
      case ParameterTypes.ACTION_NAME:
      case ParameterTypes.URL:
      case ParameterTypes.LABEL_ID:
        return randomstring.generate(10);
      case ParameterTypes.CONTROLLER_NAME:
        return 'testController';
      case ParameterTypes.INTEGER:
        return Math.floor(Math.random() * 10);
      case ParameterTypes.OBJECT:
        return {};
      case ParameterTypes.BOOLEAN:
        return Math.random() > 0.5;
      case ParameterTypes.DIMENSIONS_MODIFIER:
        return undefined;
      case ParameterTypes.HTML_CONTENT:
        return '<div>hello</div>';
      case ParameterTypes.ARRAY:
        return [];
      default:
        propertyType;
    }
  }

  function getAllPropertyTypes(metadata) {
    const propTypes = Object.values(metadata).reduce((acc, func) => {
      const mt = func();

      if (mt.properties) {
        Object.entries(mt.properties).forEach(([key, value]) => {
          if (typeof value === 'string') {
            acc[key] = value;
          } else {
            acc[key] = value.defaultValue ? value.defaultValue : value.type;
          }
        });
      }

      if (mt.outputProperties) {
        Object.entries(mt.outputProperties).forEach(([key, value]) => {
          if (typeof value === 'string') {
            acc[key] = value;
          } else {
            acc[key] = value.defaultValue ? value.defaultValue : value.type;
          }
        });
      }

      return acc;
    }, {});
    return propTypes;
  }
});
