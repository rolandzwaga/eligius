import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test} from 'vitest';
import {SubtitleEditor} from '../../../../configuration/api/index.ts';

type SubtitleEditorSuiteContext = {
  subtitleEditor: SubtitleEditor;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe.concurrent<SubtitleEditorSuiteContext>('SubtitleEditor', () => {
  beforeEach(context => {
    withContext<SubtitleEditorSuiteContext>(context);

    context.subtitleEditor = new SubtitleEditor();
  });
  test<SubtitleEditorSuiteContext>('Should add empty collections for each language', ({
    subtitleEditor,
  }) => {
    subtitleEditor.addLanguage('en-US').addLanguage('nl-NL');

    const collection = subtitleEditor.export();

    expect(collection[0].languageCode).to.equal('en-US');
    expect(collection[1].languageCode).to.equal('nl-NL');
  });
  test<SubtitleEditorSuiteContext>('Should add subtitle for given duration and languages', ({
    subtitleEditor,
  }) => {
    subtitleEditor.addLanguage('nl-NL').addLanguage('en-US').addSubtitles(
      {start: 0, end: 5},
      {
        'nl-NL': 'Foe',
        'en-US': 'Foo',
      }
    );

    const collection = subtitleEditor.export();

    expect(collection[0].titles[0].duration).to.eql({start: 0, end: 5});
    expect(collection[1].titles[0].duration).to.eql({start: 0, end: 5});
    expect(collection[0].titles[0].text).to.equal('Foe');
    expect(collection[1].titles[0].text).to.equal('Foo');
  });
  test<SubtitleEditorSuiteContext>('Should throw when duplicate language is added', ({
    subtitleEditor,
  }) => {
    expect(() =>
      subtitleEditor.addLanguage('nl-NL').addLanguage('nl-NL')
    ).to.throw('Language nl-NL already exists.');
  });
});
