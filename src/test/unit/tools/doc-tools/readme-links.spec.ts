import {describe, expect, test} from 'vitest';
import {
  buildReadme,
  generateLink,
  getFirstCommentLine,
} from '@/tools/doc-tools/readme-links.ts';

describe('getFirstCommentLine', () => {
  test('given an operation variable reflection whose comment.summary is set, when getting the first comment line, then it returns the summary', () => {
    // given
    const itemInfo = {
      name: 'addClass',
      comment: {
        summary: [
          {kind: 'text', text: 'Adds the class name to the selected element.'},
        ],
      },
    };

    // test
    const result = getFirstCommentLine(itemInfo);

    // expect
    expect(result).toBe(' "Adds the class name to the selected element."');
  });

  test('given a summary with code parts and Windows and Unix line breaks, when getting the first comment line, then it joins all parts of the first paragraph on one line', () => {
    // given
    const itemInfo = {
      name: 'clearStorage',
      comment: {
        summary: [
          {kind: 'text', text: 'Clears data from\r\nbrowser storage using '},
          {kind: 'code', text: '`key`'},
          {kind: 'text', text: '\nwhen given.\n\nSecond paragraph.'},
        ],
      },
    };

    // test
    const result = getFirstCommentLine(itemInfo);

    // expect
    expect(result).toBe(
      ' "Clears data from browser storage using `key` when given."'
    );
  });

  test('given a class reflection with a matching signature comment, when getting the first comment line, then it uses the signature comment', () => {
    // given
    const itemInfo = {
      name: 'LabelController',
      signatures: [
        {
          name: 'LabelController',
          comment: {summary: [{kind: 'text', text: 'Renders a label.'}]},
        },
      ],
    };

    // test
    const result = getFirstCommentLine(itemInfo);

    // expect
    expect(result).toBe(' "Renders a label."');
  });

  test('given a reflection without a comment, when getting the first comment line, then it returns an empty string', () => {
    // test
    const result = getFirstCommentLine({name: 'foo'});

    // expect
    expect(result).toBe('');
  });
});

describe('generateLink', () => {
  test('given an operation that has a schema file, when generating its link, then it includes the summary and the schema link', () => {
    // given
    const itemInfo = {
      name: 'addClass',
      comment: {summary: [{kind: 'text', text: 'Adds a class.'}]},
    };

    // test
    const result = generateLink(
      'variables',
      itemInfo,
      name => name === 'add-class.json'
    );

    // expect
    expect(result).toBe(
      '- [addClass](https://rolandzwaga.github.io/eligius/variables/addClass.html "Adds a class.") - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/add-class.json))'
    );
  });

  test('given an operation without a schema file, when generating its link, then it has no schema link', () => {
    // test
    const result = generateLink('variables', {name: 'endWhen'}, () => false);

    // expect
    expect(result).toBe(
      '- [endWhen](https://rolandzwaga.github.io/eligius/variables/endWhen.html)'
    );
  });

  test('given a controller, when generating its link, then it never has a schema link', () => {
    // test
    const result = generateLink(
      'classes',
      {name: 'LabelController'},
      () => true
    );

    // expect
    expect(result).toBe(
      '- [LabelController](https://rolandzwaga.github.io/eligius/classes/LabelController.html)'
    );
  });
});

describe('buildReadme', () => {
  test('given a title, an introduction and links, when building the README, then it is laid out the way the Biome formatter prints Markdown', () => {
    // test
    const result = buildReadme('Operations', 'All operations', [
      '- [a](https://example.com/a)',
      '- [b](https://example.com/b)',
    ]);

    // expect
    expect(result).toBe(
      '# Operations\n\nAll operations\n- [a](https://example.com/a)\n\n- [b](https://example.com/b)\n'
    );
  });

  test('given no links, when building the README, then it still ends with a single newline', () => {
    // test
    const result = buildReadme('Controllers', 'All controllers', []);

    // expect
    expect(result).toBe('# Controllers\n\nAll controllers\n');
  });
});
