import {describe, expect, test} from 'vitest';
import {forbidVideoOptions} from '@/tools/schema-tools/video-options-rule.ts';

// ajv is a devDependency; a missing install fails this file
const ajvModule: any = await import('ajv');
const AjvClass: any = ajvModule.default ?? ajvModule;

// Shaped like the generated definitions in jsonschema/eligius-configuration.json,
// so this spec does not depend on a generated file
function positionSourceProperties() {
  return {
    systemName: {type: 'string'},
    selector: {type: 'string'},
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {src: {type: 'string'}, type: {type: 'string'}},
        required: ['src', 'type'],
        additionalProperties: false,
      },
    },
    poster: {type: 'string'},
  };
}

function createDefinitions(): Record<string, any> {
  return {
    IPositionSourceConfig: {
      type: 'object',
      properties: positionSourceProperties(),
      required: ['systemName'],
      additionalProperties: {description: 'Additional configuration options.'},
    },
    'Partial<IPositionSourceConfig>': {
      type: 'object',
      properties: positionSourceProperties(),
      additionalProperties: {description: 'Additional configuration options.'},
    },
  };
}

function createValidator() {
  const definitions = createDefinitions();
  forbidVideoOptions(definitions);
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      type: {$ref: '#/definitions/IPositionSourceConfig'},
      override: {$ref: '#/definitions/Partial%3CIPositionSourceConfig%3E'},
    },
    definitions,
  };
  const ajv = new AjvClass({strict: false, allErrors: true});
  return ajv.compile(schema);
}

function errorPaths(validate: any): string[] {
  return (validate.errors ?? []).map((error: any) => error.instancePath);
}

const VIDEO = {
  systemName: 'VideoPositionSource',
  selector: '#video',
  sources: [{src: '/a.mp4', type: 'video/mp4'}],
};

describe('forbidVideoOptions', () => {
  test('given both position source definitions, when forbidVideoOptions runs, then a VideoPositionSource with options fails validation at /type/options', () => {
    const validate = createValidator();

    const valid = validate({type: {...VIDEO, options: {controls: true}}});

    expect(valid).toBe(false);
    expect(errorPaths(validate)).toContain('/type/options');
  });

  test('given the rule, when a VideoPositionSource has selector, sources and poster, then it validates', () => {
    const validate = createValidator();

    const valid = validate({type: {...VIDEO, poster: '/a.jpg'}});

    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  test('given the rule, when a RafPositionSource has options, then it validates', () => {
    const validate = createValidator();

    const valid = validate({
      type: {systemName: 'RafPositionSource', options: {fps: 30}},
    });

    expect(valid).toBe(true);
  });

  test('given the rule, when an override names VideoPositionSource and has options, then it fails at /override/options', () => {
    const validate = createValidator();

    const valid = validate({
      override: {systemName: 'VideoPositionSource', options: {}},
    });

    expect(valid).toBe(false);
    expect(errorPaths(validate)).toContain('/override/options');
  });

  test('given the rule, when an override without systemName has options, then it validates (the resolver rejects it, R04)', () => {
    const validate = createValidator();

    const valid = validate({override: {options: {}}});

    expect(valid).toBe(true);
  });

  test('given definitions without IPositionSourceConfig, when forbidVideoOptions runs, then it throws naming the definition', () => {
    const definitions = createDefinitions();
    delete definitions.IPositionSourceConfig;

    expect(() => forbidVideoOptions(definitions)).toThrow(
      /IPositionSourceConfig/
    );
  });

  test('given a definition that already has if, when forbidVideoOptions runs, then it throws', () => {
    const definitions = createDefinitions();
    definitions.IPositionSourceConfig.if = {required: ['selector']};

    expect(() => forbidVideoOptions(definitions)).toThrow(/if\/then/);
  });
});
