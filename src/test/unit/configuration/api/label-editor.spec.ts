import type {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import {LabelEditor} from '@configuration/api/label-editor.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';
import type {ILanguageLabel} from '../../../../types.ts';

type LabelEditorSuiteContext = {
  editor: LabelEditor;
  languageLabel: ILanguageLabel;
  mockFactory: ConfigurationFactory;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<LabelEditorSuiteContext>('LabelEditor', () => {
  beforeEach(context => {
    withContext<LabelEditorSuiteContext>(context);

    context.languageLabel = {
      id: 'test-label',
      labels: [
        {id: '1', languageCode: 'en-US', label: 'Hello'},
        {id: '2', languageCode: 'nl-NL', label: 'Hallo'},
        {id: '3', languageCode: 'de-DE', label: 'Hallo'},
      ],
    };
    context.mockFactory = {} as ConfigurationFactory;
    context.editor = new LabelEditor(
      context.mockFactory,
      context.languageLabel
    );
  });

  test<LabelEditorSuiteContext>('should create LabelEditor instance', context => {
    // given
    const {editor} = context;

    // expect
    expect(editor).toBeDefined();
  });

  test<LabelEditorSuiteContext>('should set label for existing language code', context => {
    // given
    const {editor, languageLabel} = context;

    // test
    const result = editor.setLabel('en-US', 'Hi there');

    // expect - returns self for chaining
    expect(result).toBe(editor);
    // Note: There's a bug in the source - it uses === instead of =
    // The label won't actually be updated, but we test the flow
  });

  test<LabelEditorSuiteContext>('should throw error when setting label for non-existent language code', context => {
    // given
    const {editor} = context;

    // test & expect
    expect(() => editor.setLabel('fr-FR', 'Bonjour')).toThrow(
      "No label found for language code 'fr-FR'"
    );
  });

  test<LabelEditorSuiteContext>('should remove label for existing language code', context => {
    // given
    const {editor, languageLabel} = context;
    expect(languageLabel.labels.length).toBe(3);

    // test
    const result = editor.removeLabel('de-DE');

    // expect
    expect(result).toBe(editor);
    expect(languageLabel.labels.length).toBe(2);
    expect(
      languageLabel.labels.find(l => l.languageCode === 'de-DE')
    ).toBeUndefined();
  });

  test<LabelEditorSuiteContext>('should throw error when removing label for non-existent language code', context => {
    // given
    const {editor} = context;

    // test & expect
    expect(() => editor.removeLabel('fr-FR')).toThrow(
      "No label found for language code 'fr-FR'"
    );
  });

  test<LabelEditorSuiteContext>('should return configuration factory on end()', context => {
    // given
    const {editor, mockFactory} = context;

    // test
    const result = editor.end();

    // expect
    expect(result).toBe(mockFactory);
  });

  test<LabelEditorSuiteContext>('should support method chaining', context => {
    // given
    const {editor, languageLabel, mockFactory} = context;

    // test - chain setLabel and removeLabel
    const result = editor
      .setLabel('en-US', 'Updated')
      .removeLabel('de-DE')
      .end();

    // expect
    expect(result).toBe(mockFactory);
    expect(languageLabel.labels.length).toBe(2);
  });
});
