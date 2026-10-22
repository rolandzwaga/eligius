import {setElementAttributes} from '@operation/set-element-attributes.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('setElementAttributes', () => {
  test('should set the given attributes on the specified element', () => {
    // given
    const testElement = $('<div/>');
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: testElement,
    };

    // test
    applyOperation(setElementAttributes, operationData);

    // expect
    expect(testElement.attr('testProp1')).toBe('test1');
    expect(testElement.attr('testProp2')).toBe('test2');
  });

  test('should remove the attributes property from the operation data', () => {
    // given
    const testElement = $('<div/>');
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: testElement,
    };

    // test
    const newData = applyOperation(setElementAttributes, operationData);

    // expect
    expect('attributes' in newData).toBe(false);
  });
});

describe('setElementAttributes with hostile names and values', () => {
  test.each([
    ['onclick', 'globalThis.__pwned = true'],
    ['onMouseOver', 'globalThis.__pwned = true'],
    ['srcdoc', '<script>globalThis.__pwned = true</script>'],
  ])(
    'given attribute %s, when setElementAttributes runs, then it throws naming the operation and sets no attribute',
    (attribute, value) => {
      // given
      const element = $('<iframe/>');

      // test & expect
      expect(() =>
        applyOperation(setElementAttributes, {
          selectedElement: element,
          attributes: {title: 'Video', [attribute]: value},
        })
      ).toThrow(
        `setElementAttributes: attribute '${attribute}' is not allowed. Event handler (on*) and srcdoc attributes are refused.`
      );
      expect(element.attr('title')).toBeUndefined();
      expect(element.attr(attribute)).toBeUndefined();
    }
  );

  test('given an href parsed from JSON holding a javascript: URL with a tab inside the scheme, when setElementAttributes runs, then it throws and the link keeps its href', () => {
    // given
    const element = $('<a href="/home"></a>');
    const {attributes} = JSON.parse(
      '{"attributes": {"href": "java\\tscript:globalThis.__pwned = true"}}'
    );

    // test & expect
    expect(() =>
      applyOperation(setElementAttributes, {
        selectedElement: element,
        attributes,
      })
    ).toThrow(
      "setElementAttributes: attribute 'href' must not hold a javascript: or vbscript: URL."
    );
    expect(element.attr('href')).toBe('/home');
  });

  test('given a JSON-parsed attributes object with a __proto__ key, when setElementAttributes runs, then Object.prototype is not polluted', () => {
    // given
    const element = $('<div/>');
    const {attributes} = JSON.parse(
      '{"attributes": {"title": "ok", "__proto__": {"polluted": "yes"}}}'
    );

    // test
    try {
      applyOperation(setElementAttributes, {
        selectedElement: element,
        attributes,
      });
    } catch {
      // jQuery may refuse the odd attribute name; only the prototype matters here
    }

    // expect
    expect(({} as any).polluted).toBeUndefined();
  });

  test('given safe attributes including an https href, when setElementAttributes runs, then they are set', () => {
    // given
    const element = $('<a/>');

    // test
    applyOperation(setElementAttributes, {
      selectedElement: element,
      attributes: {href: 'https://example.com', 'aria-label': 'Example'},
    });

    // expect
    expect(element.attr('href')).toBe('https://example.com');
    expect(element.attr('aria-label')).toBe('Example');
  });
});
