import { expect } from 'chai';
import { animate } from '../../../operation/animate';
import { applyOperation } from './apply-operation';

class MockElement {
  properties: any;
  duration: number = -1;
  easing: string | (() => void) = '';
  callback: () => void = () => undefined;

  animate(
    properties: any,
    duration: number,
    easing: string | (() => void),
    callback: () => void
  ) {
    this.properties = properties;
    this.duration = duration;
    if (typeof easing === 'string') {
      this.easing = easing;
      this.callback = callback;
      callback();
    } else if (typeof easing === 'function') {
      this.callback = easing;
      easing();
    }
  }
}

describe('animate', () => {
  it('should animate with easing when defined', async () => {
    // given
    const mockElement = new MockElement();

    const operationData = {
      animationEasing: 'slow',
      selectedElement: (mockElement as any) as JQuery,
      animationProperties: {},
      animationDuration: 5,
    };

    // test
    const data = await applyOperation<Promise<typeof operationData>>(
      animate,
      operationData
    );

    // expect
    expect(data.selectedElement).to.equal(operationData.selectedElement);
  });

  it('should animate without easing when not defined', async () => {
    // given
    const mockElement = new MockElement();

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      animationProperties: {},
      animationDuration: 5,
    };

    // test
    const data = await applyOperation<Promise<typeof operationData>>(
      animate,
      operationData
    );

    // expect
    expect(data.selectedElement).to.equal(operationData.selectedElement);
  });
});
