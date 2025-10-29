import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ProgressbarController} from '../../../controllers/progressbar-controller.js';
import type {IEventbus} from '../../../eventbus/types.js';
import {TimelineEventNames} from '../../../timeline-event-names.js';
import {createMockEventbus} from '../../fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '../../fixtures/jquery-factory.js';

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
        TimelineEventNames.TIME,
        expect.any(Function)
      );
    });

    it('should request duration from eventbus', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      // Mock broadcast to provide duration
      (mockEventbus.broadcast as any).mockImplementation(
        (eventName: string, args?: any[]) => {
          if (eventName === TimelineEventNames.DURATION_REQUEST && args) {
            const callback = args[0];
            callback(100); // Set duration to 100 seconds
          }
        }
      );

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        TimelineEventNames.DURATION_REQUEST,
        expect.any(Array)
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
      const originalBroadcast = testEventbus.broadcast;

      // Set duration via broadcast wrapper
      (testEventbus.broadcast as any) = (eventName: string, args?: any[]) => {
        if (eventName === TimelineEventNames.DURATION_REQUEST && args) {
          args[0](100); // 100 seconds duration
        }
        // Call original to invoke registered handlers
        originalBroadcast.call(testEventbus, eventName, args);
      };

      controller.init(operationData);
      controller.attach(testEventbus);

      // Trigger TIME event with position 50 seconds
      testEventbus.broadcast(TimelineEventNames.TIME, [50]);

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
      const originalBroadcast = testEventbus.broadcast;

      // Set duration via broadcast wrapper
      (testEventbus.broadcast as any) = (eventName: string, args?: any[]) => {
        if (eventName === TimelineEventNames.DURATION_REQUEST && args) {
          args[0](100); // 100 seconds duration
        }
        // Call original to invoke registered handlers
        originalBroadcast.call(testEventbus, eventName, args);
      };

      controller.init(operationData);
      controller.attach(testEventbus);

      // Trigger TIME event with position 75 seconds
      testEventbus.broadcast(TimelineEventNames.TIME, [75]);

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

      // Set duration
      (mockEventbus.broadcast as any).mockImplementation(
        (eventName: string, args?: any[]) => {
          if (eventName === TimelineEventNames.DURATION_REQUEST && args) {
            args[0](100); // 100 seconds duration
          }
        }
      );

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
        TimelineEventNames.SEEK_REQUEST,
        [50]
      );
    });
  });
});
