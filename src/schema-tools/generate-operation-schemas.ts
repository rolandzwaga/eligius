import fs from 'fs';
import { emptyDirSync } from 'fs-extra';
import path from 'path';
import * as controllers from '../controllers';
import * as metadata from '../operation/metadata';
import {
  IOperationMetadata,
  TComplexProperyMetadata,
  THasDescription,
  THasRequired,
  TParameterTypes,
  TPropertiesMetadata,
  TPropertyMetadata,
} from '../operation/metadata/types';
import camelCaseToDash from '../util/camel-case-to-dash';
import dashToCamelCase from '../util/dash-to-camel-case';
import { htmlTagNames } from './html-tag-names';

const schemaDirectory = path.join(process.cwd(), 'jsonschema');
const outputDirectory = path.join(schemaDirectory, 'operations');
emptyDirSync(outputDirectory);

const operationSchemas = Object.entries(metadata).map(generateOperationSchema);
operationSchemas.forEach(([name, schema]) => {
  fs.writeFileSync(
    path.join(outputDirectory, `${name}.json`),
    JSON.stringify(schema, null, 2)
  );
  console.log(`${name}.json was written`);
});

const operationSchemaPaths = operationSchemas
  .map(([name]) => name)
  .map((name) => ({ $ref: `/operations/${name}.json` }));

['endable-action.json', 'event-action.json', 'timeline-action.json'].forEach(
  (x) => saveOperations(x, operationSchemaPaths)
);

function saveOperations(filename: string, schemaPaths: any[]) {
  const actionSchema = JSON.parse(
    fs.readFileSync(path.join(schemaDirectory, filename), {
      encoding: 'utf-8',
    })
  );

  actionSchema.properties.startOperations.items.anyOf = schemaPaths;
  if (actionSchema.properties.endOperations) {
    actionSchema.properties.endOperations.items.anyOf = schemaPaths;
  }

  fs.writeFileSync(
    path.join(schemaDirectory, filename),
    JSON.stringify(actionSchema, null, 2),
    { encoding: 'utf-8' }
  );

  console.log(`${filename} was written`);
}

/* ---------- functions ------------*/

function getTemplate() {
  return {
    definitions: {},
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'http://eligius.com/schema/operation.json',
    type: 'object',
    title: '',
    description: '',
    required: ['systemName', 'operationData'],
    properties: {
      id: {
        $id: '#/properties/id',
        type: 'string',
        title: 'The Id Schema',
        examples: ['123e4567-e89b-12d3-a456-426614174000'],
        pattern:
          '^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$',
      },
      systemName: {
        $id: '#/properties/systemName',
        const: '',
      },
      operationData: {
        $id: '#/properties/operationData',
        type: 'object',
        title: 'The Operationdata Schema',
        required: [],
        properties: {},
      },
    },
  };
}

function generateOperationSchema([name, getMetadata]: [
  string,
  () => IOperationMetadata<any>
]) {
  const metadata = getMetadata();
  const schemaTemplate = getTemplate();
  schemaTemplate.title = `The ${name} schema`;
  schemaTemplate.properties.systemName.const = name;
  schemaTemplate.description = metadata.description;

  if (metadata.properties) {
    schemaTemplate.properties.operationData.properties = Object.entries(
      metadata.properties
    ).reduce(
      (acc: any, [name, value]: [string, any]) => ({
        ...acc,
        ...generateProperty(name, value),
      }),
      schemaTemplate.properties.operationData.properties
    );

    (schemaTemplate.properties.operationData.required as any[]) =
      generateRequiredPropertyNames(metadata.properties);
  } else {
    delete (schemaTemplate.properties as any).operationData;
  }

  return [camelCaseToDash(name), schemaTemplate];
}

function generateRequiredPropertyNames(properties: TPropertiesMetadata<any>) {
  return Object.entries(properties)
    .filter((value: [string, any]): value is [string, THasRequired] =>
      hasRequired(value[1])
    )
    .filter((value: [string, any]) => value[1].required)
    .map((value: [string, any]) => value[0]);
}

function generateProperty(name: string, propertyMetadata: TPropertyMetadata) {
  const result: any = {
    [name]: {
      $id: `#/properties/operationData/${name}`,
      description: getPropertyDescription(propertyMetadata),
    },
  };

  const type = generateSchemaType(propertyMetadata);
  if (typeof type === 'object' && 'enum' in type) {
    result[name] = { ...type, ...result[name] };
  } else {
    result[name].type = type;
  }

  const pattern = generateSchemaPattern(propertyMetadata);
  if (pattern) {
    result[name].pattern = pattern;
  }

  return result;
}

function getPropertyDescription(metadata: TPropertyMetadata) {
  if (hasDescription(metadata)) {
    return metadata.description;
  }
  return undefined;
}

function generateSchemaType(metadata: TPropertyMetadata) {
  if (isString(metadata)) {
    return metadataType2SchemaType(metadata);
  }
  if (isComplex(metadata)) {
    return metadataType2SchemaType(metadata.type);
  }
  return 'unknown';
}

function generateSchemaPattern(metadata: TPropertyMetadata) {
  if (isString(metadata)) {
    return metadataType2SchemaPattern(metadata);
  }
  if (isComplex(metadata)) {
    return metadataType2SchemaPattern(metadata.type);
  }
  return undefined;
}

function hasRequired(value: any): value is THasRequired {
  return typeof value === 'object' && 'required' in value;
}

function hasDescription(value: any): value is THasDescription {
  return typeof value === 'object' && 'description' in value;
}

function isComplex(value: TPropertyMetadata): value is TComplexProperyMetadata {
  return typeof value === 'object' && 'type' in value;
}

function isString(value: TPropertyMetadata): value is TParameterTypes {
  return typeof value === 'string';
}

function metadataType2SchemaType(value: TParameterTypes) {
  switch (value) {
    case 'ParameterType:htmlElementName':
      return { type: 'string', enum: htmlTagNames };
    case 'ParameterType:controllerName':
      return {
        type: 'string',
        enum: Object.keys(controllers).map(dashToCamelCase).map(capitalize),
      };
    case 'ParameterType:QuadrantPosition':
      return {
        type: 'string',
        enum: ['top', 'left', 'right', 'bottom'],
      };
    case 'ParameterType:className':
    case 'ParameterType:selector':
    case 'ParameterType:string':
    case 'ParameterType:eventTopic':
    case 'ParameterType:eventName':
    case 'ParameterType:systemName':
    case 'ParameterType:actionName':
    case 'ParameterType:url':
    case 'ParameterType:htmlContent':
    case 'ParameterType:labelId':
    case 'ParameterType:ImagePath':
    case 'ParameterType:dimensionsModifier':
      return 'string';
    case 'ParameterType:number':
      return 'number';
    case 'ParameterType:object':
    case 'ParameterType:dimensions':
    case 'ParameterType:jQuery':
      return 'object';
    case 'ParameterType:boolean':
      return 'boolean';
    case 'ParameterType:array':
      return 'array';
  }
}

function metadataType2SchemaPattern(value: TParameterTypes) {
  switch (value) {
    case 'ParameterType:className':
      return '.-?[_a-zA-Z]+[_a-zA-Z0-9-]*';
    default:
      return undefined;
  }
}

function capitalize(value: string) {
  return `${value[0].toUpperCase()}${value.substring(1)}`;
}
