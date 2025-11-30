import {animate} from '@operation/animate.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';

function createMockElement() {
  return {
    animate: vi.fn(
      (
        _properties: any,
        _duration: number,
        easing: string | (() => void),
        callback?: () => void
      ) => {
        // Invoke callback immediately to simulate animation completion
        if (typeof easing === 'function') {
          easing();
        } else if (typeof callback === 'function') {
          callback();
        }
      }
    ),
  };
}

describe('animate', () => {
  test('should animate with easing when defined', async () => {
    // given
    const mockElement = createMockElement();

    const operationData = {
      animationEasing: 'slow',
      selectedElement: mockElement as any as JQuery,
      animationProperties: {},
      animationDuration: 5,
    };

    // test
    const data = await applyOperation(animate, operationData);

    // expect
    expect(data.selectedElement).toBe(operationData.selectedElement);
    expect(mockElement.animate).toHaveBeenCalledWith(
      {},
      5,
      'slow',
      expect.any(Function)
    );
  });

  test('should animate without easing when not defined', async () => {
    // given
    const mockElement = createMockElement();

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      animationProperties: {},
      animationDuration: 5,
    };

    // test
    const data = await applyOperation(animate, operationData);

    // expect
    expect(data.selectedElement).toBe(operationData.selectedElement);
    expect(mockElement.animate).toHaveBeenCalledWith(
      {},
      5,
      expect.any(Function)
    );
  });

  test('should remove animationEasing, animationProperties and animationDuration from operation data', async () => {
    // given
    const mockElement = createMockElement();

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      animationProperties: {},
      animationDuration: 5,
    };

    // test
    const data = await applyOperation(animate, operationData);

    // expect
    expect('animationEasing' in operationData).toBe(false);
    expect('animationProperties' in operationData).toBe(false);
    expect('animationDuration' in operationData).toBe(false);
  });
});
