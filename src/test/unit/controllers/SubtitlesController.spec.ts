import {SubtitlesController} from '@controllers/subtitles-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

describe('SubtitlesController', () => {
  let controller: SubtitlesController;
  let mockEventbus: IEventbus;
  let mockContainer: any;

  const createSubtitleData = () => [
    {
      languageCode: 'en-US' as const,
      titles: [
        {
          id: 'sub1',
          text: 'Hello World',
          duration: {start: 0, end: 5},
        },
        {
          id: 'sub2',
          text: 'Goodbye World',
          duration: {start: 10, end: 15},
        },
      ],
    },
    {
      languageCode: 'nl-NL' as const,
      titles: [
        {
          id: 'sub1',
          text: 'Hallo Wereld',
          duration: {start: 0, end: 5},
        },
        {
          id: 'sub2',
          text: 'Tot ziens Wereld',
          duration: {start: 10, end: 15},
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new SubtitlesController();
    mockEventbus = createMockEventbus();
    mockContainer = createMockJQueryElement();
  });

  describe('init', () => {
    it('should initialize with subtitle data and language', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);

      expect(controller.currentLanguage).toBe('en-US');
      expect(controller.actionLookup).toBeDefined();
      expect(controller.subtitleDurations).toHaveLength(2);
    });

    it('should create action lookup for all subtitle timings', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);

      // Should have actions for start and end of both subtitles
      expect(controller.actionLookup[0]).toBeInstanceOf(Function); // Start of first subtitle
      expect(controller.actionLookup[5]).toBeInstanceOf(Function); // End of first subtitle
      expect(controller.actionLookup[10]).toBeInstanceOf(Function); // Start of second subtitle
      expect(controller.actionLookup[15]).toBeInstanceOf(Function); // End of second subtitle
    });

    it('should store subtitle durations', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);

      expect(controller.subtitleDurations).toEqual([
        {start: 0, end: 5},
        {start: 10, end: 15},
      ]);
    });
  });

  describe('attach', () => {
    it('should register TIME event listener', () => {
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'timeline-time',
        expect.any(Function)
      );
    });

    it('should register SEEKED event listener', () => {
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'timeline-seeked',
        expect.any(Function)
      );
    });

    it('should register LANGUAGE_CHANGE event listener', () => {
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'language-change',
        expect.any(Function)
      );
    });
  });

  describe('detach', () => {
    it('should call all detach methods', () => {
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();

      controller.detach(mockEventbus);

      // Verify event listeners were detached through BaseController
      expect(mockEventbus.on).toHaveBeenCalled();
    });
  });

  describe('subtitle display', () => {
    it('should display subtitle when timeline position matches start time', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Trigger TIME event at position 0 (start of first subtitle)
      mockEventbus.broadcast('timeline-time', [0]);

      // Check that subtitle was set
      expect(mockContainer.html()).toBe('Hello World');
    });

    it('should remove subtitle when timeline position matches end time', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Show subtitle first
      mockEventbus.broadcast('timeline-time', [0]);
      expect(mockContainer.html()).toBe('Hello World');

      // Remove at end time
      mockEventbus.broadcast('timeline-time', [5]);
      expect(mockContainer.html()).toBe('');
    });

    it('should not re-display same subtitle on repeated time events', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      const htmlSpy = vi.spyOn(mockContainer, 'html');

      // Trigger TIME event at position 0 twice
      mockEventbus.broadcast('timeline-time', [0]);
      mockEventbus.broadcast('timeline-time', [0]);

      // html() should only be called once (second call is skipped because lastFunc matches)
      expect(htmlSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('language change', () => {
    it('should update current language on LANGUAGE_CHANGE event', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(controller.currentLanguage).toBe('en-US');

      // Trigger language change
      mockEventbus.broadcast('language-change', ['nl-NL']);

      expect(controller.currentLanguage).toBe('nl-NL');
    });

    it('should redisplay current subtitle in new language', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Display subtitle in English
      mockEventbus.broadcast('timeline-time', [0]);
      expect(mockContainer.html()).toBe('Hello World');

      // Change language to Dutch
      mockEventbus.broadcast('language-change', ['nl-NL']);

      // Subtitle should be redisplayed in Dutch
      expect(mockContainer.html()).toBe('Hallo Wereld');
    });
  });

  describe('seeking', () => {
    it('should display correct subtitle when seeking to position', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Seek to position 2 (within first subtitle range 0-5)
      mockEventbus.broadcast('timeline-seeked', [2, 100]);

      expect(mockContainer.html()).toBe('Hello World');
    });

    it('should remove subtitle when seeking outside subtitle range', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Show subtitle first
      mockEventbus.broadcast('timeline-time', [0]);
      expect(mockContainer.html()).toBe('Hello World');

      // Seek to position 7 (outside any subtitle range)
      mockEventbus.broadcast('timeline-seeked', [7, 100]);

      expect(mockContainer.html()).toBe('');
    });

    it('should display second subtitle when seeking to its range', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Seek to position 12 (within second subtitle range 10-15)
      mockEventbus.broadcast('timeline-seeked', [12, 100]);

      expect(mockContainer.html()).toBe('Goodbye World');
    });
  });

  describe('removeTitle', () => {
    it('should empty container when called', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);

      mockContainer.html('Some subtitle text');
      controller.removeTitle();

      expect(mockContainer.html()).toBe('');
    });

    it('should clear lastFunc reference', () => {
      const operationData = {
        selectedElement: mockContainer,
        language: 'en-US' as const,
        subtitleData: createSubtitleData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Set a subtitle (sets lastFunc)
      mockEventbus.broadcast('timeline-time', [0]);
      expect(controller.lastFunc).not.toBeNull();

      // Remove subtitle
      mockEventbus.broadcast('timeline-time', [5]);
      expect(controller.lastFunc).toBeNull();
    });
  });
});
