import {SubtitlesController} from '@controllers/subtitles-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import $ from 'jquery';
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

  describe('fractional positions', () => {
    it('given a subtitle from 10 to 15, when timeline-time is broadcast with fractional positions inside the range, then the subtitle is shown', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [9.98]);
      expect(mockContainer.html()).toBe('');

      mockEventbus.broadcast('timeline-time', [10.02]);
      expect(mockContainer.html()).toBe('Goodbye World');

      mockEventbus.broadcast('timeline-time', [14.97]);
      expect(mockContainer.html()).toBe('Goodbye World');
    });

    it('given a shown subtitle, when timeline-time passes its end with a fractional position, then the subtitle is removed', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [0.03]);
      expect(mockContainer.html()).toBe('Hello World');

      mockEventbus.broadcast('timeline-time', [5.02]);
      expect(mockContainer.html()).toBe('');
      expect(controller.lastFunc).toBeNull();
    });

    it('given a seek to exactly the end of a subtitle, when timeline-seeked is broadcast, then the subtitle is not shown', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-seeked', [5, 100]);

      expect(mockContainer.html()).toBe('');
    });
  });

  describe('language without subtitles', () => {
    it('given subtitle shown in en-US and subtitleData without de-DE, when language-change is broadcast with de-DE, then the English text is removed', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [0]);
      expect(mockContainer.html()).toBe('Hello World');

      mockEventbus.broadcast('language-change', ['de-DE']);

      expect(mockContainer.html()).toBe('');
    });
  });

  describe('starting language', () => {
    it('given the eventbus answers request-current-language with nl-NL and the controller is configured with language en-US, when the controller is attached and timeline-time reaches a subtitle range, then the Dutch subtitle text is rendered', () => {
      mockEventbus.onRequest('request-current-language', () => 'nl-NL');
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [1]);

      expect(mockContainer.html()).toBe('Hallo Wereld');
    });

    it('given no language is configured, when the controller is attached to an eventbus that knows the current language, then subtitles are rendered in it', () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      controller.init({
        selectedElement: mockContainer,
        subtitleData: createSubtitleData(),
      } as any);
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [1]);

      expect(mockContainer.html()).toBe('Hello World');
    });

    it('given nothing answers request-current-language, when the controller is attached, then the configured language is used', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'nl-NL',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [1]);

      expect(mockContainer.html()).toBe('Hallo Wereld');
    });
  });

  describe('invalid subtitle data', () => {
    it('given subtitleData where nl-NL has fewer titles than en-US, when SubtitlesController.init is called, then it throws an error naming SubtitlesController and subtitleData[1] (nl-NL) instead of a TypeError reading text', () => {
      const subtitleData = createSubtitleData();
      subtitleData[1].titles.pop();

      expect(() =>
        controller.init({
          selectedElement: mockContainer,
          language: 'en-US',
          subtitleData,
        })
      ).toThrow(
        'SubtitlesController: subtitleData[1] (nl-NL) has 1 titles, expected 2 (titles are matched by index across languages)'
      );
    });

    it('given a subtitleData entry without a titles array, when init is called, then it throws an error naming the entry', () => {
      const subtitleData = createSubtitleData() as any[];
      subtitleData[1] = {languageCode: 'nl-NL'};

      expect(() =>
        controller.init({
          selectedElement: mockContainer,
          language: 'en-US',
          subtitleData,
        })
      ).toThrow(
        'SubtitlesController: subtitleData[1] (nl-NL) has no titles array'
      );
    });

    it.each([
      ['empty', []],
      ['missing', undefined],
    ])(
      'given %s subtitleData, when the controller is initialised and time passes, then it does not throw and renders nothing',
      (_label, subtitleData) => {
        expect(() =>
          controller.init({
            selectedElement: mockContainer,
            language: 'en-US',
            subtitleData: subtitleData as any,
          })
        ).not.toThrow();
        controller.attach(mockEventbus);

        mockEventbus.broadcast('timeline-time', [1]);

        expect(mockContainer.html()).toBe('');
        expect(controller.subtitleDurations).toEqual([]);
      }
    );
  });

  describe('range lookup', () => {
    const createManySubtitles = (count: number) => [
      {
        languageCode: 'en-US' as const,
        titles: Array.from({length: count}, (_, i) => ({
          id: `t${i}`,
          text: `Title ${i}`,
          // 1 second titles with 1 second gaps
          duration: {start: i * 2, end: i * 2 + 1},
        })),
      },
    ];

    /**
     * Wraps the ranges in getters that count how often a range boundary is read.
     */
    const countRangeReads = () => {
      let reads = 0;
      const ranges = (controller as any)._titleRanges as any[];
      ranges.forEach((range, index) => {
        const {start, end, show} = range;
        ranges[index] = {
          get start() {
            reads++;
            return start;
          },
          get end() {
            reads++;
            return end;
          },
          show,
        };
      });
      return () => reads;
    };

    it('given 200 subtitles, when the timeline plays through them at 60fps, then each tick reads a constant number of range boundaries', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createManySubtitles(200),
      });
      controller.attach(mockEventbus);
      const reads = countRangeReads();

      const ticks = 400 * 60;
      for (let i = 0; i < ticks; i++) {
        mockEventbus.broadcast('timeline-time', [i / 60]);
      }

      expect(mockContainer.html()).toBe('');
      expect(reads() / ticks).toBeLessThan(6);
    });

    it('given 200 subtitles, when the timeline seeks back and forth, then the subtitle at each position is shown', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createManySubtitles(200),
      });
      controller.attach(mockEventbus);

      for (const [position, expected] of [
        [300.5, 'Title 150'],
        [0.5, 'Title 0'],
        [398.2, 'Title 199'],
        [101.5, ''],
        [11, ''],
        [10.99, 'Title 5'],
      ] as const) {
        mockEventbus.broadcast('timeline-seeked', [position, 400]);
        expect(mockContainer.html()).toBe(expected);
      }
    });

    it('given overlapping subtitle ranges, when a position is inside both, then the first configured subtitle is shown', () => {
      const subtitleData = [
        {
          languageCode: 'en-US' as const,
          titles: [
            {id: 'a', text: 'Late', duration: {start: 5, end: 20}},
            {id: 'b', text: 'Early', duration: {start: 0, end: 10}},
          ],
        },
      ];
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData,
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [2]);
      expect(mockContainer.html()).toBe('Early');

      mockEventbus.broadcast('timeline-time', [7]);
      expect(mockContainer.html()).toBe('Late');
    });
  });

  describe('re-attach', () => {
    it('given an attached controller, when attach is called again without detach, then each subtitle change renders once', () => {
      controller.init({
        selectedElement: mockContainer,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);
      controller.attach(mockEventbus);
      const htmlSpy = vi.spyOn(mockContainer, 'html');

      mockEventbus.broadcast('timeline-time', [1]);
      mockEventbus.broadcast('language-change', ['nl-NL']);

      expect(htmlSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('untrusted subtitle markup', () => {
    const createHostileSubtitleData = () => [
      {
        languageCode: 'en-US' as const,
        titles: [
          {
            id: 'sub1',
            text: '<i>Hello</i><br>World<img src=x onerror="alert(1)"><script>alert(2)</script>',
            duration: {start: 0, end: 5},
          },
        ],
      },
      {
        languageCode: 'nl-NL' as const,
        titles: [
          {
            id: 'sub1',
            text: '<a href="javascript:alert(3)">Hallo</a><svg onload="alert(4)"></svg>',
            duration: {start: 0, end: 5},
          },
        ],
      },
    ];

    beforeEach(() => {
      document.body.innerHTML = '<div id="subtitles"></div>';
    });

    it('given subtitle text with script and onerror payloads, when the subtitle is shown, then only the allowed formatting is rendered', () => {
      const container = $('#subtitles');
      controller.init({
        selectedElement: container,
        language: 'en-US',
        subtitleData: createHostileSubtitleData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-time', [1]);

      expect(container[0].innerHTML).toBe('<i>Hello</i><br>World');
      expect(container.find('img, script')).toHaveLength(0);
    });

    it('given a shown subtitle, when the language changes to one with a javascript link and svg, then the link has no href and the svg is dropped', () => {
      const container = $('#subtitles');
      controller.init({
        selectedElement: container,
        language: 'en-US',
        subtitleData: createHostileSubtitleData(),
      });
      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [1]);

      mockEventbus.broadcast('language-change', ['nl-NL']);

      expect(container[0].innerHTML).toBe('<a>Hallo</a>');
    });
  });

  describe('detach while a subtitle is shown', () => {
    it('given a subtitle is shown, when the controller is detached, then the container is emptied', () => {
      const container = $('<div/>').appendTo(document.body);
      controller.init({
        selectedElement: container,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [1]);
      expect(container.html()).toBe('Hello World');

      controller.detach(mockEventbus);

      expect(container.html()).toBe('');
      expect(controller.lastFunc).toBeNull();
      container.remove();
    });

    it('given no subtitle is shown, when the controller is detached, then content in the container is left alone', () => {
      const container = $('<div>host text</div>').appendTo(document.body);
      controller.init({
        selectedElement: container,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [7]);

      controller.detach(mockEventbus);

      expect(container.html()).toBe('host text');
      container.remove();
    });

    it('given a subtitle was shown before detach, when the controller is attached again at the same position, then the subtitle is shown again', () => {
      const container = $('<div/>').appendTo(document.body);
      controller.init({
        selectedElement: container,
        language: 'en-US',
        subtitleData: createSubtitleData(),
      });
      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [1]);
      controller.detach(mockEventbus);

      controller.attach(mockEventbus);
      mockEventbus.broadcast('timeline-time', [1.5]);

      expect(container.html()).toBe('Hello World');
      controller.detach(mockEventbus);
      container.remove();
    });
  });
});
