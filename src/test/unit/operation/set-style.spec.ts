import {setStyle} from '@operation/set-style.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

class MockElement {
  cssProps: any;
  css(cssProps: any) {
    this.cssProps = cssProps;
  }
}

describe('setStyle', () => {
  test('should set the style on the specified element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      display: 'block',
      properties: {
        visible: true,
        display: '$operationdata.display',
      },
      selectedElement: mockElement as any as JQuery,
    };

    // test
    applyOperation(setStyle, operationData);

    // expect
    expect(mockElement.cssProps.visible).toBe(true);
    expect(mockElement.cssProps.display).toBe('block');
  });

  test('should remove the properties property from the operation data', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      display: 'block',
      properties: {
        visible: true,
        display: '$operationdata.display',
      },
      selectedElement: mockElement as any as JQuery,
    };

    // test
    const newData = applyOperation(setStyle, operationData);

    // expect
    expect('properties' in newData).toBe(false);
  });
});
