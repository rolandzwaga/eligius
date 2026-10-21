import {SubtitleImporter} from '@configuration/api/subtitle-converter.ts';
import {SubtitleEditor} from '@configuration/api/subtitle-editor.ts';
import {describe, expect, test} from 'vitest';

describe('SubtitleImporter', () => {
  test('given an AVID subtitle with a two-line caption followed by a second caption, when importSubtitles is called, then every subtitle has a unique id and the two lines are joined with a newline', () => {
    // given
    const lines = [
      '00:00:01:00 00:00:03:00',
      'Hello',
      'world',
      '',
      '00:00:04:00 00:00:05:00',
      'Bye',
    ];

    // test
    const titles = new SubtitleImporter().importSubtitles(lines);

    // expect
    expect(titles.map(({text, duration}) => ({text, duration}))).toEqual([
      {text: 'Hello\nworld', duration: {start: 1, end: 3}},
      {text: 'Bye', duration: {start: 4, end: 5}},
    ]);
    expect(typeof titles[0].id).toBe('string');
    expect(typeof titles[1].id).toBe('string');
    expect(titles[0].id).not.toBe(titles[1].id);
  });

  test('given a file with header lines, carriage returns and blank lines around the captions, when importSubtitles is called, then only the captions are returned', () => {
    // given
    const lines = [
      '@ This file is written in the AVID format',
      '<begin subtitles>',
      '',
      '00:00:01:00 00:00:02:00\r',
      'One\r',
      '',
      '00:00:03:00 00:00:04:00',
      'Two',
      '<end subtitles>',
      '',
      '',
    ];

    // test
    const titles = new SubtitleImporter().importSubtitles(lines);

    // expect
    expect(titles.map(x => x.text)).toEqual(['One', 'Two']);
    expect(titles[0].duration).toEqual({start: 1, end: 2});
  });

  test('given imported subtitles in a SubtitleEditor, when setSubtitle updates the second one, then only the second one changes', () => {
    // given
    const titles = new SubtitleImporter().importSubtitles([
      '00:00:01:00 00:00:03:00',
      'Hello',
      '',
      '00:00:04:00 00:00:05:00',
      'Bye',
    ]);
    const editor = new SubtitleEditor([{languageCode: 'en-US', titles}]);

    // test
    editor.setSubtitle('en-US', {...titles[1], text: 'Ciao'});

    // expect
    expect(editor.export()[0].titles.map(x => x.text)).toEqual([
      'Hello',
      'Ciao',
    ]);
  });
});
