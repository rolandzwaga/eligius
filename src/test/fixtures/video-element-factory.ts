import {type MockInstance, vi} from 'vitest';

/**
 * Helpers for testing code that drives a native HTMLMediaElement under
 * jsdom. jsdom does not implement `play()`, `pause()` or `load()` (they log
 * "Not implemented" and return undefined), never fires media events, and has
 * no `error` property; these helpers fill those gaps.
 */

/**
 * The prototype stubs installed by {@link installMediaElementStubs}.
 */
export interface IMediaElementStubs {
  play: MockInstance<HTMLMediaElement['play']>;
  pause: MockInstance<HTMLMediaElement['pause']>;
  load: MockInstance<HTMLMediaElement['load']>;
  canPlayType: MockInstance<HTMLMediaElement['canPlayType']>;
}

/**
 * The read-only (or jsdom-missing) media members a test can define per
 * element.
 */
export type TMediaProperty =
  | 'duration'
  | 'readyState'
  | 'networkState'
  | 'error'
  | 'currentTime'
  | 'seekable';

/**
 * Stubs `HTMLMediaElement.prototype`: `play` resolves, `pause` and `load` do
 * nothing, `canPlayType` returns 'maybe'. Call it in `beforeEach`; the
 * `restoreMocks` setting restores the prototype after each test.
 *
 * @returns the stubs, to assert calls or change behaviour per test
 */
export function installMediaElementStubs(): IMediaElementStubs {
  const proto = HTMLMediaElement.prototype;
  return {
    play: vi.spyOn(proto, 'play').mockResolvedValue(undefined),
    pause: vi.spyOn(proto, 'pause').mockImplementation(() => {}),
    load: vi.spyOn(proto, 'load').mockImplementation(() => {}),
    canPlayType: vi.spyOn(proto, 'canPlayType').mockReturnValue('maybe'),
  };
}

/**
 * The single `<video>` inside `root`.
 *
 * @param root - Where to look (default: the document)
 * @returns the video element
 * @throws when there is no video element or more than one
 */
export function getVideoElement(root: ParentNode = document): HTMLVideoElement {
  const videos = root.querySelectorAll('video');
  if (videos.length !== 1) {
    throw new Error(`Expected one video element, found ${videos.length}`);
  }
  return videos[0];
}

/**
 * The `<source>` children of a video element, in document order.
 *
 * @param video - The video element
 * @returns its source children
 */
export function getSourceElements(
  video: HTMLVideoElement
): HTMLSourceElement[] {
  return [...video.querySelectorAll('source')];
}

/**
 * Defines a media member on one element (`Object.defineProperty` with
 * `configurable: true`), shadowing the prototype getter.
 *
 * @param media - The media element
 * @param name - The member to define
 * @param value - Its value
 */
export function setMediaProperty(
  media: HTMLMediaElement,
  name: TMediaProperty,
  value: unknown
): void {
  Object.defineProperty(media, name, {
    configurable: true,
    writable: true,
    value,
  });
}

/**
 * A TimeRanges-like object.
 *
 * @param ranges - The [start, end] ranges
 * @returns an object implementing TimeRanges
 */
export function timeRanges(...ranges: Array<[number, number]>): TimeRanges {
  const rangeAt = (index: number): [number, number] => {
    const range = ranges[index];
    if (!range) {
      throw new RangeError(`No time range at index ${index}`);
    }
    return range;
  };
  return {
    length: ranges.length,
    start: (index: number) => rangeAt(index)[0],
    end: (index: number) => rangeAt(index)[1],
  };
}

/**
 * Dispatches a plain, non-bubbling Event, as browsers do for media events.
 *
 * @param target - The element (video or source) to dispatch on
 * @param type - The event type
 */
export function emitMediaEvent(target: EventTarget, type: string): void {
  target.dispatchEvent(new Event(type));
}

/**
 * Makes the video look loaded and dispatches `canplay`: defines `readyState`
 * (default 4, HAVE_ENOUGH_DATA), `networkState` 1 (NETWORK_IDLE), `duration`
 * (default 60) and `seekable` [0, duration].
 *
 * @param video - The video element
 * @param options - Duration and ready state overrides
 */
export function makeReady(
  video: HTMLVideoElement,
  options: {duration?: number; readyState?: number} = {}
): void {
  const duration = options.duration ?? 60;
  setMediaProperty(video, 'readyState', options.readyState ?? 4);
  setMediaProperty(video, 'networkState', 1);
  setMediaProperty(video, 'duration', duration);
  setMediaProperty(video, 'seekable', timeRanges([0, duration]));
  emitMediaEvent(video, 'canplay');
}

interface IListenerRecord {
  target: EventTarget;
  type: string;
  listener: unknown;
  capture: boolean;
}

function captureFlag(options: unknown): boolean {
  if (typeof options === 'boolean') {
    return options;
  }
  if (typeof options === 'object' && options !== null) {
    return Boolean((options as {capture?: boolean}).capture);
  }
  return false;
}

/**
 * Spies (calling through) on `EventTarget.prototype.addEventListener` and
 * `removeEventListener` and reports the listeners added to a target and not
 * removed since. Install it before the code under test adds its listeners.
 *
 * @returns `activeOn(target)`, the listeners still registered on target
 */
export function trackEventListeners(): {
  activeOn(target: EventTarget): Array<{type: string; capture: boolean}>;
} {
  const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
  const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');

  const records = (spy: typeof add | typeof remove): IListenerRecord[] =>
    spy.mock.calls.map((call, index) => ({
      target: spy.mock.contexts[index] as EventTarget,
      type: call[0],
      listener: call[1],
      capture: captureFlag(call[2]),
    }));

  return {
    activeOn(target: EventTarget) {
      const active: IListenerRecord[] = [];
      const same = (a: IListenerRecord, b: IListenerRecord) =>
        a.type === b.type &&
        a.listener === b.listener &&
        a.capture === b.capture;
      // Replay adds and removes in call order
      const events = [
        ...records(add).map((record, index) => ({
          record,
          kind: 'add' as const,
          order: add.mock.invocationCallOrder[index],
        })),
        ...records(remove).map((record, index) => ({
          record,
          kind: 'remove' as const,
          order: remove.mock.invocationCallOrder[index],
        })),
      ]
        .filter(event => event.record.target === target)
        .sort((a, b) => a.order - b.order);
      for (const event of events) {
        const existing = active.findIndex(record => same(record, event.record));
        if (event.kind === 'add' && existing === -1) {
          active.push(event.record);
        } else if (event.kind === 'remove' && existing !== -1) {
          active.splice(existing, 1);
        }
      }
      return active.map(({type, capture}) => ({type, capture}));
    },
  };
}
