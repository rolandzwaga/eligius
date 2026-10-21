import {ALLOWED_TAGS, isSafeUrl, sanitizeHtml} from '@util/sanitize-html.ts';
import {describe, expect, test} from 'vitest';

/**
 * Parses sanitizer output the way a controller would insert it and checks
 * that nothing executable survived: only allowlisted HTML elements, no event
 * handler attributes, and no unsafe URLs.
 */
function expectInert(output: string) {
  const template = document.createElement('template');
  template.innerHTML = output;
  for (const el of Array.from(template.content.querySelectorAll('*'))) {
    expect(el.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(ALLOWED_TAGS.has(el.localName)).toBe(true);
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.toLowerCase().startsWith('on')).toBe(false);
      if (attr.name === 'href' || attr.name === 'cite') {
        expect(isSafeUrl(attr.value)).toBe(true);
      }
    }
  }
}

describe('sanitizeHtml', () => {
  describe('allowed content', () => {
    test('given plain text, when sanitized, then it is returned unchanged', () => {
      expect(sanitizeHtml('Hello World')).toBe('Hello World');
    });

    test('given an empty string, when sanitized, then an empty string is returned', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    test('given text with entities, when sanitized, then entities stay escaped', () => {
      expect(sanitizeHtml('Tom &amp; Jerry &lt;script&gt;')).toBe(
        'Tom &amp; Jerry &lt;script&gt;'
      );
    });

    test('given a line break, when sanitized, then the br is kept', () => {
      expect(sanitizeHtml('Line one<br>Line two')).toBe('Line one<br>Line two');
    });

    test('given inline formatting, when sanitized, then the formatting is kept', () => {
      const input =
        '<strong>Bold</strong>, <em>em</em>, <b>b</b>, <i>i</i>, <u>u</u>, <small>s</small>, <sub>2</sub>, <sup>3</sup>, <mark>m</mark>, <code>c</code>';

      expect(sanitizeHtml(input)).toBe(input);
    });

    test('given nested allowed tags, when sanitized, then the nesting is kept', () => {
      const input = '<strong>very <em>important <u>text</u></em></strong>';

      expect(sanitizeHtml(input)).toBe(input);
    });

    test('given a span with class, lang, dir and title, when sanitized, then those attributes are kept', () => {
      const input =
        '<span class="highlight" lang="nl" dir="ltr" title="tip">x</span>';

      expect(sanitizeHtml(input)).toBe(input);
    });

    test.each([
      'https://example.com/page?a=1#b',
      'http://example.com',
      'HTTPS://EXAMPLE.COM',
      'mailto:info@example.com',
      '/relative/path',
      'page.html',
      './page.html',
      '../up.html',
      '#section-2',
      '?query=1',
      '//example.com/protocol-relative',
    ])('given a link to %s, when sanitized, then the href is kept', href => {
      const output = sanitizeHtml(`<a href="${href}">link</a>`);

      expect(output).toBe(`<a href="${href}">link</a>`);
    });

    test('given a link with target, when sanitized, then rel noopener noreferrer is enforced', () => {
      const output = sanitizeHtml(
        '<a href="https://example.com" target="_blank" rel="opener">x</a>'
      );

      const template = document.createElement('template');
      template.innerHTML = output;
      const anchor = template.content.querySelector('a')!;
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });

    test('given a link without target, when sanitized, then a supplied rel is dropped', () => {
      expect(sanitizeHtml('<a href="/x" rel="opener">x</a>')).toBe(
        '<a href="/x">x</a>'
      );
    });

    test('given already sanitized output, when sanitized again, then it does not change', () => {
      const once = sanitizeHtml(
        '<div>Hi <strong onclick="x()">there</strong><script>y()</script><a href="javascript:z()">z</a></div>'
      );

      expect(sanitizeHtml(once)).toBe(once);
    });
  });

  describe('hostile content', () => {
    test('given a script tag, when sanitized, then the script and its content are removed', () => {
      const output = sanitizeHtml('Hi<script>alert(1)</script> there');

      expect(output).toBe('Hi there');
    });

    test('given an image with onerror, when sanitized, then the image is removed', () => {
      const output = sanitizeHtml('<img src=x onerror=alert(1)>Home');

      expect(output).toBe('Home');
    });

    test('given an event handler on an allowed tag, when sanitized, then the handler is removed but the tag kept', () => {
      const output = sanitizeHtml(
        '<b onclick="alert(1)" OnMouseOver="alert(2)">Bold</b>'
      );

      expect(output).toBe('<b>Bold</b>');
    });

    test('given style and id attributes, when sanitized, then they are removed', () => {
      const output = sanitizeHtml(
        '<span style="position:fixed;inset:0" id="clobber" data-x="1">x</span>'
      );

      expect(output).toBe('<span>x</span>');
    });

    test.each([
      ['javascript:alert(1)'],
      ['JaVaScRiPt:alert(1)'],
      ['  javascript:alert(1)'],
      ['java\tscript:alert(1)'],
      ['java&#x0A;script:alert(1)'],
      ['&#106;avascript:alert(1)'],
      ['javascript&colon;alert(1)'],
      ['&#x01;javascript:alert(1)'],
      ['vbscript:msgbox(1)'],
      ['data:text/html,<script>alert(1)</script>'],
      ['DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ])(
      'given a link with href %s, when sanitized, then the href is removed and the text kept',
      href => {
        const output = sanitizeHtml(`<a href="${href}">click</a>`);

        expect(output).toBe('<a>click</a>');
      }
    );

    test('given a q element with a javascript cite, when sanitized, then the cite is removed', () => {
      expect(sanitizeHtml('<q cite="javascript:alert(1)">q</q>')).toBe(
        '<q>q</q>'
      );
    });

    test('given a style element, when sanitized, then it is removed with its content', () => {
      expect(sanitizeHtml('<style>body{display:none}</style>Text')).toBe(
        'Text'
      );
    });

    test('given an iframe, when sanitized, then it is removed', () => {
      expect(
        sanitizeHtml('<iframe src="javascript:alert(1)">fallback</iframe>Text')
      ).toBe('Text');
    });

    test.each([
      ['<svg onload="alert(1)"><circle r="1"></circle></svg>'],
      ['<svg><script>alert(1)</script></svg>'],
      ['<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>'],
      ['<math><mi xlink:href="javascript:alert(1)">x</mi></math>'],
      ['<object data="javascript:alert(1)"></object>'],
      ['<embed src="javascript:alert(1)">'],
      ['<template><img src=x onerror=alert(1)></template>'],
      [
        '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
      ],
      ['<textarea><img src=x onerror=alert(1)></textarea>'],
      ['<form action="javascript:alert(1)"><button>go</button></form>'],
      ['<base href="javascript:alert(1)//">'],
      ['<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'],
      ['<link rel="stylesheet" href="https://evil.example/x.css">'],
    ])(
      'given hostile markup %s, when sanitized, then nothing executable remains',
      input => {
        const output = sanitizeHtml(input);

        expectInert(output);
        expect(output).not.toMatch(/<(svg|math|script|img|iframe|object)/i);
      }
    );

    test('given svg with text, when sanitized, then the svg is dropped entirely', () => {
      expect(sanitizeHtml('a<svg><text>inside</text></svg>b')).toBe('ab');
    });

    test('given disallowed block tags, when sanitized, then they are unwrapped and their text kept', () => {
      expect(sanitizeHtml('<div><p>Para <h1>Head</h1></p></div>')).toBe(
        'Para Head'
      );
    });

    test('given allowed and dangerous tags nested inside a disallowed tag, when sanitized, then the allowed tags survive in order', () => {
      const output = sanitizeHtml(
        '<div>a<strong>b</strong><script>bad()</script><p>c<em>d</em></p>e</div>'
      );

      expect(output).toBe('a<strong>b</strong>c<em>d</em>e');
    });

    test('given an allowed tag inside a dangerous tag, when sanitized, then it is removed with the dangerous tag', () => {
      expect(sanitizeHtml('<style><b>x</b></style>ok')).toBe('ok');
    });

    test('given comments, when sanitized, then they are removed', () => {
      expect(sanitizeHtml('a<!-- <script>x</script> -->b')).toBe('ab');
    });

    test('given a button with an event handler, when sanitized, then only its text remains', () => {
      expect(sanitizeHtml('<button onclick="alert(1)">Press</button>')).toBe(
        'Press'
      );
    });

    test('given deeply nested disallowed tags, when sanitized, then they are all unwrapped and the text kept', () => {
      const depth = 200;
      const input = `${'<div>'.repeat(depth)}x<script>y</script>${'</div>'.repeat(depth)}`;

      expect(sanitizeHtml(input)).toBe('x');
    });

    test('given an attribute value with quotes and angle brackets, when sanitized and parsed again, then it stays a single attribute', () => {
      const output = sanitizeHtml(
        '<span title="&quot;><img src=x onerror=alert(1)>">x</span>'
      );

      expectInert(output);
      const template = document.createElement('template');
      template.innerHTML = output;
      expect(template.content.querySelectorAll('img')).toHaveLength(0);
      expect(template.content.querySelector('span')?.title).toBe(
        '"><img src=x onerror=alert(1)>'
      );
    });
  });
});

describe('isSafeUrl', () => {
  test.each([
    'https://example.com',
    'http://example.com',
    'mailto:a@b.c',
    '/path',
    'relative',
    '#frag',
    '?q',
    '',
  ])('given %s, when checked, then it is safe', url => {
    expect(isSafeUrl(url)).toBe(true);
  });

  test.each([
    'javascript:alert(1)',
    ' JAVASCRIPT:alert(1)',
    'java\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    'file:///etc/passwd',
    'blob:https://example.com/id',
  ])('given %j, when checked, then it is unsafe', url => {
    expect(isSafeUrl(url)).toBe(false);
  });
});
