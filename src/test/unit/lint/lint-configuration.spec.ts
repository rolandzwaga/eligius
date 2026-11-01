import {lintConfiguration} from '@lint/lint-configuration.ts';
import type {ILintDiagnostic} from '@lint/types.ts';
import {
  createValidConfiguration,
  endableAction,
  eventAction,
  FIRST_TIMELINE_ACTION,
  FIRST_START_OPERATIONS as OPS,
  op,
  withTimelineAction,
} from '@test/fixtures/lint-configuration-factory.ts';
import {describe, expect, test} from 'vitest';

function codes(diagnostics: ILintDiagnostic[]) {
  return diagnostics.map(diagnostic => diagnostic.code);
}

function only(diagnostics: ILintDiagnostic[], code: string) {
  const matching = diagnostics.filter(diagnostic => diagnostic.code === code);
  expect(
    matching,
    `expected exactly one ${code} in ${JSON.stringify(diagnostics, null, 1)}`
  ).toHaveLength(1);
  return matching[0];
}

describe('lintConfiguration', () => {
  describe('resolver errors (E001)', () => {
    test('given a valid configuration, when linted, then there are no diagnostics', () => {
      expect(lintConfiguration(createValidConfiguration())).toEqual([]);
    });

    test('given a misspelled operation, when linted, then E001 carries the resolver message, its path and the did-you-mean hint', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([op('selectElemen', {selector: '#a'})])
      );
      expect(diagnostics).toEqual([
        {
          code: 'E001',
          severity: 'error',
          path: `${OPS}[0].systemName`,
          message: `Unknown operation 'selectElemen' at ${OPS}[0].systemName. Did you mean 'selectElement'?`,
        },
      ]);
    });

    test('given a controller used as an operation, when linted, then E001 points to addControllerToElement', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([op('LabelController')])
      );
      expect(only(diagnostics, 'E001').message).toContain(
        "'LabelController' is a controller, not an operation"
      );
    });

    test('given a custom operation, when it is declared in the options, then it is accepted, and otherwise it is reported', () => {
      const configuration = withTimelineAction([op('trackEvent', {name: 'x'})]);
      expect(
        lintConfiguration(configuration, {customOperations: ['trackEvent']})
      ).toEqual([]);
      expect(codes(lintConfiguration(configuration))).toEqual(['E001']);
    });

    test('given a custom position source, when it is declared in the options, then the override is accepted', () => {
      const configuration = createValidConfiguration();
      configuration.timelines[0].positionSource = {
        systemName: 'MyPositionSource',
      };
      expect(codes(lintConfiguration(configuration))).toEqual(['E001']);
      expect(only(lintConfiguration(configuration), 'E001').path).toBe(
        'timelines[0].positionSource.systemName'
      );
      expect(
        lintConfiguration(configuration, {
          customProviders: ['MyPositionSource'],
        })
      ).toEqual([]);
    });

    test('given a custom function and controller declared in the options, when used as an operation, then the resolver message names their kind', () => {
      const configuration = withTimelineAction([op('formatPrice')]);
      expect(
        only(
          lintConfiguration(configuration, {customFunctions: ['formatPrice']}),
          'E001'
        ).message
      ).toContain("'formatPrice' is a custom function, not an operation");
      expect(
        only(
          lintConfiguration(withTimelineAction([op('Confetti')]), {
            customControllers: ['Confetti'],
          }),
          'E001'
        ).message
      ).toContain("'Confetti' is a controller, not an operation");
    });

    test('given template: and json: placeholders, when no templates or json option is given, then every name is accepted', () => {
      const configuration = withTimelineAction([
        op('setOperationData', {properties: {data: 'json:settings'}}),
      ]);
      configuration.layoutTemplate = 'template:layout';
      expect(lintConfiguration(configuration)).toEqual([]);
    });

    test('given a templates option, when a placeholder names a template it does not have, then E001 suggests the closest one', () => {
      const configuration = createValidConfiguration();
      configuration.layoutTemplate = 'template:layout';
      expect(lintConfiguration(configuration, {templates: ['layout']})).toEqual(
        []
      );
      expect(
        lintConfiguration(configuration, {templates: {layout: '<p>'}})
      ).toEqual([]);
      expect(
        only(lintConfiguration(configuration, {templates: ['layouts']}), 'E001')
      ).toEqual({
        code: 'E001',
        severity: 'error',
        path: 'layoutTemplate',
        message:
          "Unable to resolve placeholder 'template:layout' at layoutTemplate: eligius/lint: unknown template 'layout'. Did you mean 'layouts'?",
      });
      expect(
        only(lintConfiguration(configuration, {templates: []}), 'E001').message
      ).toContain("Add it to the 'templates' lint option.");
    });

    test('given a json option as a map, when a config: placeholder points into the imported value, then it resolves like at runtime', () => {
      const configuration = withTimelineAction([
        op('setOperationData', {
          properties: {
            data: 'json:settings',
            title: 'config:engine.systemName',
          },
        }),
      ]);
      expect(
        lintConfiguration(configuration, {json: {settings: {a: 1}}})
      ).toEqual([]);
      expect(
        only(lintConfiguration(configuration, {json: {setting: {}}}), 'E001')
          .message
      ).toContain("unknown JSON value 'settings'. Did you mean 'setting'?");
    });

    test('given a configuration with placeholders, when linted, then the configuration is not changed', () => {
      const configuration = createValidConfiguration();
      configuration.layoutTemplate = 'template:layout';
      configuration.containerSelector = 'config:timelines[0].selector';
      const before = JSON.stringify(configuration);
      lintConfiguration(configuration, {templates: {layout: '<p>'}});
      expect(JSON.stringify(configuration)).toBe(before);
    });

    test('given a value that is not an object, when linted, then a single E001 without a path describes it', () => {
      expect(lintConfiguration(null as any)).toEqual([
        {
          code: 'E001',
          severity: 'error',
          path: '',
          message: 'The configuration must be an object, got null.',
        },
      ]);
      expect(lintConfiguration([] as any)[0].message).toBe(
        'The configuration must be an object, got an array.'
      );
    });

    test('given a resolver error and rule findings, when linted, then the resolver error comes first and the rules still run', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([op('nope'), op('endWhen')])
      );
      expect(codes(diagnostics)).toEqual(['E001', 'E101']);
    });
  });

  describe('control flow (E101)', () => {
    test('given an endWhen without a when, when linted, then E101 names the operation and the runtime consequence', () => {
      const diagnostic = only(
        lintConfiguration(withTimelineAction([op('endWhen')])),
        'E101'
      );
      expect(diagnostic).toEqual({
        code: 'E101',
        severity: 'error',
        path: `${OPS}[0].systemName`,
        message:
          'endWhen at index 0 has no open when to close. The engine pops the wrong scope at runtime, and the action fails or runs with the wrong data.',
      });
    });

    test('given the crossing shape the fuzzer found, when linted, then both problems are reported', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('when', {expression: 'false'}),
          op('forEach', {collection: [1, 2]}),
          op('otherwise'),
          op('endForEach'),
          op('endWhen'),
        ])
      );
      expect(diagnostics.map(d => [d.code, d.path])).toEqual([
        ['E101', `${OPS}[2].systemName`],
      ]);
    });

    test('given problems in every kind of list, when linted, then each list is checked', () => {
      const configuration = withTimelineAction([], [op('endForEach')]);
      configuration.initActions.push(
        endableAction([op('when', {expression: 'true'})])
      );
      configuration.actions.push(endableAction([], [op('breakForEach')]));
      configuration.eventActions?.push(eventAction([op('otherwise')]));
      expect(lintConfiguration(configuration).map(d => d.path)).toEqual([
        'initActions[0].startOperations[0].systemName',
        'actions[0].endOperations[0].systemName',
        'eventActions[0].startOperations[0].systemName',
        `${FIRST_TIMELINE_ACTION}.endOperations[0].systemName`,
      ]);
    });
  });

  describe('required properties (E111, W111)', () => {
    test('given selectElement without a selector in a timeline action, when linted, then E111 is reported at its operation data', () => {
      const diagnostic = only(
        lintConfiguration(withTimelineAction([op('selectElement')])),
        'E111'
      );
      expect(diagnostic).toEqual({
        code: 'E111',
        severity: 'error',
        path: `${OPS}[0].operationData`,
        message:
          "selectElement: 'selector' is required, and neither its operation data nor an operation before it in this list provides it.",
      });
    });

    test('given the required property set by an earlier setOperationData or setData, when linted, then nothing is reported', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('setOperationData', {properties: {selector: '#a'}}),
            op('selectElement'),
            op('setData', {properties: {'$operationdata.className': 'x'}}),
            op('addClass'),
          ])
        )
      ).toEqual([]);
    });

    test('given a required property missing in a lookup action, when linted, then it is the warning W111 because the caller may pass it', () => {
      const configuration = createValidConfiguration();
      configuration.actions.push(endableAction([op('selectElement')]));
      expect(codes(lintConfiguration(configuration))).toEqual(['W111']);
    });

    test('given a required property missing after a custom operation, when linted, then it is W111', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([op('prepare'), op('selectElement')]),
        {customOperations: ['prepare']}
      );
      expect(codes(diagnostics)).toEqual(['W111']);
    });

    test('given a required property that is present but undefined, when linted, then it counts as missing', () => {
      expect(
        codes(
          lintConfiguration(
            withTimelineAction([op('selectElement', {selector: undefined})])
          )
        )
      ).toEqual(['E111']);
    });
  });

  describe('literal unions (E120)', () => {
    test('given a calc operator outside the union, when linted, then E120 lists the allowed values', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([op('calc', {left: 1, right: 2, operator: '^'})])
        ),
        'E120'
      );
      expect(diagnostic.path).toBe(`${OPS}[0].operationData.operator`);
      expect(diagnostic.message).toBe(
        "calc: 'operator' must be one of '+', '-', '*', '/', '%', '**', got '^'."
      );
    });

    test('given a union value given as a property chain, when linted, then it is not checked', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('setOperationData', {properties: {operator: '+'}}),
            op('calc', {
              left: 1,
              right: 2,
              operator: '$operationdata.operator',
            }),
          ])
        )
      ).toEqual([]);
    });
  });

  describe('when expressions (E130, E131)', () => {
    test('given an expression that does not parse, when linted, then E130 carries the parser message', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([op('when', {expression: '1==1)'}), op('endWhen')])
        ),
        'E130'
      );
      expect(diagnostic.path).toBe(`${OPS}[0].operationData.expression`);
      expect(diagnostic.message).toBe(
        "when: unexpected ')' at position 4 in expression '1==1)'. It has no matching '('."
      );
    });

    test('given an unknown operand, when linted, then it is E131', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([
            op('when', {expression: 'foo==1'}),
            op('endWhen'),
          ])
        ),
        'E131'
      );
      expect(diagnostic.message).toContain("unknown operand 'foo'");
    });

    test('given an expression that is not a string, when linted, then it is E130', () => {
      expect(
        codes(
          lintConfiguration(
            withTimelineAction([op('when', {expression: 5}), op('endWhen')])
          )
        )
      ).toEqual(['E130']);
    });
  });

  describe('property chains (E140) and __proto__ keys (E141)', () => {
    test('given forbidden segments in a chain value, a setData target and a when operand, when linted, then each is E140 at its path', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('setOperationData', {
            properties: {a: '$operationdata.__proto__.x'},
          }),
          op('setData', {properties: {'$scope.constructor.x': 1}}),
          op('when', {expression: '$globaldata.prototype.a==1'}),
          op('endWhen'),
        ])
      );
      expect(diagnostics.map(d => [d.code, d.path])).toEqual([
        ['E140', `${OPS}[0].operationData.properties.a`],
        ['E140', `${OPS}[1].operationData.properties['$scope.constructor.x']`],
        ['E140', `${OPS}[2].operationData.expression`],
      ]);
      expect(diagnostics[0].message).toBe(
        "setOperationData: property chain '$operationdata.__proto__.x' contains forbidden segment '__proto__'. Property chains may not contain __proto__, prototype or constructor."
      );
    });

    test('given a __proto__ key nested in operation data, when linted, then E141 names its path', () => {
      const data = JSON.parse(
        '{"properties": {"a": {"__proto__": {"polluted": true}}}}'
      );
      const diagnostic = only(
        lintConfiguration(withTimelineAction([op('setOperationData', data)])),
        'E141'
      );
      expect(diagnostic.path).toBe(
        `${OPS}[0].operationData.properties.a.__proto__`
      );
    });
  });

  describe('setData targets (E160, W160)', () => {
    test('given unrecognized target roots, when linted, then each is E160 at its key', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('setData', {properties: {'$foo.bar': 1, plain: 2}}),
        ])
      );
      expect(diagnostics.map(d => [d.code, d.path])).toEqual([
        ['E160', `${OPS}[0].operationData.properties['$foo.bar']`],
        ['E160', `${OPS}[0].operationData.properties.plain`],
      ]);
      expect(diagnostics[0].message).toBe(
        "setData: unrecognized target '$foo.bar'; a target starts with $scope, $operationdata or $globaldata."
      );
    });

    test('given a reserved scope field as target, when linted, then W160 suggests a variable, and newIndex is allowed', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('setData', {
            properties: {
              '$scope.currentIndex': 3,
              '$scope.newIndex': 3,
              '$scope.variables.x': 1,
            },
          }),
        ])
      );
      expect(diagnostics).toEqual([
        {
          code: 'W160',
          severity: 'warning',
          path: `${OPS}[0].operationData.properties['$scope.currentIndex']`,
          message:
            "setData: '$scope.currentIndex' overwrites 'currentIndex', which the engine uses to run the action. Use $scope.variables.currentIndex for your own value.",
        },
      ]);
    });
  });

  describe('requestAction names (E310)', () => {
    test('given a name no action has, when linted, then E310 suggests the closest action name', () => {
      const configuration = withTimelineAction([
        op('requestAction', {systemName: 'ShowTitel'}),
      ]);
      configuration.actions.push(endableAction([], [], 'ShowTitle'));
      configuration.eventActions?.push(eventAction([], 'x', 'OnClick'));
      const diagnostic = only(lintConfiguration(configuration), 'E310');
      expect(diagnostic).toEqual({
        code: 'E310',
        severity: 'error',
        path: `${OPS}[0].operationData.systemName`,
        message:
          "requestAction: there is no action named 'ShowTitel'. Did you mean 'ShowTitle'?",
      });
    });

    test('given names of actions and event actions, when requested, then both are accepted', () => {
      const configuration = withTimelineAction([
        op('requestAction', {systemName: 'ShowTitle'}),
        op('requestAction', {systemName: 'OnClick'}),
      ]);
      configuration.actions.push(endableAction([], [], 'ShowTitle'));
      configuration.eventActions?.push(eventAction([], 'x', 'OnClick'));
      expect(lintConfiguration(configuration)).toEqual([]);
    });

    test('given a chain as the requested name, when linted, then it is not E310 but W150, because requestAction does not resolve chains', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('setOperationData', {properties: {name: 'OnClick'}}),
          op('requestAction', {systemName: '$operationdata.name'}),
        ])
      );
      expect(codes(diagnostics)).toEqual(['W150']);
    });

    test('given no actions at all, when a name is requested, then the message says where names come from', () => {
      expect(
        only(
          lintConfiguration(
            withTimelineAction([op('requestAction', {systemName: 'X'})])
          ),
          'E310'
        ).message
      ).toBe(
        "requestAction: there is no action named 'X'. Action names come from actions[].name and eventActions[].name."
      );
    });
  });

  describe('dependencies (W110)', () => {
    test('given addClass without a selected element, when linted, then W110 names the operations that provide it', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([op('addClass', {className: 'a'})])
        ),
        'W110'
      );
      expect(diagnostic.path).toBe(`${OPS}[0]`);
      expect(diagnostic.message).toMatch(
        /^addClass: 'selectedElement' must be provided by an earlier operation in this list, but none before it provides it\. Operations that provide it: .*selectElement/
      );
    });

    test('given selectElement before addClass, also inside a when, when linted, then nothing is reported', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('when', {expression: 'true'}),
            op('selectElement', {selector: '#a'}),
            op('endWhen'),
            op('addClass', {className: 'a'}),
          ])
        )
      ).toEqual([]);
    });

    test('given a lookup action or an event action, when a dependency is missing, then nothing is reported because the caller may pass it', () => {
      const configuration = createValidConfiguration();
      configuration.actions.push(
        endableAction([op('addClass', {className: 'a'})])
      );
      configuration.eventActions?.push(
        eventAction([op('addClass', {className: 'a'})])
      );
      expect(lintConfiguration(configuration)).toEqual([]);
    });

    test('given the dependency in the operation data itself, when linted, then nothing is reported', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('addClass', {className: 'a', selectedElement: {}}),
          ])
        )
      ).toEqual([]);
    });
  });

  describe('unresolved chains (W150) and unknown reads (W151)', () => {
    test('given a chain in a field the operation does not resolve, when linted, then W150 explains it is passed on as text', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([
            op('selectElement', {selector: '#a'}),
            op('setOperationData', {properties: {cls: 'x'}}),
            op('addClass', {className: '$operationdata.cls'}),
          ])
        ),
        'W150'
      );
      expect(diagnostic).toEqual({
        code: 'W150',
        severity: 'warning',
        path: `${OPS}[2].operationData.className`,
        message:
          "addClass: '$operationdata.cls' in 'className' is passed on as text, addClass does not resolve property chains in 'className'. Resolve it first with setOperationData, or use a literal value.",
      });
    });

    test('given chains nested in a resolving field and in a non-resolving one, when linted, then only the latter is reported', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('setOperationData', {properties: {href: '/a', items: [1]}}),
          op('createElement', {
            elementName: 'a',
            attributes: {href: '$operationdata.href'},
          }),
          op('broadcastEvent', {
            eventName: 'x',
            eventArgs: ['$operationdata.items'],
            eventTopic: '$operationdata.href',
          }),
        ])
      );
      expect(diagnostics.map(d => [d.code, d.path])).toEqual([
        ['W150', `${OPS}[2].operationData.eventTopic`],
      ]);
    });

    test('given a custom operation with a chain, when linted, then nothing is reported because it may resolve it', () => {
      expect(
        lintConfiguration(
          withTimelineAction([op('trackEvent', {name: '$globaldata.user'})]),
          {
            customOperations: ['trackEvent'],
          }
        )
      ).toEqual([]);
    });

    test('given a read of a property nothing provides, when linted, then W151 names the property', () => {
      const diagnostic = only(
        lintConfiguration(
          withTimelineAction([
            op('setOperationData', {
              properties: {a: '$operationdata.missing.deep'},
            }),
          ])
        ),
        'W151'
      );
      expect(diagnostic).toEqual({
        code: 'W151',
        severity: 'warning',
        path: `${OPS}[0].operationData.properties.a`,
        message:
          "setOperationData: '$operationdata.missing.deep' reads 'missing' from the operation data, but no operation before it in this list provides 'missing'.",
      });
    });

    test('given reads in when operands, setData values, setData target paths and forEach collections, when nothing provides them, then each is W151', () => {
      const diagnostics = lintConfiguration(
        withTimelineAction([
          op('when', {expression: '$operationdata.flag==1'}),
          op('endWhen'),
          op('setData', {
            properties: {
              '$globaldata.x': '$operationdata.value',
              '$operationdata.nested.key': 1,
            },
          }),
          op('forEach', {collection: '$operationdata.items'}),
          op('endForEach'),
        ])
      );
      expect(diagnostics.map(d => [d.code, d.path])).toEqual([
        ['W151', `${OPS}[0].operationData.expression`],
        ['W151', `${OPS}[2].operationData.properties['$globaldata.x']`],
        [
          'W151',
          `${OPS}[2].operationData.properties['$operationdata.nested.key']`,
        ],
        ['W151', `${OPS}[3].operationData.collection`],
      ]);
    });

    test('given reads of properties provided by output properties, configured data, setData, globals or the operation itself, when linted, then nothing is reported', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('selectElement', {selector: '#a', keep: 1}),
            op('setData', {properties: {'$operationdata.flag': true}}),
            op('addGlobalsToOperation', {globalProperties: ['user']}),
            op('setOperationData', {
              properties: {
                a: '$operationdata.selectedElement',
                b: '$operationdata.keep',
                c: '$operationdata.flag',
                d: '$operationdata.user',
                e: '$OperationData.selectedElement',
              },
              own: 2,
            }),
            op('calc', {left: '$operationdata.own', right: 1, operator: '+'}),
            op('calc', {
              left: '$operationdata.calculationResult',
              right: '$operationdata.self',
              operator: '+',
              self: 3,
            }),
          ])
        )
      ).toEqual([]);
    });

    test('given a read after customFunction, startAction or an undescribed operation, when linted, then nothing is reported', () => {
      const configuration = withTimelineAction([
        op('customFunction', {systemName: 'fill'}),
        op('setOperationData', {properties: {a: '$operationdata.anything'}}),
      ]);
      expect(
        lintConfiguration(configuration, {customFunctions: ['fill']})
      ).toEqual([]);
    });

    test('given $globaldata and $scope reads, when linted, then they are never W151', () => {
      expect(
        lintConfiguration(
          withTimelineAction([
            op('setOperationData', {
              properties: {a: '$globaldata.user', b: '$scope.variables.x'},
            }),
          ])
        )
      ).toEqual([]);
    });
  });
});
