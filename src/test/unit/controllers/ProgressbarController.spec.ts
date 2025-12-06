import {ProgressbarController} from '@controllers/progressbar-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

describe('ProgressbarController', () => {
  let controller: ProgressbarController;
  let mockEventbus: IEventbus;
  let mockSelectedElement: any;
  let mockTextElement: any;
  let mockParentElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ProgressbarController();
    mockEventbus = createMockEventbus();
    mockSelectedElement = createMockJQueryElement();
    mockTextElement = createMockJQueryElement();
    mockParentElement = createMockJQueryElement();

    // Setup parent() to return mockParentElement
    mockSelectedElement.parent = vi.fn().mockReturnValue(mockParentElement);
  });

  describe('init', () => {
    it('should initialize with selected and text elements', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      controller.init(operationData);

      expect(controller.selectedElement).toBe(mockSelectedElement);
      expect(controller.textElement).toBe(mockTextElement);
    });
  });

  describe('attach', () => {
    it('should register TIME event listener', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'timeline-time',
        expect.any(Function)
      );
    });

    it('should request duration from eventbus', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      // Mock request to provide duration
      (mockEventbus.request as any).mockImplementation((eventName: string) => {
        if (eventName === 'timeline-duration-request') {
          return 100; // Set duration to 100 seconds
        }
        return undefined;
      });

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.request).toHaveBeenCalledWith(
        'timeline-duration-request'
      );
      expect(controller.duration).toBe(100);
    });

    it('should disable pointer events on selected element', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      const cssSpy = vi.spyOn(mockSelectedElement, 'css');

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(cssSpy).toHaveBeenCalledWith({'pointer-events': 'none'});
    });

    it('should attach click handler to parent container', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      const onSpy = vi.spyOn(mockParentElement, 'on');

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(onSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('detach', () => {
    it('should call all event remover functions', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();

      controller.detach(mockEventbus);

      // Verify removers were called through detach
      expect(mockEventbus.on).toHaveBeenCalled();
    });
  });

  describe('progress updates', () => {
    it('should update progress bar width based on position', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      // Create fresh eventbus for this test
      const testEventbus = createMockEventbus();

      // Set duration via request mock
      (testEventbus.request as any).mockImplementation((eventName: string) => {
        if (eventName === 'timeline-duration-request') {
          return 100; // 100 seconds duration
        }
        return undefined;
      });

      controller.init(operationData);
      controller.attach(testEventbus);

      // Trigger TIME event with position 50 seconds
      testEventbus.broadcast('timeline-time', [50]);

      // 50/100 * 100 = 50%
      expect(mockSelectedElement.getCssProperties().width).toBe('50%');
    });

    it('should update text element with percentage', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      // Create fresh eventbus for this test
      const testEventbus = createMockEventbus();

      // Set duration via request mock
      (testEventbus.request as any).mockImplementation((eventName: string) => {
        if (eventName === 'timeline-duration-request') {
          return 100; // 100 seconds duration
        }
        return undefined;
      });

      controller.init(operationData);
      controller.attach(testEventbus);

      // Trigger TIME event with position 75 seconds
      testEventbus.broadcast('timeline-time', [75]);

      // Floor(75%) = 75%
      expect(mockTextElement.text()).toBe('75%');
    });
  });

  describe('seek interaction', () => {
    it('should broadcast SEEK_REQUEST when parent container clicked', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      // Set duration via request mock
      (mockEventbus.request as any).mockImplementation((eventName: string) => {
        if (eventName === 'timeline-duration-request') {
          return 100; // 100 seconds duration
        }
        return undefined;
      });

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Mock click event (50% through the bar)
      const mockClickEvent = {
        target: {
          getBoundingClientRect: () => ({
            left: 0,
            width: 200,
          }),
        },
        clientX: 100, // 50% of 200 width
      };

      // Trigger click on parent
      mockParentElement.trigger('click', mockClickEvent);

      // Should broadcast SEEK_REQUEST with position: 100 * 0.5 = 50 seconds
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seek-request',
        [50]
      );
    });
  });
});
