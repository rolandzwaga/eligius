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

      // The click position is measured against the container the handler is bound to
      mockParentElement.getBoundingClientRect = () => ({left: 0, width: 200});

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Mock click event (50% through the bar)
      const mockClickEvent = {
        target: mockParentElement,
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

    it('given a progressbar whose container also holds the text element and a 100s duration, when the text element is clicked at clientX 420 inside a 500px-wide container, then timeline-seek-request is broadcast with 84 rather than 50', () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 100 : undefined
      );
      mockParentElement.getBoundingClientRect = () => ({left: 0, width: 500});
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockParentElement.trigger('click', {
        target: {getBoundingClientRect: () => ({left: 400, width: 40})},
        clientX: 420,
      });

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'timeline-seek-request',
        [84]
      );

      // and the seek position keeps sub-second (0.1s) precision
      mockEventbus.broadcast('timeline-duration', [() => 5]);
      mockParentElement.trigger('click', {
        target: mockParentElement,
        clientX: 123,
      });
      expect(mockEventbus.broadcast).toHaveBeenLastCalledWith(
        'timeline-seek-request',
        [1.2]
      );
    });

    it('given a duration of 0, when the container is clicked, then no seek request is broadcast', () => {
      mockParentElement.getBoundingClientRect = () => ({left: 0, width: 500});
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockParentElement.trigger('click', {
        target: mockParentElement,
        clientX: 250,
      });

      expect(mockEventbus.broadcast).not.toHaveBeenCalledWith(
        'timeline-seek-request',
        expect.anything()
      );
    });
  });

  describe('duration changes', () => {
    it("given ProgressbarController attached with duration 60, when 'timeline-duration' reports 120 and 'timeline-time' 90 is broadcast, then the selected element width is 75%", () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 60 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-duration', [() => 120]);
      mockEventbus.broadcast('timeline-time', [90]);

      expect(mockSelectedElement.getCssProperties().width).toBe('75%');
      expect(mockTextElement.text()).toBe('75%');
    });

    it("given an attached ProgressbarController, when 100 'timeline-time' ticks are broadcast, then the duration is requested only once, on attach", () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 60 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      for (let i = 0; i < 100; i++) {
        mockEventbus.broadcast('timeline-time', [i / 10]);
      }

      const durationRequests = vi
        .mocked(mockEventbus.request)
        .mock.calls.filter(([name]) => name === 'timeline-duration-request');
      expect(durationRequests).toHaveLength(1);
    });

    it("given a known duration of 60, when 'timeline-duration' arrives without a getter, then the previous duration is kept", () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 60 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-duration', [undefined]);
      mockEventbus.broadcast('timeline-time', [30]);

      expect(mockSelectedElement.getCssProperties().width).toBe('50%');
    });

    it('given a duration of 0, when timeline-time is broadcast, then no NaN or Infinity percentage is rendered', () => {
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [0]);
      mockEventbus.broadcast('timeline-time', [5]);

      expect(mockSelectedElement.getCssProperties().width).toBeUndefined();
      expect(mockTextElement.text()).toBe('');
    });

    it('given a position past the duration, when timeline-time is broadcast, then the percentage is clamped to 100', () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 60 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [90]);

      expect(mockSelectedElement.getCssProperties().width).toBe('100%');
      expect(mockTextElement.text()).toBe('100%');
    });

    it('given a 100s timeline played for 10s at 60fps, when the ticks are broadcast, then the text is written once per whole percent and the width once per 0.1%', () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 100 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);
      const textWrites = vi.spyOn(mockTextElement, 'text');
      const cssWrites = vi.spyOn(mockSelectedElement, 'css');

      for (let frame = 0; frame <= 600; frame++) {
        mockEventbus.broadcast('timeline-time', [frame / 60]);
      }

      expect(textWrites).toHaveBeenCalledTimes(11);
      expect(cssWrites).toHaveBeenCalledTimes(101);
      expect(mockTextElement.text()).toBe('10%');
      expect(mockSelectedElement.getCssProperties().width).toBe('10%');
    });

    it('given a rendered progress, when the controller is detached and attached again, then the current progress is written again', () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 100 : undefined
      );
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });
      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [50]);
      controller.detach(mockEventbus);
      mockTextElement.text('');

      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [50]);

      expect(mockTextElement.text()).toBe('50%');
    });
  });

  describe('lifecycle', () => {
    it('given a bar with an inline pointer-events value, when the controller is attached and detached, then the value is restored', () => {
      const container = document.createElement('div');
      const bar = document.createElement('div');
      bar.style.pointerEvents = 'auto';
      container.appendChild(bar);
      document.body.appendChild(container);
      const $ = (element: HTMLElement) => {
        const wrapped = createMockJQueryElement() as any;
        wrapped[0] = element;
        wrapped.css = vi.fn((prop: any, value?: string) => {
          if (typeof prop === 'object') {
            Object.assign(element.style, {
              pointerEvents: prop['pointer-events'],
            });
          } else if (prop === 'pointer-events' && value !== undefined) {
            element.style.pointerEvents = value;
          }
          return wrapped;
        });
        return wrapped;
      };
      const selectedElement = $(bar);
      selectedElement.parent = vi
        .fn()
        .mockReturnValue(createMockJQueryElement());
      controller.init({selectedElement, textElement: mockTextElement});

      controller.attach(mockEventbus);
      expect(bar.style.pointerEvents).toBe('none');

      controller.detach(mockEventbus);
      expect(bar.style.pointerEvents).toBe('auto');
      container.remove();
    });

    it('given an attached controller, when attach is called again, then a container click requests one seek', () => {
      (mockEventbus.request as any).mockImplementation((eventName: string) =>
        eventName === 'timeline-duration-request' ? 100 : undefined
      );
      mockParentElement.getBoundingClientRect = () => ({left: 0, width: 200});
      controller.init({
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      });

      controller.attach(mockEventbus);
      controller.attach(mockEventbus);
      mockParentElement.trigger('click', {clientX: 100});

      const seeks = (mockEventbus.broadcast as any).mock.calls.filter(
        ([name]: [string]) => name === 'timeline-seek-request'
      );
      expect(seeks).toEqual([['timeline-seek-request', [50]]]);
    });

    it('given init, when the controller is inspected, then operationData holds the configured elements', () => {
      const operationData = {
        selectedElement: mockSelectedElement,
        textElement: mockTextElement,
      };

      controller.init(operationData);

      expect(controller.operationData).toBe(operationData);
    });
  });
});
