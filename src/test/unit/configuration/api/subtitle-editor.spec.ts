import { expect } from 'chai';
import { suite } from 'uvu';
import { SubtitleEditor } from '../../../../configuration/api';

const SubtitleEditorSuite = suite<{
  subtitleEditor: SubtitleEditor;
}>('SubtitleEditor');

SubtitleEditorSuite.before.each((context) => {
  context.subtitleEditor = new SubtitleEditor();
});

SubtitleEditorSuite(
  'Should add empty collections for each language',
  ({ subtitleEditor }) => {
    subtitleEditor.addLanguage('en-US').addLanguage('nl-NL');

    const collection = subtitleEditor.export();

    expect(collection[0].languageCode).to.equal('en-US');
    expect(collection[1].languageCode).to.equal('nl-NL');
  }
);

SubtitleEditorSuite(
  'Should add subtitle for given duration and languages',
  ({ subtitleEditor }) => {
    subtitleEditor.addLanguage('nl-NL').addLanguage('en-US').addSubtitles(
      { start: 0, end: 5 },
      {
        'nl-NL': 'Foe',
        'en-US': 'Foo',
      }
    );

    const collection = subtitleEditor.export();

    expect(collection[0].titles[0].duration).to.eql({ start: 0, end: 5 });
    expect(collection[1].titles[0].duration).to.eql({ start: 0, end: 5 });
    expect(collection[0].titles[0].text).to.equal('Foe');
    expect(collection[1].titles[0].text).to.equal('Foo');
  }
);

SubtitleEditorSuite(
  'Should throw when duplicate language is added',
  ({ subtitleEditor }) => {
    expect(() =>
      subtitleEditor.addLanguage('nl-NL').addLanguage('nl-NL')
    ).to.throw('Language nl-NL already exists.');
  }
);
  
SubtitleEditorSuite.run();
